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
        var promise = storage.inGenomicRegion('drerio','7', 1009500, 1009600);
        return promise.then(function (err, domains) {
            assert.equal(2, domains.length);
        })

    });
    after(function(done) {
        if (storage) {
            storage.shutdown()
        }
        done()
    })
});
