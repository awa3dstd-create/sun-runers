#!/usr/bin/env python3
"""Trace the sun's outline precisely and find circle parameters."""
from PIL import Image
import numpy as np

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)
lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2])
mask = lum > 128

icon_y_min, icon_y_max = 494, 1280
icon_xmin_global, icon_xmax_global = 516, 1623
icon_region = mask[icon_y_min:icon_y_max+1, icon_xmin_global:icon_xmax_global+1]

from scipy import ndimage
labeled, n = ndimage.label(icon_region)
sizes = ndimage.sum(icon_region, labeled, range(1, n+1))
sun_label = max(range(1, n+1), key=lambda i: sizes[i-1])
sun_only = (labeled == sun_label)

# Print the sun's leftmost x for EVERY y (sampling every 10)
print("Sun outline (y, x_left, x_right, width):")
print(f"{'y':>4} {'x_left':>7} {'x_right':>8} {'width':>6}")
for y in range(0, 660, 20):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        print(f"{y:>4} {xs.min():>7} {xs.max():>8} {xs.max()-xs.min()+1:>6}")
    else:
        print(f"{y:>4}   EMPTY")

# Find the widest row (max width)
widths = []
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        widths.append((y, xs.min(), xs.max(), xs.max()-xs.min()+1))

widths.sort(key=lambda w: w[3], reverse=True)
print(f"\nWidest rows:")
for w in widths[:10]:
    print(f"  y={w[0]}, x_left={w[1]}, x_right={w[2]}, width={w[3]}")

# Find rows where x_left is minimum (leftmost extent)
widths.sort(key=lambda w: w[1])
print(f"\nLeftmost rows (smallest x_left):")
for w in widths[:10]:
    print(f"  y={w[0]}, x_left={w[1]}, x_right={w[2]}")

# Hmm let me look at the actual sun boundary using marching squares
from skimage import measure
contours = measure.find_contours(sun_only.astype(float), 0.5)
print(f"\nContours in sun: {len(contours)}")
for i, c in enumerate(contours):
    # c is (row, col) = (y, x)
    print(f"  Contour {i}: {len(c)} pts, x=[{c[:,1].min():.1f},{c[:,1].max():.1f}] y=[{c[:,0].min():.1f},{c[:,0].max():.1f}]")

# Look at the actual sun pixel range in 4 quadrants
print("\nSun pixel distribution by quadrant:")
H, W = sun_only.shape
for qy in range(4):
    for qx in range(4):
        y0, y1 = qy*H//4, (qy+1)*H//4
        x0, x1 = qx*W//4, (qx+1)*W//4
        region = sun_only[y0:y1, x0:x1]
        cnt = region.sum()
        print(f"  Q(y={qy},x={qx}) bbox x=[{x0},{x1}) y=[{y0},{y1}) pixels={cnt}")

# Look at the sun's bottom area specifically (y > 500)
print("\nSun bottom half (y > 500) outline:")
for y in range(500, 660, 10):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        # Print every 5th pixel position to see shape
        print(f"  y={y}: x_min={xs.min()}, x_max={xs.max()}, count={len(xs)}, sample xs: {xs[::max(1,len(xs)//10)][:10].tolist()}")

# Save the sun-only mask scaled up for visual inspection
sunvis = Image.fromarray((sun_only.astype(np.uint8) * 255))
sunvis.save("/tmp/sun-only.png")
# Save a colorized version with the contour overlaid
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(10, 10))
ax.imshow(sun_only, cmap='gray_r')
for c in contours:
    ax.plot(c[:,1], c[:,0], 'r-', linewidth=0.5)
ax.set_title('Sun outline (red = contour)')
plt.savefig('/tmp/sun-outline.png', dpi=100, bbox_inches='tight')
print("\nSaved /tmp/sun-outline.png")
