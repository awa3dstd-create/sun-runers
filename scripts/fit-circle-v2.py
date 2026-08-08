#!/usr/bin/env python3
"""More careful circle fit using only boundary points clearly unaffected by cut."""
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

# Use boundary points clearly on the natural circle (unaffected by cut)
# Top boundary: for each column x, the topmost y. Use only columns where topmost y < 233.
# Left boundary: for each row y, the leftmost x. Use ALL rows.
# Also: bottom boundary? Looking at the data, the bottom of the sun follows the circle's lower-left arc,
# so the leftmost x for each bottom row should be on the circle.

boundary_pts = []
# Top boundary (upper-right arc)
for x in range(sun_only.shape[1]):
    col = sun_only[:, x]
    ys = np.where(col)[0]
    if len(ys) > 0:
        y_top = ys.min()
        if y_top < 230:  # above cut
            boundary_pts.append((x, y_top))

# Left boundary (left arc, including lower-left)
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        x_left = xs.min()
        boundary_pts.append((x_left, y))

boundary_pts = np.array(boundary_pts)
print(f"Boundary points: {len(boundary_pts)}")

# Fit circle using Kasa method
x = boundary_pts[:, 0]
y = boundary_pts[:, 1]
A = np.column_stack([x, y, np.ones(len(x))])
b = -(x**2 + y**2)
sol, *_ = np.linalg.lstsq(A, b, rcond=None)
D, E, F = sol
cx = -D/2
cy = -E/2
r = np.sqrt((D**2 + E**2)/4 - F)
print(f"Fitted circle: center=({cx:.3f}, {cy:.3f}), radius={r:.3f}")

# Compute residuals
residuals = np.sqrt((x - cx)**2 + (y - cy)**2) - r
print(f"Residuals: mean={residuals.mean():.3f}, std={residuals.std():.3f}, max={residuals.max():.3f}, min={residuals.min():.3f}")
print(f"RMSE: {np.sqrt((residuals**2).mean()):.3f}")

# Try fitting only specific subsets to see if different parts fit different circles
# Top only (y < 200, topmost x in column)
top_pts = [(x_, y_) for x_, y_ in boundary_pts if y_ < 200]
top_pts = np.array(top_pts)
print(f"\nTop boundary points only: {len(top_pts)}")
x_t = top_pts[:, 0]; y_t = top_pts[:, 1]
A_t = np.column_stack([x_t, y_t, np.ones(len(x_t))])
sol_t, *_ = np.linalg.lstsq(A_t, -(x_t**2 + y_t**2), rcond=None)
D_t, E_t, F_t = sol_t
cx_t = -D_t/2; cy_t = -E_t/2; r_t = np.sqrt((D_t**2 + E_t**2)/4 - F_t)
print(f"Top-fit circle: center=({cx_t:.3f}, {cy_t:.3f}), radius={r_t:.3f}")

# Left only (leftmost x for each y, all rows)
left_pts = []
for y_ in range(sun_only.shape[0]):
    row = sun_only[y_, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        left_pts.append((xs.min(), y_))
left_pts = np.array(left_pts)
print(f"\nLeft boundary points only: {len(left_pts)}")
x_l = left_pts[:, 0]; y_l = left_pts[:, 1]
A_l = np.column_stack([x_l, y_l, np.ones(len(x_l))])
sol_l, *_ = np.linalg.lstsq(A_l, -(x_l**2 + y_l**2), rcond=None)
D_l, E_l, F_l = sol_l
cx_l = -D_l/2; cy_l = -E_l/2; r_l = np.sqrt((D_l**2 + E_l**2)/4 - F_l)
print(f"Left-fit circle: center=({cx_l:.3f}, {cy_l:.3f}), radius={r_l:.3f}")

# Bottom-left only (leftmost x for rows y > 400)
bl_pts = [(x_, y_) for x_, y_ in left_pts if y_ > 400]
bl_pts = np.array(bl_pts)
print(f"\nBottom-left boundary points only: {len(bl_pts)}")
x_b = bl_pts[:, 0]; y_b = bl_pts[:, 1]
A_b = np.column_stack([x_b, y_b, np.ones(len(x_b))])
sol_b, *_ = np.linalg.lstsq(A_b, -(x_b**2 + y_b**2), rcond=None)
D_b, E_b, F_b = sol_b
cx_b = -D_b/2; cy_b = -E_b/2; r_b = np.sqrt((D_b**2 + E_b**2)/4 - F_b)
print(f"Bottom-left-fit circle: center=({cx_b:.3f}, {cy_b:.3f}), radius={r_b:.3f}")

# Test the actual pixel coverage
print("\n=== Verification ===")
for cand_name, cand_cx, cand_cy, cand_r in [
    ("all-fit", cx, cy, r),
    ("top-fit", cx_t, cy_t, r_t),
    ("left-fit", cx_l, cy_l, r_l),
    ("bl-fit", cx_b, cy_b, r_b),
    ("hardcoded (335.5, 327, 335.5)", 335.5, 327, 335.5),
    ("hardcoded (327, 327, 327)", 327, 327, 327),
    ("hardcoded (340, 327, 340)", 340, 327, 340),
    ("hardcoded (340, 340, 340)", 340, 340, 340),
]:
    print(f"\n{cand_name}:")
    for y_test in [0, 100, 200, 232, 327, 400, 500, 600, 640, 650, 654]:
        row = sun_only[y_test, :]
        xs = np.where(row)[0]
        if len(xs) == 0: continue
        x_min_actual = xs.min()
        x_max_actual = xs.max()
        dy = y_test - cand_cy
        if abs(dy) > cand_r:
            x_left_pred_str = "N/A"
            x_right_pred_str = "N/A"
        else:
            x_left_pred = cand_cx - np.sqrt(cand_r**2 - dy**2)
            x_right_pred = cand_cx + np.sqrt(cand_r**2 - dy**2)
            x_left_pred_str = f"{x_left_pred:.1f}"
            x_right_pred_str = f"{x_right_pred:.1f}"
        print(f"  y={y_test}: actual x=[{x_min_actual},{x_max_actual}], pred left={x_left_pred_str}, right={x_right_pred_str}")
