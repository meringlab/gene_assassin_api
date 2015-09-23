const when = require('when');
var sequence = require('when/sequence');

const URL = 'mongodb://mongodb:27017/drerio';
//const URL = 'mongodb://192.168.1.120:32769/drerio';

var MongoClient = require('mongodb').MongoClient
var assert = require('assert');

var fs = require('fs')
var files = fs.readdirSync('data')

function parseRecord(line) {
    line = line.trim()
    if (line.length == 0 || line.charAt(0) === '#') {
        return;
    }
    //record: 20      3248388 3248408 CCACACAGCTTCTGTTGCTC    0.35712 -       3248388 3248408 0,205,0
    var record = line.split('\t')
    return {
        chromosome: record[0],
        start: parseInt(record[1]),
        end: parseInt(record[2]),
        bed: line
    }
}

var data = []
files.forEach(function(file) {
    var gene = file.substring(0, file.length - '.guides.txt'.length)
    var content = fs.readFileSync('data/' + file, "utf8")
    var lines = content.split('\n')
    var records = lines.map(parseRecord).filter(function (e) {
        return e !== undefined
    })
    records.forEach(function (el) {
        el.gene = gene;
        data.push(el)
    })
});

var total_records = data.length;
console.log('total guides: ' + total_records)

var insertDocuments = function (db, callback) {
    var collection = db.collection('guides');
    const chunk = 100000, slices = []

    for (var i = 0, j = data.length; i < j; i += chunk) {
        var currentSlice = data.slice(i, i + chunk);
        var close = function (slice) {
            return function () {
                return when.promise(function (resolve, reject) {
                    collection.insertMany(slice, {j: true}, function (err, result) {
                        if (err) {
                            reject(err)
                            return;
                        }
                        assert.equal(slice.length, result.result.n);
                        console.log("saved " + slice.length + " guides, at " + Date());
                        resolve()
                    })
                });
            };
        }
        slices.push(close(currentSlice))
    }
    return sequence(slices).then(function () {
        console.log('all saved')
        callback()
    })
}

MongoClient.connect(URL, function (err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    insertDocuments(db, function () {
        //create compound index, {chromosome, start, end}
        console.log("creating index")
        var collection = db.collection('guides');
        collection.createIndex({chromosome: 1, start: 1, end: 1},
            {name: "chr_region_idx", unique: false, background: false, j: true},
            function (err, indexName) {
                if (err) {
                    console.log('failed to create index! ' + err)
                }
                db.close();
            });
    });

});

