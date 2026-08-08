#!/usr/bin/env python3
"""Analyze the logo PNG to extract precise geometry for vectorization."""
from PIL import Image
import numpy as np
import json

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)
H, W, _ = arr.shape
print(f"Image: {W}x{H}")

# Detect black vs white. Logo is white on black background.
# Compute luminance
lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2])
# Foreground (logo) = bright pixels
mask = lum > 128
print(f"Foreground pixel count: {mask.sum()} of {H*W} ({100*mask.sum()/(H*W):.2f}%)")

# Find bounding box of foreground
ys, xs = np.where(mask)
if len(ys) == 0:
    print("ERROR: No foreground found")
    exit(1)
ymin, ymax = ys.min(), ys.max()
xmin, xmax = xs.min(), xs.max()
print(f"Foreground bbox: x=[{xmin},{xmax}] y=[{ymin},{ymax}] (w={xmax-xmin+1}, h={ymax-ymin+1})")

# Find horizontal whitespace rows that separate icon from text
row_sums = mask.sum(axis=1)
# Find rows that are completely empty (zero foreground)
empty_rows = np.where(row_sums == 0)[0]
print(f"Empty rows: {len(empty_rows)} total")
# Find gaps (consecutive runs of empty rows)
gaps = []
if len(empty_rows) > 0:
    start = empty_rows[0]
    prev = empty_rows[0]
    for r in empty_rows[1:]:
        if r == prev + 1:
            prev = r
        else:
            gaps.append((start, prev))
            start = r
            prev = r
    gaps.append((start, prev))
# Sort gaps by length, largest first
gaps_sorted = sorted(gaps, key=lambda g: g[1]-g[0], reverse=True)
print("Top 8 gaps (y_start, y_end, height):")
for g in gaps_sorted[:8]:
    print(f"  y=[{g[0]},{g[1]}] h={g[1]-g[0]+1}")

# For the icon: top half of foreground (above text)
# Find the largest gap that splits the foreground roughly in the middle
mid_y = (ymin + ymax) // 2
# Find the largest empty-row gap that lies inside the foreground bbox
# and contains (or is near) the middle
best_gap = None
for g in gaps_sorted:
    if ymin < g[0] and g[1] < ymax:
        if best_gap is None or (g[1]-g[0]) > (best_gap[1]-best_gap[0]):
            best_gap = g
if best_gap is None:
    # No clean horizontal gap; use the projection-based split instead
    # Find the row with the fewest foreground pixels near the middle
    half_lo = int((ymin + (ymax-ymin)*0.4))
    half_hi = int((ymin + (ymax-ymin)*0.6))
    sub = row_sums[half_lo:half_hi+1]
    min_idx = half_lo + int(np.argmin(sub))
    best_gap = (min_idx, min_idx)
print(f"\nGap separating icon from text: y=[{best_gap[0]},{best_gap[1]}]")

icon_y_max = best_gap[0] - 1 if best_gap[0] > 0 else ymin
text_y_min = best_gap[1] + 1
icon_y_min = ymin
text_y_max = ymax

# Icon bounding box
icon_mask = mask[icon_y_min:icon_y_max+1, :]
icon_ys, icon_xs = np.where(icon_mask)
icon_xmin, icon_xmax = icon_xs.min(), icon_xs.max()
print(f"\nICON bbox: x=[{icon_xmin},{icon_xmax}] y=[{icon_y_min},{icon_y_max}] (w={icon_xmax-icon_xmin+1}, h={icon_y_max-icon_y_min+1})")

# Text bounding box
text_mask = mask[text_y_min:text_y_max+1, :]
text_ys, text_xs = np.where(text_mask)
text_xmin, text_xmax = text_xs.min(), text_xs.max()
print(f"TEXT bbox: x=[{text_xmin},{text_xmax}] y=[{text_y_min},{text_y_max}] (w={text_xmax-text_xmin+1}, h={text_y_max-text_y_min+1})")

# === Analyze the ICON precisely ===
# The icon is a sun (circle with cut) + 3 rays (parallelograms)
# Get only the icon region pixels
icon_region = mask[icon_y_min:icon_y_max+1, icon_xmin:icon_xmax+1]
print(f"\nIcon region shape: {icon_region.shape}")

# Save mask image for visual debugging
debug = Image.fromarray((mask.astype(np.uint8) * 255))
debug.save("/tmp/logo-mask.png")
icon_dbg = Image.fromarray((icon_region.astype(np.uint8) * 255))
icon_dbg.save("/tmp/icon-mask.png")
text_dbg = Image.fromarray((text_mask.astype(np.uint8) * 255))
text_dbg.save("/tmp/text-mask.png")

# For the icon, find the leftmost connected component (sun) and the rays
# Use simple flood-fill based component labeling
from scipy import ndimage
labeled, num_features = ndimage.label(icon_region)
print(f"\nIcon connected components: {num_features}")
sizes = ndimage.sum(icon_region, labeled, range(1, num_features+1))
# Find bounding boxes for each component
bboxes = []
for i in range(1, num_features+1):
    ys_c, xs_c = np.where(labeled == i)
    bboxes.append({
        'id': i,
        'size': int(sizes[i-1]),
        'xmin': int(xs_c.min()),
        'xmax': int(xs_c.max()),
        'ymin': int(ys_c.min()),
        'ymax': int(ys_c.max()),
    })
bboxes_sorted = sorted(bboxes, key=lambda b: b['xmin'])
print("Components sorted by x:")
for b in bboxes_sorted:
    print(f"  id={b['id']} size={b['size']} x=[{b['xmin']},{b['xmax']}] y=[{b['ymin']},{b['ymax']}] w={b['xmax']-b['xmin']+1} h={b['ymax']-b['ymin']+1}")

# === Analyze TEXT precisely ===
# Determine the letters by looking at column projections (whitespace gaps)
# Save a high-res cropped version of icon and text for verification
img_crop_icon = img.crop((icon_xmin-5, icon_y_min-5, icon_xmax+6, icon_y_max+6))
img_crop_icon.save("/tmp/icon-crop.png")
img_crop_text = img.crop((text_xmin-5, text_y_min-5, text_xmax+6, text_y_max+6))
img_crop_text.save("/tmp/text-crop.png")

# === Find precise contour of the icon (outline) ===
# We'll use marching squares to find the outline at level 0.5
from skimage import measure
contours = measure.find_contours(icon_region.astype(float), 0.5)
print(f"\nFound {len(contours)} contours in icon")
for i, c in enumerate(contours):
    print(f"  Contour {i}: {len(c)} points, x_range=[{c[:,1].min():.1f},{c[:,1].max():.1f}] y_range=[{c[:,0].min():.1f},{c[:,0].max():.1f}]")

# Save contours to JSON for SVG construction
contours_data = []
for c in contours:
    # Convert to (x, y) and reverse if needed (skimage gives row, col)
    points = []
    for r, col in c:
        points.append([float(col), float(r)])
    contours_data.append(points)

with open("/tmp/icon-contours.json", "w") as f:
    json.dump({
        'icon_xmin': int(icon_xmin),
        'icon_y_min': int(icon_y_min),
        'icon_xmax': int(icon_xmax),
        'icon_y_max': int(icon_y_max),
        'contours': contours_data,
        'bboxes': bboxes_sorted,
        'text_xmin': int(text_xmin),
        'text_xmax': int(text_xmax),
        'text_y_min': int(text_y_min),
        'text_y_max': int(text_y_max),
    }, f)
print("\nSaved contours to /tmp/icon-contours.json")
print("Saved /tmp/icon-mask.png, /tmp/text-mask.png, /tmp/icon-crop.png, /tmp/text-crop.png")
