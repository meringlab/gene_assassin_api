/**
 * Created by milans on 03/09/15.
 */

const when = require('when');
const _und = require('underscore');
const MongoClient = require('mongodb').MongoClient;
const Logger = require('mongodb').Logger;

const log = require('../lib/logger').child({
    source: 'storage'
});

function Storage(_db) {
    var db = _db;

  /**
   * Note: expects index on db.guides({chromosome+start+end})
   * @param species
   * @param regions
   * @param interval
   * @return {Promise}
   */
    this.guidesFrequencies = function guidesFrequencies(species, regions, interval) {
        //TODO check if species exists
        //var db = client.db(species)

        var d = when.defer();

        // regions is either a single region: "12:34900000-34999999",
        // or multiple: "23:27946750-27946874,23:27946875-27946999,23:27947000-27947124"
        var tasks = _und.map(regions.split(','), function(region) {
            const chr = region.split(":")[0]
            const range = region.split(":")[1].split('-')
            const start = parseInt(range[0], 10);
            const end = parseInt(range[1], 10);
            const promised = when.defer();

            db.collection('guides').aggregate([
                {"$match": {"$and": [{"chromosome": chr}, {"start": {"$gt": start, "$lt": end}}]}},
                {
                    "$group": {
                        "_id": {
                            "$subtract": [
                                {"$divide": ["$start", interval]},
                                {"$divide": [{"$mod": ["$start", interval]}, interval]}
                            ]
                        }, "features_count": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ], function(err, docs) {
                if (err) {
                    //TODO check if this makes promise reject result
                    log.error(err, 'failed to get aggregate guide frequencies for %s', region);
                    promised.reject(err);
                    return;
                }
                _und.each(docs, function(d) {
                    d.features_count = Math.log10(d.features_count);
                    d.start = start;
                    d.end = end;
                    d.chromosome = chr;
                });
                if (docs.length === 0) {
                    docs.push({
                        features_count: 0,
                        start: start,
                        end: end,
                        chromosome: chr
                    });
                }
                var ex = {
                    "id": region,
                    //"time": 0,
                    //"dbTime": -1,
                    //"numResults": -1,
                    //"numTotalResults": -1,
                    //"warningMsg": "",
                    //"errorMsg": "",
                    "resultType": "frequencies",
                    "result": docs
                };
                promised.resolve(ex);
            });
            return promised.promise;
        });

        when.all(tasks).then(function(results) {
            var queryOptions = {
                species: species,
                // "assembly": "Zv9", //TODO
                type: 'guideFrequencies',
                "interval": interval,
                //limit: 1000,
                "histogram": "true",
                "skip": -1,
                "count": false,
                "histogramLogarithm": "true"
            };

            d.resolve({
                "apiVersion": "v1",
                "warning": "",
                "error": "",
                "queryOptions": queryOptions,
                "response": results
            });
        }).catch(function(err) {
            log.error(err, 'failed to get guide frequencies for %s - %s', 'drerio', region)
            var e = Error("guidesFrequencies FAILED: " + err.message);
            d.reject(e);
        });
        return d.promise;
    };

    this.geneGuides = function geneGuides(species, gene) {
        //TODO check if species exists
        //var db = client.db(species)

        var d = when.defer()
        //expects index on db.guides({gene:1})
        db.collection('guides').find({gene: gene}, {limit: 2000}).toArray(function (err, docs) {
            if (err) {
                log.error(err, 'failed to get guides for %s', gene)
                var e = Error("geneGuides FAILED: " + err.message);
                d.reject(e);
                return
            }
            docs.forEach(function (el) {
                delete el._id
            })
            docs.sort(function(g1, g2) { return g2.score - g1.score});
            d.resolve({
                "apiVersion": "v1",
                "warning": "",
                "error": "",
                "queryOptions": {gene : gene /*TODO species*/},
                "response": [{
                    "time": 0,
                    "dbTime": 5,
                    "numResults": docs.length,
                    "numTotalResults": docs.length, //fixme - not true!
                    "warningMsg": "",
                    "errorMsg": "",
                    "resultType": "guides",
                    "result": docs
                }]
            });
        });
        return d.promise;
    }

    this.primersInGenomicRegion = function primersInGenomicRegion(species, chromosome, start, end) {
        var d = when.defer()
        queryGenomicRegion('primers', species, chromosome, start, end, 1000, function (docs) {
            docs.forEach(function (el) {
                delete el._id
            })
            d.resolve({
                "apiVersion": "v1",
                "warning": "",
                "error": "",
                "queryOptions": {},
                "response": [{
                    "id": chromosome + ':' + start + '-' + end,
                    "time": 0,
                    "dbTime": 5,
                    "numResults": docs.length,
                    "numTotalResults": docs.length, //fixme - not true!
                    "warningMsg": "",
                    "errorMsg": "",
                    "resultType": "primers",
                    "result": docs
                }]
            })
        }, function (err) {
            d.reject(err);
        });

        return d.promise
    }

    function query(resultType, species, chromosome, start, end, featureSizeConst) {
        var startingTime = process.hrtime()
        var d = when.defer()

        function resultsCollector(docs) {
            var diff = process.hrtime(startingTime)
            var elapsed = diff[1] / 1000000; // divide by a million to get from nano to milli
            var elapsedTimeInMilliSeconds = Math.round(diff[0] * 1000 + elapsed)
            docs.forEach(function(el) {
                delete el._id
            });

            d.resolve({
                'id': chromosome + ':' + start + '-' + end,
                'resultType': resultType,
                'numResults': docs.length,
                'numTotalResults': docs.length,
                'dbTime': elapsedTimeInMilliSeconds + 'ms',
                'queryOptions': { 'species': species, chromosome: chromosome, start: start, end: end },
                'result': docs
            })
        };
        if (featureSizeConst === undefined) {
            queryGenomicRegion(resultType, species, chromosome, start, end, 1000, resultsCollector, function(err) {
                deferredImport.reject(err);
            });
        } else {
            const query = {
                //TODO check border conditionst
                chromosome: chromosome, $and: [
                    {start: {$gt: start - featureSizeConst + 1}},
                    {start: {$lt: end}}
                ]
            };
            queryCollection(resultType, query, 1000, chromosome, start, end, resultsCollector, function(err) {
                deferredImport.reject(err);
            });
        }

        return d.promise
    }

    this.proteinsInGenomicRegion = function proteinsInGenomicRegion(species, chromosome, start, end) {
        return query('proteins', species, chromosome, start, end);
    };

    this.guidesInGenomicRegion = function guidesInGenomicRegion(species, chromosome, start, end) {
        return query('guides', species, chromosome, start, end, 20);
    }

  /**
   * @deprecated part of protein now
   */
    this.domainsInGenomicRegion = function domainsInGenomicRegion(species, chromosome, start, end) {
        var d = when.defer()
        queryGenomicRegion('domains', species, chromosome, start, end, 100, function (docs) {
            var bed = docs.map(function (el) {
                return el.bed
            })
            d.resolve({species: species, chromosome: chromosome, start: start, end: end, domains: bed})
        }, function (err) {
            deferredImport.reject(err);
        });

        return d.promise
    }

    function queryCollection(collection, query, limit, chromosome, start, end, resultsCollector, errorHandler) {
//var db = client.db(species)
        db.collection(collection).find(query, { limit: limit }).toArray(function(err, docs) {
            if (err) {
                log.error(err, 'failed to get %s on [%s,%s,%s]', collection, chromosome, start, end)
                var e = Error("queryGenomicRegion FAILED: " + err.message);
                errorHandler(e);
                return;
            }
            resultsCollector(docs);
        })
    }

    function queryGenomicRegion(collection, species, chromosome, start, end, limit, resultsCollector, errorHandler) {
        log.info('queryGenomicRegion(%s, %s, %s, %s, %s)', collection, species, chromosome, start, end)
        limit = limit || 100;
        //TODO check params, start-end ints!
        /*
         db.domains.find({chromosome: '7', $or : [ {start: {"$lt" : 1009500}, end : {"$gt" : 1009500}}, {start: {"$gt" : 1009500}, start : {"$lt" : 1009550}}        ]}, {start:1, end:1})
         */
        const query = {
            chromosome: chromosome, $or: [
                //these 2 should cover all 4 possible cases:
                {start: {$lt: start}, end: {$gt: start}},
                {start: {$lt: end}, end: {$gt: start}}
            ]
        };
        queryCollection(collection, query, limit, chromosome, start, end, resultsCollector, errorHandler);

    }

    this.shutdown = function shutdown() {
        if (db) {
            log.info('shutting down')
            db.close()
        }
    }
}

exports = module.exports = function (URL, callback) {
    log.info('using server: ' + URL)
    const mongodbOptions = {
        "server": {
            "poolSize" : 100, //5 by default
            "sslValidate": false,
            "ssl": false,
            "connectWithNoPrimary": true, //our data is read-only so this is safe
            "readPreference": MongoClient.connect.ReadPreference.NEAREST,
            "reconnectTries": 100,
            "reconnectInterval": 30000,
        }
    };

    MongoClient.connect(URL, mongodbOptions, function (err, _db) {
        if (err) {
            log.error('failed to connect to ' + URL, err)
            callback(err, undefined)
            //throw Error(err)
            return
        }
        if (process.env.NODE_ENV === 'development') {
            Logger.setLevel('debug');
        }
        log.info("Connected correctly to server");
        callback(undefined, new Storage(_db));
    });
};
