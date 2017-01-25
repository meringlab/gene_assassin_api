#!/usr/bin/python

import os

def parseRecord(line):
    rec = line.split('\t')

    return {
        "chr": rec[0],
        "start" : int(rec[1]),
        "end":    int(rec[2])
        }

docs = {}

print('loading proteins from files')
for n in os.listdir('../canonical'):
    gene = n.split('.')[0]
    with open('../canonical/' +n) as f:
        geneProteins = []
        for line in f.readlines():
            line = line.strip()
            if (len(line) < 1 or line[0] == '#'):
                continue
            try:
                rec = parseRecord(line)
                chromosome = rec.pop('chr')
                geneProteins.append(rec)
            except:
                print('error parsing: ' + line + ' from ' + n)
    if len(geneProteins) == 0:
        continue

    if chromosome.startswith('Zv9'):
        continue

    if not chromosome in docs:
        docs[chromosome] = []

    docs[chromosome].append({'gene':gene, 'chr': chromosome, 'proteins': geneProteins}) 
    chromosome = None

print(str(len(docs)) + " total chromosomes")

def getOverlap(a, b):
    return max(0, min(a['end'], b['end']) - max(a['start'], b['start']))

def check_overlap(g1,g2):
    for p1 in g1['proteins']:
        for p2 in g2['proteins']:
            if getOverlap(p1,p2) > 0:
                print('{} and {} overlap at {}:{:d}-{:d}'.format(g1['gene'], g2['gene'],g1['chr'],min(p1['start'],p2['start']), max(p1['end'], p2['end']) ))
                return

    
for chr in docs:
    genes = docs[chr]
    for i in range(0,len(genes)-1):
        for j in range(i+1,len(genes)):
            check_overlap(genes[i],genes[j])

