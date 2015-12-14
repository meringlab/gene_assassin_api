#!/usr/bin/python
import pymongo
import os

URL = 'mongodb://mongodb:27017/';
#URL = 'mongodb://172.16.75.133:32769/';
DB = 'drerio'

def parseRecord(line):
    '''
    #12 35031290 35031310 - GAGGCACGCAGGAGGCTCAG 0.2437 0.7806 0.7237 0.6391 184,71,0 3,1,0,1,0
    0  chromosome
    1  kmer_start
    2  kmer_end
    3  strand
    4  kmer
    5  biochemistry_score
    6  application_score
    7  offtarget_score
    8  combined_score
    9  RGB_of_score
   10  offtarget_profile
    '''
    rec = line.split('\t')
    return {"chromosome" : rec[0],
            "start" : int(rec[1]),
            "end":    int(rec[2]),
            "strand": rec[3],
            "sequence": rec[4],
            "biochemistry_score": float(rec[5]),
            "application_score": float(rec[6]),
            "offtarget_score": float(rec[7]),
            "score": float(rec[8]),
            "color": rec[9]
            }
docs = []

print('loading guides from files')
for n in os.listdir('data'):
    with open('data/' +n) as f:
        for line in f.readlines():
            line = line.strip()
            if (len(line) < 1 or line[0] == '#' or line.startswith('Zv9_scaff')):
                continue
            try:
                rec = parseRecord(line)
                rec['gene'] = n.split('.')[0]
                docs.append(rec)
            except:
                print('error parsing: ' + line + ' from ' + n)

print("{0} total guides".format(len(docs)))

client = pymongo.MongoClient(URL)
db = client[DB]

collection = db.guides


result = collection.insert_many(docs)

print('creating index')
from pymongo import ASCENDING
collection.create_index([('chromosome', ASCENDING), ('start', ASCENDING), ('end', ASCENDING)],
            name= "chr_region_idx", unique=False, background= False, j= True)
print('import done')
