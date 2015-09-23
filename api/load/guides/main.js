
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
    return line
}

var data = []
files.forEach(function(file) {
    var content = fs.readFileSync('data/' + file, "utf8")
    var lines = content.split('\n')
    lines = lines.map(parseRecord).filter(function(e) { return e !== undefined })
    if (lines.length > 0) {
    //record: 20      3248388 3248408 CCACACAGCTTCTGTTGCTC    0.35712 -       3248388 3248408 0,205,0
	var record = lines[0].split('\t')
	data.push({chromosome : record[0], 
		   start: parseInt(record[1]), 
		   end:   parseInt(record[2]),  
		   gene: file.substring(0, file.length - '.guides.txt'.length),
		   guides: lines
	    })
    }
})

console.log('total genes: ' + data.length)

var insertDocuments = function(db, callback) {
    var collection = db.collection('guides');

    collection.insertMany(data, {j: true}, function(err, result) {
	assert.equal(err, null);
	assert.equal(data.length, result.result.n);
	console.log("saved " + data.length + " guides");
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

