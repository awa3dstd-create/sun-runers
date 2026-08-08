#!/usr/bin/env python3
"""Detailed analysis of the sun's cut shape."""
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

# Sun is component at top-left of icon, bbox x=[0,647], y=[0,654] (local)
# Get sun mask only
sun_mask = icon_region[0:655, 0:648].copy()
# Detect sun-only pixels (the connected component at top-left)
from scipy import ndimage
# Label and pick the top-left component
labeled, n = ndimage.label(icon_region)
# Find the label at (0, 0) area — top-left corner
sun_label = None
# Find label with bbox closest to (0,0)
sizes = ndimage.sum(icon_region, labeled, range(1, n+1))
sun_label = max(range(1, n+1), key=lambda i: sizes[i-1])  # largest = sun
sun_only = (labeled == sun_label)
print(f"Sun label: {sun_label}, sun pixels: {sun_only.sum()}")

# For each row y in icon-local coords, find rightmost x of sun
print("\nSun right edge (y, x_max) - sampling every 20 rows:")
right_edge = []
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        right_edge.append((y, xs.max()))
    else:
        right_edge.append((y, None))

# Print every 20 rows
for y, x in right_edge[::20]:
    print(f"  y={y}: x_max={x}")

# Detect the cut: find where the right edge deviates from a full circle
# Assume circle center=(cx, cy), radius=r
cx, cy, r = 323.5, 327, 327
print(f"\nAssuming circle: center=({cx},{cy}), radius={r}")
print("\nDeviation analysis (where actual right edge differs from circle):")
print(f"{'y':>4} {'x_actual':>9} {'x_circle':>9} {'diff':>6}")
cut_start_y = None
for y, x_actual in right_edge:
    if x_actual is None: continue
    # Compute circle's right edge at this y
    dy = y - cy
    if abs(dy) > r:
        x_circle = None
    else:
        x_circle = cx + np.sqrt(r*r - dy*dy)
    if x_circle is not None:
        diff = x_actual - x_circle
        # If diff is significantly negative, we're inside the cut
        if diff < -10 and cut_start_y is None:
            cut_start_y = y
            print(f"  ** CUT STARTS at y={y}: actual={x_actual}, circle={x_circle:.1f}, diff={diff:.1f}")

# Get the cut region precisely
print(f"\nCut region (where actual < circle):")
cut_points = []
for y, x_actual in right_edge:
    if x_actual is None: continue
    dy = y - cy
    if abs(dy) > r: continue
    x_circle = cx + np.sqrt(r*r - dy*dy)
    diff = x_actual - x_circle
    if diff < -5:
        cut_points.append((y, x_actual, x_circle))
print(f"Total cut rows: {len(cut_points)}")
if cut_points:
    print(f"Cut y range: [{cut_points[0][0]}, {cut_points[-1][0]}]")
    print(f"Cut first 5 (y, x_actual, x_circle):")
    for p in cut_points[:5]:
        print(f"  y={p[0]}: actual={p[1]}, circle={p[2]:.1f}")
    print(f"Cut last 5:")
    for p in cut_points[-5:]:
        print(f"  y={p[0]}: actual={p[1]}, circle={p[2]:.1f}")
    # The cut's right edge (x_actual) follows a straight line?
    # Fit a line to (x_actual, y) for cut points
    cut_ys = np.array([p[0] for p in cut_points])
    cut_xs = np.array([p[1] for p in cut_points])
    # Linear fit: x = a*y + b
    A = np.vstack([cut_ys, np.ones(len(cut_ys))]).T
    a, b = np.linalg.lstsq(A, cut_xs, rcond=None)[0]
    print(f"\nCut right-edge line: x = {a:.4f}*y + {b:.2f}")
    # Slope a means dx/dy = a; angle from vertical = atan(a); from horizontal = atan(1/a) = 90 - atan(a)
    angle_from_horizontal = np.degrees(np.arctan(1/abs(a))) if a != 0 else 90
    print(f"Cut edge angle from horizontal: {angle_from_horizontal:.2f}°")

# === Now find the cut's TOP boundary ===
# The cut starts where x_actual diverges from x_circle.
# Print rows around the transition
print(f"\nTransition region (y from {max(0,cut_start_y-30)} to {cut_start_y+30}):")
for y in range(max(0, cut_start_y-30), min(sun_only.shape[0], cut_start_y+30)):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) == 0:
        continue
    x_actual = xs.max()
    dy = y - cy
    x_circle = cx + np.sqrt(r*r - dy*dy) if abs(dy) <= r else None
    diff = x_actual - x_circle if x_circle else 0
    marker = " *** CUT" if diff < -5 else ""
    print(f"  y={y}: x_max={x_actual}, x_circle={x_circle:.1f if x_circle else 0}, diff={diff:.1f}{marker}")

# === Save the sun mask as PNG for inspection ===
Image.fromarray((sun_only.astype(np.uint8) * 255)).save("/tmp/sun-only.png")
print("\nSaved /tmp/sun-only.png")

# === Compute ray parallelogram corners precisely ===
print("\n=== RAY CORNERS ===")
# Each ray's hull starts at upper-left, goes clockwise. The 4 corners are:
# - top-left (smallest y, smallest x at that y)
# - top-right (smallest y, largest x at that y)
# - bottom-right (largest y, largest x at that y)  -- wait, that's wrong
# Actually for a parallelogram with horizontal top/bottom edges:
# - top edge: from (x_tl, y_top) to (x_tr, y_top)
# - bottom edge: from (x_bl, y_bottom) to (x_br, y_bottom)
# - left slanted edge: from (x_tl, y_top) to (x_bl, y_bottom)
# - right slanted edge: from (x_tr, y_top) to (x_br, y_bottom)

# Get each ray's mask
ray_masks = []
for i in range(1, n+1):
    if i == sun_label: continue
    ray_masks.append((i, labeled == i))

for i, ray_mask in ray_masks:
    ys, xs = np.where(ray_mask)
    y_top = ys.min()
    y_bottom = ys.max()
    # Top row: get x range
    top_row = ray_mask[y_top, :]
    top_xs = np.where(top_row)[0]
    x_tl = top_xs.min()
    x_tr = top_xs.max()
    # Bottom row: get x range
    bot_row = ray_mask[y_bottom, :]
    bot_xs = np.where(bot_row)[0]
    x_bl = bot_xs.min()
    x_br = bot_xs.max()
    print(f"\nRay {i}:")
    print(f"  y_top={y_top}, y_bottom={y_bottom}")
    print(f"  Top-left:     ({x_tl}, {y_top})")
    print(f"  Top-right:    ({x_tr}, {y_top})")
    print(f"  Bottom-right: ({x_br}, {y_bottom})")
    print(f"  Bottom-left:  ({x_bl}, {y_bottom})")
    # Top edge length (horizontal)
    top_len = x_tr - x_tl
    bot_len = x_br - x_bl
    # Slant shift: top edge is shifted right of bottom edge by (x_tl - x_bl)
    shift = x_tl - x_bl
    # Long axis length: from (x_tr, y_top) to (x_br, y_bottom)
    long_dx = x_br - x_tr
    long_dy = y_bottom - y_top
    long_len = np.sqrt(long_dx**2 + long_dy**2)
    angle = np.degrees(np.arctan2(long_dy, -long_dx))  # angle from horizontal going up-right
    print(f"  Top edge length: {top_len}")
    print(f"  Bottom edge length: {bot_len}")
    print(f"  Shift (top relative to bottom): {shift}")
    print(f"  Long axis length: {long_len:.2f}")
    print(f"  Angle from horizontal: {angle:.2f}°")
