#!/usr/bin/python
import os

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
                "end"   : int(domainRec[2])
                })
    return domains

def getOverlap(a, b):
    return max(0, min(a['end'], b['end']) - max(a['start'], b['start']))

def isOverlapping(domains):
    if (len(domains) < 2):
        return False
    if (len(domains) > 1):
        # domains.sort(key= lambda domain: domain['start'])
        num_domains = len(domains)
        for i in range(len(domains)-1):
            d1 = domains[i]
            for d2 in domains[i+1:]:
                if getOverlap(d1,d2) > 0:
                    return True
    return False

if __name__ == '__main__':
    print('finding overlapping domains from files')
    overlapping_domains = []
    numProteins = 0
    for n in os.listdir('../canonical'):
        with open('../canonical/' +n) as f:
            protein = f.readline()
            exons   = f.readline()
            domainsLines = f.readlines() # might be empty
            try:
                domains = parseDomains(domainsLines)
                if isOverlapping(domains):
                    overlapping_domains.append(n)
                numProteins = numProteins + 1
            except:
                print('error parsing: ' + n)
    print('# total proteins: ' + str(numProteins))
    print('# overlapping domains: ' + len(overlapping_domains))
    print('percentage overlapping: ' + str(100.0 * len(overlapping_domains)/numProteins))
    
