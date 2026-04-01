"""
Resize rune images from assets/runes/ to public/runes/ at 256x256.
Run from the project root: python scripts/resize_runes.py
"""
from PIL import Image
import os, glob

SRC = 'assets/runes'
DST = 'public/runes'
TARGET = 256

os.makedirs(DST, exist_ok=True)
updated = []
for path in glob.glob(f'{SRC}/*.png'):
    name = os.path.basename(path)
    Image.open(path).resize((TARGET, TARGET), Image.LANCZOS).save(f'{DST}/{name}', optimize=True)
    updated.append(name)

print(f'{len(updated)} rune(s) redimensionnées → {DST}/')
for n in sorted(updated):
    print(f'  {n}')
