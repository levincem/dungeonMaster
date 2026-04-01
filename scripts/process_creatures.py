"""
Process creature images from assets/creatures/ -> public/sprites/creatures/
- Remove white background (scipy connected components)
- Bottom-crop for giantScorpion, oitu, waterElemental
- Assemble 3 frames horizontally (1024x1024 each -> 3072x1024)
- Single frame for lordOrder (25) and greyLord (26)
"""

import os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = 'assets/creatures'
DST = 'public/sprites/creatures'
os.makedirs(DST, exist_ok=True)

FRAME_W = 1024
FRAME_H = 1024
BOTTOM_MARGIN = 50

CREATURES = {
     0: ('giantScorpion', False),
     1: ('swampSlime',    False),
     2: ('giggler',       False),
     3: ('wizardsEye',    False),
     4: ('painRat',       False),
     5: ('ruster',        False),
     6: ('screamer',      False),
     7: ('RockPile',      False),
     8: ('ghost',         False),
     9: ('stoneGolem',    False),
    10: ('mummy',         False),
    11: ('blackFlame',    False),
    12: ('skeleton',      False),
    13: ('couatl',        False),
    14: ('vexirk',        False),
    15: ('magentaWorm',   False),
    16: ('trolin',        False),
    17: ('giantWasp',     False),
    18: ('armouredArmor', False),
    19: ('materializer',  False),
    20: ('waterElemental',False),
    21: ('oitu',          False),
    22: ('demon',         False),
    23: ('lordChaos',     False),
    24: ('redDragon',     False),
    25: ('lordOrder',     True),
    26: ('greyLord',      True),
}

BOTTOM_CROP = {'giantScorpion', 'oitu', 'waterElemental'}


def remove_white_bg(img):
    img = img.convert('RGBA')
    data = np.array(img, dtype=np.float32)
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    is_white = (r > 220) & (g > 220) & (b > 220)
    labeled, _ = ndimage.label(is_white)
    border_mask = np.zeros(is_white.shape, bool)
    border_mask[0,:] = border_mask[-1,:] = True
    border_mask[:,0] = border_mask[:,-1] = True
    border_labels = set(labeled[is_white & border_mask]) - {0}
    bg_mask = np.isin(labeled, list(border_labels))
    dilated = ndimage.binary_dilation(bg_mask, iterations=2)
    feather = dilated & ~bg_mask
    whiteness = np.minimum(np.minimum(r, g), b) / 255.0
    alpha = np.where(bg_mask, 0, np.where(feather, (1.0 - whiteness) * 255, 255))
    result = data.copy()
    result[:,:,3] = np.clip(alpha, 0, 255)
    return Image.fromarray(result.astype(np.uint8), 'RGBA')


def bottom_crop_and_fit(img):
    data = np.array(img)
    alpha = data[:,:,3]
    rows_with_content = np.where(alpha.max(axis=1) > 10)[0]
    if len(rows_with_content) == 0:
        return fit_to_frame(img)
    bottom_row = rows_with_content[-1]
    crop_bottom = min(img.height, bottom_row + BOTTOM_MARGIN)
    cropped = img.crop((0, 0, img.width, crop_bottom))
    scale = min(FRAME_W / cropped.width, FRAME_H / cropped.height)
    new_w = int(cropped.width * scale)
    new_h = int(cropped.height * scale)
    scaled = cropped.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - new_w) // 2
    y = FRAME_H - new_h
    canvas.paste(scaled, (x, y))
    return canvas


def fit_to_frame(img):
    if img.size == (FRAME_W, FRAME_H):
        return img
    scale = min(FRAME_W / img.width, FRAME_H / img.height)
    new_w = int(img.width * scale)
    new_h = int(img.height * scale)
    scaled = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    x = (FRAME_W - new_w) // 2
    y = (FRAME_H - new_h) // 2
    canvas.paste(scaled, (x, y))
    return canvas


for type_id, (prefix, single) in sorted(CREATURES.items()):
    out_path = os.path.join(DST, 'creature_%d.png' % type_id)
    needs_crop = prefix in BOTTOM_CROP
    try:
        if single:
            src = os.path.join(SRC, '%s.png' % prefix)
            img = remove_white_bg(Image.open(src))
            img = fit_to_frame(img)
            img.save(out_path)
            print('  [%2d] %s (single) -> creature_%d.png' % (type_id, prefix, type_id))
        else:
            frames = []
            for i in [1, 2, 3]:
                src = os.path.join(SRC, '%s_%d.png' % (prefix, i))
                img = remove_white_bg(Image.open(src))
                img = bottom_crop_and_fit(img) if needs_crop else fit_to_frame(img)
                frames.append(img)
            sheet = Image.new('RGBA', (FRAME_W * 3, FRAME_H))
            for i, f in enumerate(frames):
                sheet.paste(f, (i * FRAME_W, 0))
            sheet.save(out_path)
            tag = ' [BOTTOM-CROP]' if needs_crop else ''
            print('  [%2d] %s%s -> creature_%d.png' % (type_id, prefix, tag, type_id))
    except Exception as e:
        print('  [%2d] ERROR %s: %s' % (type_id, prefix, e))

print('\nDone -> %s/' % DST)
