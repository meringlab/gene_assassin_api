var assert = require('assert');
var should = require('chai').should();
var expect = require('chai').expect;

describe('Storage', function () {
    var storage;
    before(function (done) {
        storage = require('../lib/storage')('mongodb://192.168.1.120:32769/drerio', function (err, _db) {
            if (err) {
                throw Error(err)
            }
            storage = _db;
            done() // It is now guaranteed to finish before 'it' starts.
        });
    })


    it('can fetch domains on a genomic region', function () {
        //var promise = storage.inGenomicRegion('drerio','9', 35088310, 35091575);
        var promise = storage.domainsInGenomicRegion('drerio', '7', 1009500, 1009600);
        return promise.then(function (res) {
            assert.equal(2, res.domains.length);
        })

    });
    it('can fetch guides on a genomic region', function () {
        //var promise = storage.inGenomicRegion('drerio','9', 35088310, 35091575);
        var promise = storage.guidesInGenomicRegion('drerio', '9', 35091800, 35091850);
        return promise.then(function (res) {
            assert.equal(5, res.guides.length);
        })

    });
    after(function(done) {
        if (storage) {
            storage.shutdown()
        }
        done()
    })
});
