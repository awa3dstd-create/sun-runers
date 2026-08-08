#!/usr/bin/env python3
"""Examine pixel intensities at the sun's leftmost extent (y=327 area)."""
from PIL import Image
import numpy as np

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)

# Leftmost extent at y=323-360 (icon-local) = y=817-854 (image)
# Columns x=0-30 in icon-local = x=516-546 in image
print("=== Pixel intensities at leftmost extent, y=327 (image y=821) ===")
for x in range(510, 540):
    r, g, b = arr[821, x]
    lum = 0.299*r+0.587*g+0.114*b
    print(f"  x={x} (il {x-516}): lum={lum:.1f}")

print("\n=== Pixel intensities at leftmost extent, y=340 (image y=834) ===")
for x in range(510, 540):
    r, g, b = arr[834, x]
    lum = 0.299*r+0.587*g+0.114*b
    print(f"  x={x} (il {x-516}): lum={lum:.1f}")

# Also check the bottom of the sun (around y=654, x=198-200)
print("\n=== Bottom of sun (y=654, image y=1148) ===")
for x in range(700, 730):
    r, g, b = arr[1148, x]
    lum = 0.299*r+0.587*g+0.114*b
    print(f"  x={x} (il {x-516}): lum={lum:.1f}")

# Check along the bottom rows
print("\n=== Sun bottom rows ===")
for y in range(1140, 1155):
    row_str = f"y={y} (il {y-494}): "
    for x in range(700, 740, 1):
        r, g, b = arr[y, x]
        lum = int(0.299*r+0.587*g+0.114*b)
        if lum > 200:
            row_str += "#"
        elif lum > 128:
            row_str += "+"
        elif lum > 50:
            row_str += "."
        else:
            row_str += " "
    print(row_str)

# Use a 50% intensity threshold to find the "true" mathematical boundary
# At 50% intensity, the pixel is half-covered by the shape
# This corresponds to the actual mathematical edge of the shape
print("\n=== Sun bbox with 50% intensity threshold (lum > 109) ===")
lum_arr = 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]
# Use 50% of max intensity (which is ~218 at apex)
# Actually, the "half-max" is around 109, but the white might be 218 due to anti-aliasing
# Let me check the max intensity in the sun
sun_region_lum = lum_arr[494:1148, 516:1163]  # sun bbox approx
max_lum = sun_region_lum.max()
print(f"Max lum in sun region: {max_lum}")
half_max = max_lum / 2
print(f"Half-max threshold: {half_max:.1f}")
mask_half = lum_arr > half_max
icon_half = mask_half[494:1281, 516:1623]
ys, xs = np.where(icon_half)
sun_ys = ys[xs < 700]
sun_xs = xs[xs < 700]
print(f"Sun bbox (half-max): x=[{sun_xs.min()},{sun_xs.max()}] y=[{sun_ys.min()},{sun_ys.max()}]")

# Find topmost and leftmost with half-max threshold
print("\nTopmost rows (half-max):")
for y in range(0, 30):
    row = icon_half[y, :]
    xs_r = np.where(row)[0]
    if len(xs_r) > 0:
        if xs_r.min() < 700:  # sun only
            print(f"  y={y}: x=[{xs_r.min()},{xs_r.max()}], count={len(xs_r)}")
    else:
        break

print("\nLeftmost columns (half-max, y=327 area):")
for y in range(320, 345):
    row = icon_half[y, :]
    xs_r = np.where(row)[0]
    if len(xs_r) > 0:
        if xs_r.min() < 700:
            print(f"  y={y}: x_min={xs_r.min()}")
