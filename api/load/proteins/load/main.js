
const URL = 'mongodb://mongodb:27017/drerio';

var MongoClient = require('mongodb').MongoClient
var assert = require('assert');

var fs = require('fs')
var files = fs.readdirSync('data')

function parseRecord(line) {
    line = line.trim()
    if (line.length == 0 || line.charAt(0) === '#'){
	return;
    }
    if (line.indexOf('browser position') > -1) {
	console.log("ERROR, another browser position! " + line)
	return
    }
    var records = line.split('\t')
    return {chromosome : records[0],start: records[1], end:   records[2],  bed:   line + '\t-\t-\t83,88,95'/*color*/}
}

var domains = []
files.forEach(function(file) {
/*
this throws "Error: EMFILE", probably because of too many open files
    fs.readFile('data/' + file, function(err, data) { 
	if (err) {
	    throw Error("ERROR reading " + file + ": " + err);
	}
	var geneDomains = data.split('\n').map(parseRecord)
	Array.prototype.push.apply(domains, geneDomains)
    })
*/
    var data = fs.readFileSync('data/' + file, "utf8")
    var lines = data.split('\n').slice(2) // skip browser position
    var geneDomains = lines.map(parseRecord).filter(function(e) { return e !== undefined })
    Array.prototype.push.apply(domains, geneDomains)
})

console.log('total domains: ' + domains.length)

var insertDocuments = function(db, callback) {
    var collection = db.collection('domains');

    collection.insertMany(domains, {j: true}, function(err, result) {
	assert.equal(err, null);
	assert.equal(domains.length, result.result.n);
	console.log("saved " + domains.length + " domains");
	//create compound index, {chromosome, start, end}
	collection.createIndex({chromosome : 1, start : 1, end : 1}, 
			       {name: "chr_region_idx", unique:false, background:false, j: true}, 
			       function(err, indexName) {
				   callback(result);
			       });
    })
}

// Use connect method to connect to the Server 
MongoClient.connect(URL, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
 
    insertDocuments(db, function() {
	db.close();
    });

});

