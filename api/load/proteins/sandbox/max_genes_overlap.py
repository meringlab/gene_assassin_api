#!/usr/bin/python

import os

docs = {}

print('loading transcripts')
transcripts = {}
with open('transcripts.txt') as f:
        line = f.readline()
        for line in f.readlines():
            line = line.strip()
            rec = line.split('\t')
            if rec[1].startswith('Zv9'):
                continue
            transcripts[rec[0]] = {'transcript' : rec[0], 'chr': rec[1], 'start' : int(rec[2]), 'end': int(rec[3])}

print(str(len(transcripts)) + ' total transcripts')

print('loading proteins from files')
for n in os.listdir('../canonical'):
    with open('../canonical/' +n) as f:
        line = f.readline().strip()
        try:
            tr = transcripts[line.split('\t')[2]]
            if not tr['chr'] in docs:
                docs[tr['chr']] = []
            docs[tr['chr']].append(tr) 
        except:
            print('error parsing ' + n)

print(str(len(docs)) + " total chromosomes")

def getOverlap(a, b):
    return max(0, min(a['end'], b['end']) - max(a['start'], b['start']))

def check_overlap(t1, t2):
    if getOverlap(t1, t2) > 0:
        print('overlap over {}, at {}:{:d}-{:d}'.format(t2['transcript'],t2['chr'], t2['start'],t2['end']))


for chr in docs:
    alltr = docs[chr]
    for i in range(0,len(alltr)-2):
        for j in range(i+1,len(alltr)-1):
            if getOverlap(alltr[i],alltr[j]) > 0:
                tmp = {'start':max(alltr[i]['start'],alltr[j]['start']), 'end':min(alltr[i]['end'],alltr[j]['end'])}
                for k in range(j+1,len(alltr)):
                    check_overlap(tmp, alltr[k])

