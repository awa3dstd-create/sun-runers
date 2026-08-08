#!/usr/bin/env python3
"""Fit ellipse to sun boundary and produce final geometry."""
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

# Get boundary pixels: topmost and leftmost points (unaffected by cut)
# Top boundary: for each column x, the topmost y. Only use columns where topmost y < 233 (above cut).
top_boundary = []
for x in range(sun_only.shape[1]):
    col = sun_only[:, x]
    ys = np.where(col)[0]
    if len(ys) > 0 and ys.min() < 230:
        top_boundary.append((x, ys.min()))

# Left boundary: for each row y, the leftmost x. Only use rows where leftmost x < 323 (left of center).
left_boundary = []
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0 and xs.min() < 320:
        left_boundary.append((xs.min(), y))

# Combine boundary points (excluding any that might be affected by the cut)
boundary_pts = top_boundary + left_boundary
boundary_pts = np.array(boundary_pts)
print(f"Total boundary points for fitting: {len(boundary_pts)}")

# Fit ellipse: general conic Ax² + Bxy + Cy² + Dx + Ey + F = 0
# For ellipse: B² - 4AC < 0
# Use direct least squares ellipse fit (Fitzgibbon method)
def fit_ellipse(points):
    x = points[:, 0]
    y = points[:, 1]
    # Design matrix
    D = np.column_stack([x**2, x*y, y**2, x, y, np.ones_like(x)])
    # Constraint matrix
    S = D.T @ D
    C = np.zeros((6, 6))
    C[0, 2] = 2
    C[2, 0] = 2
    C[1, 1] = -1
    # Solve generalized eigenvalue problem
    try:
        from scipy.linalg import eigh
        # S^{-1} C v = lambda v (with constraint 4AC - B² = 1)
        # Use the formulation: maximize v^T S v subject to v^T C v = 1
        # Eigen-decomposition of S, then transform
        # Simpler: use pinv
        eigvals, eigvecs = np.linalg.eig(np.linalg.pinv(S) @ C)
        # Find the eigenvector with positive eigenvalue (smallest positive)
        # For ellipse, we need 4AC - B² > 0
        for i, val in enumerate(eigvals):
            v = eigvecs[:, i]
            A_, B_, C_, D_, E_, F_ = v
            disc = B_**2 - 4*A_*C_
            if disc < -1e-6:  # ellipse
                # Normalize
                return v / np.linalg.norm(v) * np.sign(v[0])
        return None
    except Exception as e:
        print(f"Ellipse fit failed: {e}")
        return None

v = fit_ellipse(boundary_pts)
if v is None:
    print("Ellipse fit failed; falling back to circle")
else:
    A_, B_, C_, D_, E_, F_ = v
    # Convert to center/axes/rotation
    # Center: solving 2Ax + By + D = 0 and Bx + 2Cy + E = 0
    cx = (2*C_*D_ - B_*E_) / (B_**2 - 4*A_*C_)
    cy = (2*A_*E_ - B_*D_) / (B_**2 - 4*A_*C_)
    # Axes
    diff = np.sqrt((A_ - C_)**2 + B_**2)
    a_axis = np.sqrt(2 * (A_*E_**2 + C_*D_**2 - B_*D_*E_ + (B_**2 - 4*A_*C_)*F_) / ((B_**2 - 4*A_*C_) * (diff - (A_ + C_))))
    b_axis = np.sqrt(2 * (A_*E_**2 + C_*D_**2 - B_*D_*E_ + (B_**2 - 4*A_*C_)*F_) / ((B_**2 - 4*A_*C_) * (-diff - (A_ + C_))))
    theta = 0.5 * np.arctan2(B_, A_ - C_) if abs(B_) > 1e-10 else 0
    print(f"\nFitted ellipse:")
    print(f"  Center: ({cx:.3f}, {cy:.3f})")
    print(f"  Semi-axes: a={max(a_axis, b_axis):.3f}, b={min(a_axis, b_axis):.3f}")
    print(f"  Rotation: {np.degrees(theta):.3f}°")

# Test multiple ellipse/circle candidates and pick the one with the smallest residual
candidates = [
    {'name': 'circle(323.5, 327, r=327)', 'cx': 323.5, 'cy': 327, 'a': 327, 'b': 327, 'theta': 0},
    {'name': 'circle(341, 341, r=341)', 'cx': 341, 'cy': 341, 'a': 341, 'b': 341, 'theta': 0},
    {'name': 'circle(335, 327, r=335)', 'cx': 335, 'cy': 327, 'a': 335, 'b': 335, 'theta': 0},
    {'name': 'ellipse(323.5, 327, 323.5, 327)', 'cx': 323.5, 'cy': 327, 'a': 323.5, 'b': 327, 'theta': 0},
    {'name': 'ellipse(327, 327, 327, 327.5)', 'cx': 327, 'cy': 327, 'a': 327, 'b': 327.5, 'theta': 0},
    {'name': 'ellipse(323, 327, 323, 327)', 'cx': 323, 'cy': 327, 'a': 323, 'b': 327, 'theta': 0},
]
if v is not None:
    candidates.insert(0, {
        'name': f'fitted_ellipse({cx:.1f},{cy:.1f},a={max(a_axis,b_axis):.1f},b={min(a_axis,b_axis):.1f})',
        'cx': float(cx), 'cy': float(cy), 'a': float(max(a_axis, b_axis)), 'b': float(min(a_axis, b_axis)), 'theta': float(theta)
    })

print("\n=== Comparing candidates ===")
for cand in candidates:
    cx, cy = cand['cx'], cand['cy']
    a, b = cand['a'], cand['b']
    theta = cand.get('theta', 0)
    # Compute residuals against boundary points
    residuals = []
    for x, y in boundary_pts:
        # Transformed to ellipse-aligned coords
        dx = x - cx
        dy = y - cy
        if abs(theta) > 1e-6:
            xt = dx * np.cos(theta) + dy * np.sin(theta)
            yt = -dx * np.sin(theta) + dy * np.cos(theta)
        else:
            xt, yt = dx, dy
        # Ellipse equation: (xt/a)² + (yt/b)² = 1
        val = (xt/a)**2 + (yt/b)**2 - 1
        residuals.append(val)
    residuals = np.array(residuals)
    rmse = np.sqrt((residuals**2).mean())
    max_res = np.abs(residuals).max()
    print(f"  {cand['name']}: RMSE={rmse:.4f}, max={max_res:.4f}")

# Save boundary points for inspection
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(10, 10))
ax.imshow(sun_only, cmap='gray_r', extent=[0, sun_only.shape[1], sun_only.shape[0], 0])
bp = np.array(boundary_pts)
ax.scatter(bp[:,0], bp[:,1], c='red', s=1)
# Plot candidates
theta_range = np.linspace(0, 2*np.pi, 200)
for cand in candidates[:3]:
    cx, cy = cand['cx'], cand['cy']
    a, b = cand['a'], cand['b']
    x_ell = cx + a * np.cos(theta_range)
    y_ell = cy + b * np.sin(theta_range)
    ax.plot(x_ell, y_ell, label=cand['name'], linewidth=1)
ax.legend()
ax.set_title('Sun boundary points (red) vs candidate ellipses')
plt.savefig('/tmp/ellipse-fit.png', dpi=100, bbox_inches='tight')
print("\nSaved /tmp/ellipse-fit.png")
