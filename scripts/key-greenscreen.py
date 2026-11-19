"""Green-screen key tuned for chrome: alpha from green dominance (g - max(r,b)),
so grey chrome that only reflects a bit of green stays opaque.
usage: key.py IN_DIR OUT_DIR [t0 t1]"""
import sys, glob, os
import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
t0 = float(sys.argv[3]) if len(sys.argv) > 3 else 70
t1 = float(sys.argv[4]) if len(sys.argv) > 4 else 130
os.makedirs(dst, exist_ok=True)

for f in sorted(glob.glob(os.path.join(src, '*.png'))):
    a = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(r, b)
    gd = g - mx
    alpha = 1 - np.clip((gd - t0) / (t1 - t0), 0, 1)
    # despill: pull green down toward the other channels where it dominates
    g2 = np.where(gd > 0, mx + np.clip(gd, 0, None) * 0.15, g)
    # drop the thin floor line: open the mask vertically, only near the floor
    m = alpha > 0.5
    opened = ndimage.binary_opening(m, structure=np.ones((7, 1)))
    thin = m & ~opened
    band = np.zeros_like(m); band[int(m.shape[0] * 0.84):, :] = True
    alpha[thin & band] = 0
    # remove specks
    lab, n = ndimage.label(alpha > 0.1)
    if n:
        sizes = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
        small = np.isin(lab, np.where(sizes < 150)[0] + 1)
        alpha[small] = 0
    out = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(os.path.join(dst, os.path.basename(f)))
