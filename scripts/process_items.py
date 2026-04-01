"""
Process item images from assets/items/ → public/items/
- Remove white background (connected-component flood from borders)
- Preserve multi-state items (torch_lit, fury_empty, etc.)
- Output as RGBA PNG with consistent naming
"""

import os
import sys
import numpy as np
from PIL import Image
try:
    from scipy import ndimage
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

SRC = 'assets/items'
DST = 'public/items'

os.makedirs(DST, exist_ok=True)

def remove_white_bg(img: Image.Image) -> Image.Image:
    img = img.convert('RGBA')
    data = np.array(img, dtype=np.float32)
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

    if HAS_SCIPY:
        # Mark pixels that are "white-ish" (could be background)
        whiteness = np.minimum(np.minimum(r, g), b)  # min channel
        is_white = (r > 220) & (g > 220) & (b > 220)

        # Connected components from image borders
        border_mask = np.zeros(is_white.shape, bool)
        border_mask[0, :] = border_mask[-1, :] = True
        border_mask[:, 0] = border_mask[:, -1] = True
        seed = is_white & border_mask

        labeled, _ = ndimage.label(is_white)
        border_labels = set(labeled[seed]) - {0}
        bg_mask = np.isin(labeled, list(border_labels))

        # Feathering: soft edge on pixels adjacent to background
        dilated = ndimage.binary_dilation(bg_mask, iterations=2)
        feather_zone = dilated & ~bg_mask
        white_ratio = (whiteness / 255.0)
        feather_alpha = np.where(feather_zone, (1.0 - white_ratio) * 255, 255).astype(np.float32)

        alpha = np.where(bg_mask, 0, feather_alpha)
        # Also kill isolated near-white pixels inside the image
        isolated_white = is_white & ~bg_mask
        near_bg = ndimage.binary_dilation(bg_mask, iterations=4)
        alpha = np.where(isolated_white & near_bg, 0, alpha)
    else:
        # Fallback: simple threshold
        is_white = (r > 230) & (g > 230) & (b > 230)
        alpha = np.where(is_white, 0, 255).astype(np.float32)

    result = data.copy()
    result[:,:,3] = np.clip(alpha, 0, 255)
    return Image.fromarray(result.astype(np.uint8), 'RGBA')


processed = 0
errors = []

for fname in sorted(os.listdir(SRC)):
    if not fname.lower().endswith('.png'):
        continue
    src_path = os.path.join(SRC, fname)
    dst_path = os.path.join(DST, fname)
    try:
        img = Image.open(src_path)
        out = remove_white_bg(img)
        out.save(dst_path, optimize=False)
        processed += 1
        print(f'  OK  {fname}')
    except Exception as e:
        errors.append((fname, str(e)))
        print(f'  ERR {fname}: {e}')

print(f'\nDone: {processed} images processed → {DST}/')
if errors:
    print(f'Errors ({len(errors)}):')
    for f, e in errors:
        print(f'  {f}: {e}')
