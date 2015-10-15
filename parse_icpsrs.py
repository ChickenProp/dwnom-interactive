#! /usr/bin/env python2.7

import sys
import csv
from collections import Counter

def format_name(s):
    s = unicode(s.strip(), 'iso-8859-1').encode('utf-8').title()
    s = s.replace('Ii', 'II').replace('Ii', 'II')
    s = s.replace('%', '(').replace('<', ')')
    return s

def parse_file(file):
    return [ (int(l[5:10]), format_name(l[41:-1])) for l in file ]

def main():
    icpsrs = parse_file(open(sys.argv[1]))
    num_lines = Counter(icpsrs)

    uniq = sorted(set(icpsrs))
    num_names = Counter(t[0] for t in uniq)

    writer = csv.writer(sys.stdout, delimiter='\t', lineterminator='\n')
    writer.writerow(('dupe', 'icpsr', 'name'))

    last_i = None
    for i,n in uniq:
        alert = ('*%d' % num_lines[i,n]) if num_names[i] > 1 else ''
        last_i = i
        writer.writerow((alert, i, n))

if __name__ == '__main__':
    main()
