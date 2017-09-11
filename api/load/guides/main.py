#!/usr/bin/python
import pymongo
import os

import gzip
import re
from Bio import SeqIO  # to read fasta
from Bio.Seq import Seq

def _fasta_to_dict(fasta_file):
    with gzip.open(fasta_file, "rt") as handle:  # only "r" doesnt work in python 3:
        dna_dict = SeqIO.to_dict(SeqIO.parse(handle, "fasta"))
    return dna_dict

# URL = 'mongodb://mongodb:27017'
# URL = 'mongodb://localhost:27017/'
URL = 'mongodb://geneassassin-importer:t5y6u7i8@130.60.240.99';


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
            "rank": -1,
            "mismatches": mismatch
            }

def loading_guides_from_folder(datadir):
    docs = []
    fasta=os.path.join(datadir, 'Danio_rerio.GRCz10.dna.toplevel.fa.gz')
    dna_dict = _fasta_to_dict(fasta)

    print('loading guides from: ' + datadir)
    for n in os.listdir(os.path.join(datadir,'guides')):
        with open(os.path.join(datadir,'guides',n)) as f:
            guides = {}
            for line in f.readlines():
                line = line.strip()
                #if (len(line) < 1 or line[0] == '#' or line.startswith('Zv9_scaff')):
                if len(line) < 1 or line[0] == '#':
                    continue
                try:
                    rec = parseRecord(line)
                    rec['gene'] = n.split('.')[0]
                    guides[rec['sequence']] = rec
                except:
                    print('error parsing: ' + line + ' from ' + n)
            scoresfile = os.path.join(datadir, 'scores', n.replace('.guides.', '.scores.'))
            if not os.path.exists(scoresfile):
                continue
            with open(scoresfile) as s:
                s.readline() #throw away the header
                for line in s.readlines():
                    line = line.strip()
                    if len(line) < 1:
                        continue
                    try:
                        rec = line.split('\t')
                        # 0 Rank
                        # 1 Gene_id	2 Exon_id
                        # 3 Guide_with_ngg	4 Guide_chr	5 Guide_start	6 Guide_stop	7 Guide_strand
                        if len(rec[3]) < 20:
                            print('WARN BAD guide sequence', rec[3])
                            chr=dna_dict[rec[4]]
                            if rec[7].startswith('-'):
                                rec[3] = str(chr[int(rec[5])-1-3:int(rec[6])].reverse_complement().seq)
                            else:
                                rec[3] = str(chr[int(rec[5])-1:int(rec[6])+3].seq)
                            print('WARN getting sequence from the fasta file',rec[3])

                        no_ngg_seq = rec[3][:20]  # remove ngg
                        if no_ngg_seq not in guides:
                            print('ERROR guide %s not in guides map %s, ' % (rec[3], s.name))
                            continue # move to the next guide
                            
                        g = guides[no_ngg_seq]
                        g['sequence'] = rec[3]
                        g['rank'] = int(rec[0])

                        # 8 SNP_score	9 Domain_score	10 Microhomology_score	11 CDS_penalty_score	12 Splicesite_penalty_score
                        #  13 Transcript_coverage_score	14 Exon_ranking_score	15 Total_score
                        g['snp_score'] = float(rec[8])
                        g['domain_score'] = float(rec[9])
                        g['microhomology_score'] = float(rec[10])
                        g['cds_penalty_score'] = float(rec[11])
                        g['splicesite_penalty_score'] = float(rec[12])
                        g['transcript_coverage_score'] = float(rec[13])
                        g['exon_ranking_score'] = float(rec[14])
                        g['application_score'] = float(rec[15])
                        g['score'] = round((g['biochemistry_score'] +g['application_score'] + g['offtarget_score']*3) / 5, 4)

                        if g['application_score'] >= -1.0 and g['application_score'] <=1.0:
                            docs.append(g)
                        else:
                            print('WARN application score outside the range',g['application_score'], 
                                  'skipping guide', g['gene'], '/', g['sequence'])
                    except:
                        print('error parsing: ' + line + ' from ' + n)

    print("{0} total guides".format(len(docs)))
    return docs

client = pymongo.MongoClient(URL)

def load_species(name):
    docs = loading_guides_from_folder(os.path.join('data', name))

    db = client[name]
    collection = db.guides
    result = collection.insert_many(docs)

    print('creating index')
    from pymongo import ASCENDING
    collection.create_index([('chromosome', ASCENDING), ('start', ASCENDING), ('end', ASCENDING)],
                name= "chr_region_idx", unique=False, background= False)
    collection.create_index([('gene', ASCENDING)],
                name= "gene_idx", unique=False, background= False)


if __name__ == '__main__':
    # for species_release in os.listdir('data/'):
    # for species_release in ['celegans-85','drerio-85','cintestinalis-85']:
    for species_release in ['drerio-85']:
        load_species(species_release)

    print('import done')
