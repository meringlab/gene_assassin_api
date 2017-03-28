#!/usr/bin/python
import pymongo
import os
import sys

URL = 'mongodb://mongodb:27017/';
#URL = 'mongodb://localhost:27017/';


def parseRecord(record):
    '''
    sample record:
    # 0:chromosome    1:start   2:end 3:left_end    4:left_seq    5:left_tm     6:right_start     7:right_seq    8:right_tm
    10	10296260	10296497    10296282	GGCTTGCAACATTTCTTTGAAT	60.5	10296475		AATCGAAGCTCTCATTCTCCAG	60.00
    '''
    p = record.strip().split('\t')
    return {
        "chromosome" : p[0],
        "start"      : int(p[1]),
        "end"        : int(p[2]),
        "left"       : {
             "end"   : int(p[3]),
          "sequence" : p[4],
              "Tm"   : float(p[5]),
        },
        "right"      : {
             "start"   : int(p[6]),
          "sequence" : p[7],
              "Tm"   : float(p[8])
        }
       }

def saveToMongo(dbname, docs):
    print('saving primers in %s' % dbname)
    client = pymongo.MongoClient(URL)
    db = client[dbname]

    collection = db.primers

    result = collection.insert_many(docs)

    print('creating index')
    from pymongo import ASCENDING
    collection.create_index([('chromosome', ASCENDING), ('start', ASCENDING), ('end', ASCENDING)],
                name= "chr_region_idx", unique=False, background= False, j= True)
    print('done')


def loadRecords(inputfile):
    print('loading data from %s' % inputfile)
    records = []

    with open(inputfile) as f:
        for line in f.readlines():
            try:
                records.append(parseRecord(line))
            except:
                print('error parsing: ' + line)
                print('%s %s' % sys.exc_info()[:2])
    print(str(len(records)) + " total records")
    return records

if __name__ == '__main__':
    for primersFile in os.listdir('data'):
        docs = loadRecords(os.path.join('data', primersFile))
        db_name = primersFile.split('.')[0] # species-release_number
        saveToMongo(db_name, docs)

    print('import done')

