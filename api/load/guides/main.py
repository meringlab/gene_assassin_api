#!/usr/bin/python
import pymongo
import os

URL = 'mongodb://mongodb:27017'
#URL = 'mongodb://localhost:27017/'

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
   10  offtarget_profile: 
   10.1 #seed region patterns
   10.2 #guide patterns
   10.3 #1nt mismatch regions
   10.4 #2nt mismatch regions
   10.5 #3nt mismatch regions

    '''
    rec = line.split('\t')
    mismatch = '[' + ','.join(rec[10].split(',')[2:]) + ']'
    return {"chromosome" : rec[0],
            "start" : int(rec[1]),
            "end":    int(rec[2]),
            "strand": rec[3],
            "sequence": rec[4],
            "biochemistry_score": float(rec[5]),
            "application_score": float(rec[6]),
            "offtarget_score": float(rec[7]),
            "score": float(rec[8]),
            "color": rec[9],
            "mismatches": mismatch 
            }

def loading_guides_from_folder(datadir):
    docs = []

    print('loading guides from: ' + datadir)
    for n in os.listdir(os.path.join(datadir,'guides')):
        with open(os.path.join(datadir,'guides',n)) as f:
            gene_guides = []
            for line in f.readlines():
                line = line.strip()
                #if (len(line) < 1 or line[0] == '#' or line.startswith('Zv9_scaff')):
                if len(line) < 1 or line[0] == '#':
                    continue
                try:
                    rec = parseRecord(line)
                    rec['gene'] = n.split('.')[0]
                    docs.append(rec)
                    gene_guides.append(rec)
                except:
                    print('error parsing: ' + line + ' from ' + n)
            gene_guides.sort(key=lambda r: -r['score'])
            outof = ' out of ' + str(len(gene_guides))
            for idx, guide in enumerate(gene_guides):
                guide['rank'] = str(idx+1) + outof

    print("{0} total guides".format(len(docs)))
    return docs

client = pymongo.MongoClient(URL)

def load_species(name):
    db = client[name]

    collection = db.guides
    docs = loading_guides_from_folder(os.path.join('data', name))
    result = collection.insert_many(docs)

    print('creating index')
    from pymongo import ASCENDING
    collection.create_index([('chromosome', ASCENDING), ('start', ASCENDING), ('end', ASCENDING)],
                name= "chr_region_idx", unique=False, background= False, j= True)
    collection.create_index([('gene', ASCENDING)],
                name= "gene_idx", unique=False, background= False, j= True)


if __name__ == '__main__':
    for species_release in os.listdir('data/'):
        load_species(species_release)

    print('import done')
