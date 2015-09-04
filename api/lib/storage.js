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

    this.domainsInGenomicRegion = function domainsInGenomicRegion(species, chromosome, start, end) {
        var d = when.defer()
        queryGenomicRegion('domains', species, chromosome, start, end, function (docs) {
            var bed = docs.map(function (el) {
                return el.bed
            })
            d.resolve({species: species, chromosome: chromosome, start: start, end: end, domains: bed})
        }, function (err) {
            deferredImport.reject(err);
        });

        return d.promise
    }

    this.guidesInGenomicRegion = function guidesInGenomicRegion(species, chromosome, start, end) {
        var d = when.defer()
        queryGenomicRegion('guides', species, chromosome, start, end, function (docs) {
            var allGuides = []
            docs.forEach(function (el) {
                allGuides.push(el.bed)
            })
            d.resolve({species: species, chromosome: chromosome, start: start, end: end, guides: allGuides})
        }, function (err) {
            deferredImport.reject(err);
        });
        return d.promise
    }

    function queryGenomicRegion(collection, species, chromosome, start, end, resultsCollector, errorHandler) {
        log.info('queryGenomicRegion(%s, %s, %s, %s, %s)', collection, species, chromosome, start, end)
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
        db.collection(collection).find(query, {limit: 100}).toArray(function (err, docs) {
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
