#! /usr/bin/env python2.7

import sys
import csv

def con2year(con):
    return int(con) * 2 + 1787

fields = [
    ('congress_no', int, 1, 4),
    ('year', con2year, 1, 4),
    ('icpsr', int, 5, 10),
    ('state_no', int, 11, 13),
    ('district_no', int, 13, 15),
    ('state_name', str.strip, 16, 23),
    ('party', int, 24, 28),
    ('dim1', float, 41, 47),
    ('name', str.strip, 29, 40),
]

def parse_file(file):
    for l in file:
        yield { k: f(l[s:e]) for k,f,s,e in fields }

def main():
    file = sys.argv[1]

    writer = csv.DictWriter(sys.stdout, [f[0] for f in fields], delimiter='\t')
    writer.writeheader()

    for r in parse_file(open(file)):
        writer.writerow(r)

if __name__ == '__main__':
    main()
