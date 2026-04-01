#!/usr/bin/env python3
"""
process_runes.py
----------------
Copies rune images from assets/runes/ (NEVER modified) to public/runes/.
Files in assets/runes/ are named:  N_id.png  (e.g. 1_lo.png, 10_ful.png)
Output files are named:            id.png    (e.g. lo.png,  ful.png)

Usage (from project root):
    python scripts/process_runes.py
"""

import os
import re
import shutil

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR   = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(ROOT_DIR, 'assets', 'runes')
OUTPUT_DIR = os.path.join(ROOT_DIR, 'public', 'runes')

# Pattern:  <number>_<id>.png
PATTERN = re.compile(r'^\d+_([a-z]+)\.png$', re.IGNORECASE)

def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f'Source : {ASSETS_DIR}')
    print(f'Sortie : {OUTPUT_DIR}')
    print()

    files = sorted(os.listdir(ASSETS_DIR))
    copied = 0
    errors = []

    for filename in files:
        m = PATTERN.match(filename)
        if not m:
            print(f'  IGNORE : {filename}')
            continue

        rune_id  = m.group(1).lower()
        src_path = os.path.join(ASSETS_DIR, filename)
        dst_path = os.path.join(OUTPUT_DIR, f'{rune_id}.png')

        try:
            shutil.copy2(src_path, dst_path)
            print(f'  OK  {filename}  ->  {rune_id}.png')
            copied += 1
        except Exception as e:
            msg = f'ERREUR {filename} : {e}'
            print(f'  {msg}')
            errors.append(msg)

    print()
    print(f'{copied} rune(s) copiee(s).')
    if errors:
        print(f'{len(errors)} erreur(s) :')
        for e in errors:
            print(f'  - {e}')

if __name__ == '__main__':
    main()
