#!/usr/bin/python
import pymongo
import os
import path

URL = 'mongodb://mongodb:27017/';
#URL = 'mongodb://172.16.75.133:32769/';
DB = 'drerio'

def parseRecord(line):
    rec = line.split('\t')
    return {"chromosome" : rec[0],
            "start" : int(rec[1]),
            "end":    int(rec[2]),
            "bed": line}

docs = []

print('loading guides from files')
for n in os.listdir('data'):
    with open('data/' +n) as f:
        for line in f.readlines():
            line = line.strip()
            if (len(line) < 1 or line[0] == '#' or line.startswith('Zv9_scaff')):
                continue
            try:
                docs.append(parseRecord(line))
            except:
                print('error parsing: ' + line + ' from ' + n)

print(len(docs) + " total guides")

client = pymongo.MongoClient(URL)
db = client[DB]

collection = db.guides


result = collection.insert_many(docs)

print('creating index')
from pymongo import ASCENDING
collection.create_index([('chromosome', ASCENDING), ('start', ASCENDING), ('end', ASCENDING)],
            name= "chr_region_idx", unique=False, background= False, j= True)
print('import done')
