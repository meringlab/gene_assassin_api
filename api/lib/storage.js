/**
 * Created by milans on 03/09/15.
 */

const when = require('when');
const bunyan = require('bunyan');
const MongoClient = require('mongodb').MongoClient

function Storage(_db) {
    var db = _db;
    const log = bunyan.createLogger({
        name: "ga-API-domains",
        module: "storage/mongodb"
        , server: db.serverConfig.host
    });

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

  function query(resultType, species, chromosome, start, end){
        var startingTime = process.hrtime()
        var d = when.defer()
        queryGenomicRegion(resultType, species, chromosome, start, end, 1000, function (docs) {
            var diff = process.hrtime(startingTime)
            var elapsed = diff[1] / 1000000; // divide by a million to get from nano to milli
            var elapsedTimeInMilliSeconds = Math.round(diff[0] * 1000 + elapsed)
            docs.forEach(function (el) {
                delete el._id
            });

            d.resolve({
                'id': chromosome + ':' + start + '-' + end,
                'resultType': resultType,
                'numResults': docs.length,
                'numTotalResults': docs.length,
                'dbTime': elapsedTimeInMilliSeconds + 'ms',
                'queryOptions' : {'species': species, chromosome: chromosome, start: start, end: end},
                'result': docs
            })
        }, function (err) {
            deferredImport.reject(err);
        });

        return d.promise
    }

    this.proteinsInGenomicRegion = function proteinsInGenomicRegion(species, chromosome, start, end) {
        return query('proteins', species, chromosome, start, end);
    };

    this.guidesInGenomicRegion = function guidesInGenomicRegion(species, chromosome, start, end) {
        return query('guides', species, chromosome, start, end);
    }

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
        //var db = client.db(species)
        db.collection(collection).find(query, {limit: limit}).toArray(function (err, docs) {
            if (err) {
                log.error(err, 'failed to get %s on [%s,%s,%s]', collection, chromosome, start, end)
                var e = Error("domainsInGenomicRegion FAILED: " + err.message);
                errorHandler(e)
                return
            }
            resultsCollector(docs)
        })

    }

    this.shutdown = function shutdown() {
        if (db) {
            log.info('shutting down')
            db.close()
        }
    }
}

exports = module.exports = function (URL, callback) {
    const log = bunyan.createLogger({
        name: "ga-API-domains",
        module: "storage/exports"
    });
    log.info('using server: ' + URL)

    MongoClient.connect(URL, function (err, _db) {
        if (err) {
            log.error('failed to connect to ' + URL, err)
            callback(err, undefined)
            //throw Error(err)
            return
        }
        log.info("Connected correctly to server");
        callback(undefined, new Storage(_db));
    });
};
