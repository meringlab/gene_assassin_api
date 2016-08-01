var assert = require('assert');
var should = require('chai').should();
var expect = require('chai').expect;

describe('Storage', function () {
    var storage;
    before(function (done) {
        storage = require('../lib/storage')('mongodb://127.0.0.1:27017/drerio-grcz10', function (err, _db) {
            if (err) {
                throw Error(err)
            }
            storage = _db;
            done() // It is now guaranteed to finish before 'it' starts.
        });
    });

    it('can fetch proteins on a genomic region', function () {
        var promise = storage.proteinsInGenomicRegion('drerio', '4', 100000, 110000);
        return promise.then(function (res) {
            assert.equal(1, res.numResults);
        });
    });
    it('can fetch guides on a genomic region', function () {
        var promise = storage.guidesInGenomicRegion('drerio', '4', 82100, 82120);
        return promise.then(function (res) {
            assert.equal(2, res.numResults);
        });
    });
    after(function(done) {
        if (storage) {
            storage.shutdown()
        }
        done()
    })
});
