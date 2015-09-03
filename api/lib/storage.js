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
        ,server: db.serverConfig.host
    });

    this.inGenomicRegion = function inGenomicRegion(species, chromosome, start, end) {
        //TODO check params
        var d = when.defer()
        const query = {
            chromosome: chromosome, $or: [
                {start: {$gt: start}, end: {$lt: end}},
                {start: {$lt: start}, end: {$gt: start}}]
        };
        //var db = client.db(species)
        const collection = db.collection('domains');
        collection.find(query, {limit: 100, fields: {'bed':1}}).toArray(function (err, docs) {
            if (err) {
                log.error(err, 'failed to get domains on [%s,%s,%s]',chromosome, start, end)
                var e = Error("inGenomicRegion FAILED: " + err.message);
                deferredImport.reject(e);
                return
            }
            var res = docs.map(function(el) {
                return el.bed
            })
            d.resolve(res)
        })
        return d.promise
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
