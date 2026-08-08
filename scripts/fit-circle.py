#!/usr/bin/env python3
"""Fit a precise circle to the upper-left arc of the sun, then extract final SVG geometry."""
from PIL import Image
import numpy as np
import json

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

# Get all sun pixels
sun_ys, sun_xs = np.where(sun_only)

# Use only the upper-left BOUNDARY pixels for circle fitting
# For each row y < 200 (definitely above cut), take the leftmost x (circle's left edge)
# For each col x < 200, take the topmost y (circle's top edge)
# These are unaffected by the cut.
boundary_pts = []
# Top boundary: for each column x from 0 to 647, find the topmost y in that column
for x in range(sun_only.shape[1]):
    col = sun_only[:, x]
    ys_in_col = np.where(col)[0]
    if len(ys_in_col) > 0:
        y_top_col = ys_in_col.min()
        if y_top_col < 200:  # only use top portion (above cut)
            boundary_pts.append((x, y_top_col))
# Left boundary: for each row y from 0 to 654, find the leftmost x
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs_in_row = np.where(row)[0]
    if len(xs_in_row) > 0:
        x_left_row = xs_in_row.min()
        if x_left_row < 200:  # only use left portion (away from cut)
            boundary_pts.append((x_left_row, y))

boundary_pts = np.array(boundary_pts)
print(f"Boundary points for fitting: {len(boundary_pts)}")
ul_xs = boundary_pts[:, 0]
ul_ys = boundary_pts[:, 1]

# Fit circle to (x, y) using algebraic fit (Kasa method)
# x² + y² + Dx + Ey + F = 0, center=(-D/2, -E/2), r=sqrt((D²+E²)/4 - F)
A = np.column_stack([ul_xs, ul_ys, np.ones(len(ul_xs))])
b = -(ul_xs**2 + ul_ys**2)
sol, *_ = np.linalg.lstsq(A, b, rcond=None)
D, E, F = sol
cx_fit = -D/2
cy_fit = -E/2
r_fit = np.sqrt((D**2 + E**2)/4 - F)
print(f"Fitted circle: center=({cx_fit:.3f}, {cy_fit:.3f}), radius={r_fit:.3f}")

# Now find the cut's exact corner points
# Top of cut: where x_actual drops below circle's natural right edge
# Iterate y from top to find where the divergence starts
print("\nLooking for cut start (where right edge diverges from fitted circle):")
prev_diff = 0
cut_start = None
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs_in_row = np.where(row)[0]
    if len(xs_in_row) == 0:
        continue
    x_actual = xs_in_row.max()
    dy = y - cy_fit
    if abs(dy) > r_fit:
        continue
    x_circle = cx_fit + np.sqrt(r_fit**2 - dy**2)
    diff = x_actual - x_circle
    # Cut starts when diff drops below -3 (with some tolerance for anti-aliasing)
    if diff < -3 and cut_start is None and y > 100:
        cut_start = (y, x_actual, x_circle)
        # Print context
        for yy in range(max(0,y-3), y+3):
            r2 = sun_only[yy, :]
            xs2 = np.where(r2)[0]
            if len(xs2) == 0: continue
            xa = xs2.max()
            dy2 = yy - cy_fit
            if abs(dy2) <= r_fit:
                xc = cx_fit + np.sqrt(r_fit**2 - dy2**2)
                print(f"  y={yy}: x_actual={xa}, x_circle={xc:.2f}, diff={xa-xc:.2f}")
            else:
                print(f"  y={yy}: x_actual={xa}, x_circle=N/A")
        break

print(f"\nCut starts at y={cut_start[0]}, x_actual={cut_start[1]}, x_circle={cut_start[2]:.2f}")

# Bottom of cut: where the slanted line meets the circle's bottom
# The slanted line passes through (cut_start_x, cut_start_y) at angle 48° below horizontal (going down-left)
# Find where this line intersects the circle's lower arc
# Line: passing through (x0, y0) with slope dy/dx = -1.108 (from earlier fit, angle 48°)
# More precisely: from the earlier fit, x = -0.899*y + 787.75
# But let's refit using only cut-region data
cut_ys_arr = []
cut_xs_arr = []
for y in range(cut_start[0], sun_only.shape[0]):
    row = sun_only[y, :]
    xs_in_row = np.where(row)[0]
    if len(xs_in_row) == 0:
        # Circle ends here
        break
    x_actual = xs_in_row.max()
    cut_ys_arr.append(y)
    cut_xs_arr.append(x_actual)

cut_ys_arr = np.array(cut_ys_arr)
cut_xs_arr = np.array(cut_xs_arr)
# Fit line x = a*y + b
A = np.vstack([cut_ys_arr, np.ones(len(cut_ys_arr))]).T
a_slope, b_intercept = np.linalg.lstsq(A, cut_xs_arr, rcond=None)[0]
print(f"Cut slanted line: x = {a_slope:.4f}*y + {b_intercept:.4f}")
# At cut_start, x = a*cut_start_y + b
cut_start_x_line = a_slope * cut_start[0] + b_intercept
print(f"At cut_start y={cut_start[0]}, line gives x={cut_start_x_line:.2f} (actual={cut_start[1]})")

# Find where this line meets the circle (lower intersection)
# Circle: (x - cx)² + (y - cy)² = r²
# Substitute x = a*y + b:
# (a*y + b - cx)² + (y - cy)² = r²
# Let p = a, q = b - cx. Then (p*y + q)² + (y - cy)² = r²
# p²y² + 2pqy + q² + y² - 2cy*y + cy² - r² = 0
# (p²+1)y² + (2pq - 2cy)y + (q² + cy² - r²) = 0
p = a_slope
q = b_intercept - cx_fit
A_coef = p**2 + 1
B_coef = 2*p*q - 2*cy_fit
C_coef = q**2 + cy_fit**2 - r_fit**2
discriminant = B_coef**2 - 4*A_coef*C_coef
y_intersections = [(-B_coef + np.sqrt(discriminant))/(2*A_coef), (-B_coef - np.sqrt(discriminant))/(2*A_coef)]
print(f"Line-circle intersections: y = {y_intersections[0]:.2f}, {y_intersections[1]:.2f}")
# The lower intersection (larger y) is the bottom of the cut
y_bottom = max(y_intersections)
x_bottom = a_slope * y_bottom + b_intercept
print(f"Cut bottom point: ({x_bottom:.2f}, {y_bottom:.2f})")

# The upper intersection should be near cut_start
y_upper_intersect = min(y_intersections)
x_upper_intersect = a_slope * y_upper_intersect + b_intercept
print(f"Cut upper line-circle intersection: ({x_upper_intersect:.2f}, {y_upper_intersect:.2f})")

# But the actual cut starts at cut_start (where the horizontal top of the cut is)
# So the cut's TOP edge is a horizontal segment at y=cut_start_y from x=cut_start_x to x=circle's natural right edge at that y
y_top = cut_start[0]
x_top_left = cut_start[1]  # left end of horizontal cut top
dy_top = y_top - cy_fit
x_top_right = cx_fit + np.sqrt(r_fit**2 - dy_top**2)  # circle's right edge at this y
print(f"\nCut top edge: horizontal at y={y_top}, from x={x_top_left} to x={x_top_right:.2f}")

# Cut's slanted edge: from (x_top_left, y_top) down to (x_bottom, y_bottom)
print(f"Cut slanted edge: from ({x_top_left}, {y_top}) to ({x_bottom:.2f}, {y_bottom:.2f})")

# === Now extract ray corners ===
print("\n=== RAY CORNERS (precise) ===")
ray_corners = []
for i in range(1, n+1):
    if i == sun_label: continue
    ray_mask = (labeled == i)
    ys, xs = np.where(ray_mask)
    y_top_r = ys.min()
    y_bot_r = ys.max()
    top_xs = np.where(ray_mask[y_top_r, :])[0]
    bot_xs = np.where(ray_mask[y_bot_r, :])[0]
    x_tl = int(top_xs.min())
    x_tr = int(top_xs.max())
    x_bl = int(bot_xs.min())
    x_br = int(bot_xs.max())
    corners = [(x_tl, y_top_r), (x_tr, y_top_r), (x_br, y_bot_r), (x_bl, y_bot_r)]
    ray_corners.append({'id': i, 'corners': corners})
    print(f"Ray {i}:")
    for c in corners:
        print(f"  ({c[0]}, {c[1]})")
    # Compute parallelogram parameters
    top_len = x_tr - x_tl
    bot_len = x_br - x_bl
    slant_dx = x_tr - x_br  # top-right is to the right of bottom-right (rays slant up-right)
    slant_dy = y_bot_r - y_top_r
    slant_len = np.sqrt(slant_dx**2 + slant_dy**2)
    angle = np.degrees(np.arctan2(slant_dy, slant_dx))
    print(f"  Top thickness: {top_len}, Bottom thickness: {bot_len}")
    print(f"  Slant dx={slant_dx}, dy={slant_dy}, length={slant_len:.2f}, angle={angle:.2f}° from horizontal")

# === Save final geometry ===
final_geometry = {
    'icon_local_size': {'w': int(icon_region.shape[1]), 'h': int(icon_region.shape[0])},
    'icon_global_offset': {'x': int(icon_xmin_global), 'y': int(icon_y_min)},
    'sun': {
        'center': {'x': float(cx_fit), 'y': float(cy_fit)},
        'radius': float(r_fit),
        'cut_top_y': int(y_top),
        'cut_top_x_left': int(x_top_left),
        'cut_top_x_right': float(x_top_right),
        'cut_bottom_x': float(x_bottom),
        'cut_bottom_y': float(y_bottom),
        'slant_line': {'slope': float(a_slope), 'intercept': float(b_intercept)},
    },
    'rays': [
        {
            'id': r['id'],
            'corners': r['corners'],
        } for r in ray_corners
    ],
}
with open('/tmp/final-geometry.json', 'w') as f:
    json.dump(final_geometry, f, indent=2)
print("\n=== FINAL GEOMETRY ===")
print(json.dumps(final_geometry, indent=2))

# Save the text mask for OCR analysis
text_mask = mask[1429:1601, 262:1793]
Image.fromarray((text_mask.astype(np.uint8) * 255)).save('/tmp/text-mask.png')
# Crop and enlarge the text from original image for verification
text_crop = img.crop((262, 1429, 1793, 1601))
text_crop.save('/tmp/text-crop.png')
print("\nSaved text crop to /tmp/text-crop.png")
