#!/usr/bin/env python3
"""Examine the actual pixel intensities at the sun's top apex and along edges."""
from PIL import Image
import numpy as np

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)

# Sun's top apex is at icon-local (319-352, 0), which is image (516+319, 494) to (516+352, 494)
# = image (835, 494) to (868, 494)
print("=== Top apex pixel intensities (y=494 in image, y=0 in icon-local) ===")
for x in range(815, 880):
    r, g, b = arr[494, x]
    print(f"  x={x} (icon-local {x-516}): RGB=({r},{g},{b}), lum={0.299*r+0.587*g+0.114*b:.1f}")

print("\n=== Top 20 rows of sun, columns near apex (image y=494 to 513, x=820 to 875) ===")
for y in range(494, 514):
    row_str = f"y={y} (il {y-494}): "
    for x in range(820, 876, 2):
        r, g, b = arr[y, x]
        lum = int(0.299*r+0.587*g+0.114*b)
        if lum > 200:
            row_str += "##"
        elif lum > 128:
            row_str += "++"
        elif lum > 50:
            row_str += ".."
        else:
            row_str += "  "
    print(row_str)

# Check the threshold
print("\n=== Intensity distribution at y=0 (top row) ===")
for x in range(815, 880):
    r, g, b = arr[494, x]
    lum = 0.299*r+0.587*g+0.114*b
    if lum > 0:
        print(f"  x={x-516}: lum={lum:.1f}")

# Use a stricter threshold (lum > 200) to find true circle boundary
print("\n=== Sun bbox with strict threshold (lum > 200) ===")
lum_arr = 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]
mask_strict = lum_arr > 200
icon_region_strict = mask_strict[494:1281, 516:1623]
ys, xs = np.where(icon_region_strict)
print(f"Strict foreground pixel count: {len(ys)}")
if len(ys) > 0:
    print(f"Strict bbox: x=[{xs.min()},{xs.max()}] y=[{ys.min()},{ys.max()}]")
    # Top apex
    for y in range(0, 30):
        row = icon_region_strict[y, :]
        xs_r = np.where(row)[0]
        if len(xs_r) > 0:
            print(f"  y={y}: x=[{xs_r.min()},{xs_r.max()}], count={len(xs_r)}")
        else:
            break

# Compare with looser threshold
print("\n=== Compare thresholds ===")
for thresh in [50, 100, 128, 150, 180, 200, 220, 240]:
    m = lum_arr > thresh
    ir = m[494:1281, 516:1623]
    ys, xs = np.where(ir)
    if len(ys) > 0:
        # Find sun bbox (left half of icon, x < 700)
        sun_ys = ys[xs < 700]
        sun_xs = xs[xs < 700]
        print(f"  thresh={thresh}: sun bbox x=[{sun_xs.min()},{sun_xs.max()}] y=[{sun_ys.min()},{sun_ys.max()}]")
