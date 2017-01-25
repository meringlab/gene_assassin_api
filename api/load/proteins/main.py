#!/usr/bin/python
import pymongo
import os

#URL = 'mongodb://mongodb:27017/';
URL = 'mongodb://localhost:27017/';

def parseDomains(domainsLines):
    domains = []
    for domainLine in domainsLines:
        domainRec = domainLine.strip().split('\t')
#4	14148174	14156060	-1	Nrf1_activation-bd	31.4	14148174-14156057,14148283-14156060	PF10492	http://pfam.sanger.ac.uk/family?acc=PF10492

#        domainExons = []
#        for de in domainRec[6].split(','):
#            parts = de.split('-')
#            domainExons.append({'start': int(parts[0]), 'end' : int(parts[1])})

        domains.append({
                "start" : int(domainRec[1]),
                "end"   : int(domainRec[2]),
                "name"  : domainRec[4],
                "score" : domainRec[5],
                "exons" : domainRec[6],
                "url"   : domainRec[8],
                "domainId" : domainRec[7]
                })
    return domains

def parseProtein(proteinLine):
    '''
    sample record:
    ##>P	ENSDARG00000000018	ENSDART00000000019	ENSDARP00000000019	4	14148126	14166937	-1	nuclear respiratory factor 1 [Source:ZFIN;Acc:ZDB-GENE-001221-1]
    '''

    p = proteinLine.strip().split('\t')
    return {
        "id"         : p[3],
        "name"       : p[3],
        "gene"       : p[1],
        "transcript" : p[2],
        "chromosome" : p[4],
        "start"      : int(p[5]),
        "end"        : int(p[6]),
        "strand"     : p[7],
        "annotation" : p[8]
        }

def parseExons(exonsLine):
    '''
    sample record:
    ##>E	ENSDARE00000155583,ENSDARE00000000051,ENSDARE00000000055,ENSDARE00000000058,ENSDARE00000000049,ENSDARE00000000052,ENSDARE00000000056,ENSDARE00000000057,ENSDARE00000000048,ENSDARE00000096976	1,1,1,1,1,1,1,0,1,0	14166715-14166937,14165689-14165803,14164991-14165117,14164769-14164912,14161938-14162096,14160543-14160743,14159260-14159361,14158759-14158946,14156057-14156181,14148123-14148283
    '''
    e      = exonsLine.strip().split('\t')
    exons  = []
    names  = e[1].split(',')
    coding = e[2].split(',')
    pos    = e[3].split(',')

    for i in range(len(names)):
        exons.append({
                "id"     : names[i],
                "name"   : names[i],
                "start"  : int(pos[i].split('-')[0]),
                "end"    : int(pos[i].split('-')[1])
                })
    return exons
        

def makeProteinRecord(proteinLine, exonsLine, domainsLines):
    protein = parseProtein(proteinLine)
    protein['exons'] = parseExons(exonsLine)
    protein['exons'].sort(key= lambda exon: exon['start'])
    protein['domains'] = parseDomains(domainsLines)
    protein['domains'].sort(key= lambda domain: domain['start'])
    return protein

def saveToMongo(dbname, docs):
    print('saving proteins in %s' % dbname)
    client = pymongo.MongoClient(URL)
    db = client[dbname]

    collection = db.proteins

    result = collection.insert_many(docs)

    print('creating index')
    from pymongo import ASCENDING
    collection.create_index([('chromosome', ASCENDING), ('start', ASCENDING), ('end', ASCENDING)],
                name= "chr_region_idx", unique=False, background= False, j= True)
    print('done')


def loadProteins(datadir):
    print('loading proteins from %s' % datadir)
    proteins = []
    for n in os.listdir(datadir):
        with open(os.path.join(datadir,n)) as f:
            protein = f.readline()
            exons   = f.readline()
            domains = f.readlines() # might be empty
            try:
                proteins.append(makeProteinRecord(protein, exons, domains))
            except:
                print('error parsing: ' + n)
    print(str(len(proteins)) + " total proteins")
    return proteins

if __name__ == '__main__':
    for species_release in os.listdir('canonical'):
        docs = loadProteins(os.path.join('canonical', species_release))
        saveToMongo(species_release, docs)

    print('import done')

