#!/usr/bin/env python3
"""Verify sun pixel coordinates by checking specific points in the original image."""
from PIL import Image
import numpy as np

img = Image.open("/home/z/my-project/upload/17861512721bcc.png").convert("RGB")
arr = np.array(img)
print(f"Image size: {img.size}")

# Icon bbox in image coords: x=[516, 1623], y=[494, 1280]
# Sun bbox in icon-local: x=[0, 647], y=[0, 654]
# Sun bbox in image coords: x=[516, 1163], y=[494, 1148]

# Check the sun's bottom-left at icon-local (172, 640) = image (688, 1134)
print("\n=== Pixel at icon-local (172, 640) = image (688, 1134) ===")
for dy in range(-5, 6):
    for dx in range(-5, 6, 2):
        x = 688 + dx
        y = 1134 + dy
        if 0 <= x < arr.shape[1] and 0 <= y < arr.shape[0]:
            r, g, b = arr[y, x]
            lum = 0.299*r+0.587*g+0.114*b
            char = '#' if lum > 200 else ('+' if lum > 128 else ('.' if lum > 50 else ' '))
            print(f"  ({x},{y}) = il ({x-516},{y-494}): lum={lum:.0f} {char}")

# Check the sun at y=327 (vertical center) — leftmost extent
# Icon-local (0, 327) = image (516, 821)
print("\n=== Sun at y=327 (image y=821), x=0 to 30 ===")
for x in range(510, 545):
    r, g, b = arr[821, x]
    lum = 0.299*r+0.587*g+0.114*b
    char = '#' if lum > 200 else ('+' if lum > 128 else ('.' if lum > 50 else ' '))
    print(f"  image x={x}, il x={x-516}: lum={lum:.1f} {char}")

# What does the actual sun look like at the bottom?
# Print a low-res ASCII visualization of the sun
print("\n=== Sun ASCII visualization (icon-local) ===")
lum_arr = 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]
# Sample the sun region (icon-local x=0-700, y=0-660) at low res
# Image coords: x=516-1216, y=494-1154
# Sample every 30 pixels
for y in range(494, 1154, 30):
    row_str = f"y={y-494:>3}: "
    for x in range(516, 1216, 20):
        lum = lum_arr[y, x]
        if lum > 200:
            row_str += "#"
        elif lum > 128:
            row_str += "+"
        elif lum > 50:
            row_str += "."
        else:
            row_str += " "
    print(row_str)

# Also check what's at the bottom-left at higher resolution
print("\n=== Sun bottom-left at high res (icon-local x=0-300, y=500-660) ===")
print(" " * 5 + "".join([f"{i:>3}" for i in range(0, 300, 10)]))
for y in range(500, 660, 10):
    row_str = f"y={y:>3}: "
    for x in range(0, 300, 10):
        ix = 516 + x
        iy = 494 + y
        lum = lum_arr[iy, ix]
        if lum > 200:
            row_str += " # "
        elif lum > 128:
            row_str += " + "
        elif lum > 50:
            row_str += " . "
        else:
            row_str += "   "
    print(row_str)
