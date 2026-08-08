#!/usr/bin/env python3
"""Trace sun and rays from grayscale luminance, preserving sharp corners."""
from PIL import Image
import numpy as np
import json
from skimage import measure
from scipy import ndimage
from scipy.spatial import ConvexHull

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)
lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]).astype(float)
# Normalize to 0-1
lum_norm = lum / 255.0

# Icon region (in image coords): x=[516, 1623], y=[494, 1280]
icon_x_min, icon_x_max = 516, 1623
icon_y_min, icon_y_max = 494, 1280
icon_lum = lum_norm[icon_y_min:icon_y_max+1, icon_x_min:icon_x_max+1]

# Find contours at level 0.5 (50% intensity — the mathematical edge)
contours = measure.find_contours(icon_lum, 0.5)
print(f"Found {len(contours)} contours in icon")
for i, c in enumerate(contours):
    print(f"  Contour {i}: {len(c)} points, x=[{c[:,1].min():.1f},{c[:,1].max():.1f}] y=[{c[:,0].min():.1f},{c[:,0].max():.1f}]")

# Identify which contour is which (sun vs rays) by their bounding boxes
# Sun: large, top-left
# Rays: 3 strips on the right

contour_info = []
for i, c in enumerate(contours):
    info = {
        'idx': i,
        'n_points': len(c),
        'x_min': float(c[:,1].min()),
        'x_max': float(c[:,1].max()),
        'y_min': float(c[:,0].min()),
        'y_max': float(c[:,0].max()),
        'x_center': float((c[:,1].min() + c[:,1].max())/2),
        'y_center': float((c[:,0].min() + c[:,0].max())/2),
    }
    info['width'] = info['x_max'] - info['x_min']
    info['height'] = info['y_max'] - info['y_min']
    info['area'] = info['width'] * info['height']
    contour_info.append(info)

# Sort by area; sun is largest
contour_info.sort(key=lambda c: c['area'], reverse=True)
print("\nContours sorted by area:")
for c in contour_info:
    print(f"  Contour {c['idx']}: area={c['area']:.0f}, bbox=[{c['x_min']:.0f},{c['y_min']:.0f},{c['x_max']:.0f},{c['y_max']:.0f}]")

# Sun = largest contour
sun_contour = contours[contour_info[0]['idx']]
# Rays = next 3 largest, sorted by x_center (left to right)
ray_contours_info = contour_info[1:4]
ray_contours_info.sort(key=lambda c: c['x_center'])
ray_contours = [contours[c['idx']] for c in ray_contours_info]

print(f"\nSun contour: {len(sun_contour)} points")
for i, rc in enumerate(ray_contours):
    print(f"Ray {i+1} contour: {len(rc)} points")

# === Simplify each contour preserving corners ===
def simplify_with_corners(contour, tol=0.5, angle_threshold_deg=15):
    """Simplify contour using RDP, but preserve points where the angle changes significantly.
    
    The contour is (N, 2) array of (row, col) = (y, x).
    Returns simplified contour as (M, 2) array.
    """
    from scipy.spatial.distance import euclidean
    pts = contour.astype(float)
    n = len(pts)
    
    # First, mark corner points (where direction changes significantly)
    is_corner = np.zeros(n, dtype=bool)
    for i in range(n):
        p_prev = pts[(i - 1) % n]
        p_curr = pts[i]
        p_next = pts[(i + 1) % n]
        v1 = p_curr - p_prev
        v2 = p_next - p_curr
        n1 = np.linalg.norm(v1)
        n2 = np.linalg.norm(v2)
        if n1 < 1e-6 or n2 < 1e-6:
            is_corner[i] = True
            continue
        cos_angle = np.dot(v1, v2) / (n1 * n2)
        cos_angle = np.clip(cos_angle, -1, 1)
        angle = np.degrees(np.arccos(cos_angle))
        if angle > angle_threshold_deg:
            is_corner[i] = True
    
    # Now do RDP, but force-include corners
    # Split contour into segments between corners, apply RDP to each
    corner_indices = np.where(is_corner)[0]
    if len(corner_indices) == 0:
        # No corners, just apply RDP to whole contour
        return rdp(pts, tol)
    
    # Add the first index if not present (for closed contour)
    if corner_indices[0] != 0:
        corner_indices = np.concatenate([[0], corner_indices])
    
    simplified = []
    for i in range(len(corner_indices)):
        start_idx = corner_indices[i]
        end_idx = corner_indices[(i + 1) % len(corner_indices)]
        if end_idx <= start_idx:
            segment = np.concatenate([pts[start_idx:], pts[:end_idx+1]])
        else:
            segment = pts[start_idx:end_idx+1]
        simplified_segment = rdp(segment, tol)
        # Exclude last point (it's the first of next segment)
        simplified.extend(simplified_segment[:-1].tolist())
    
    return np.array(simplified)

def rdp(points, epsilon):
    """Ramer-Douglas-Peucker simplification."""
    if len(points) < 3:
        return points
    
    def perp_distance(pt, line_start, line_end):
        if np.allclose(line_start, line_end):
            return np.linalg.norm(pt - line_start)
        line_vec = line_end - line_start
        line_len = np.linalg.norm(line_vec)
        line_unit = line_vec / line_len
        pt_vec = pt - line_start
        proj_len = np.dot(pt_vec, line_unit)
        proj = line_start + line_unit * proj_len
        return np.linalg.norm(pt - proj)
    
    # Find point with max distance
    dmax = 0
    idx = 0
    for i in range(1, len(points)-1):
        d = perp_distance(points[i], points[0], points[-1])
        if d > dmax:
            dmax = d
            idx = i
    
    if dmax > epsilon:
        left = rdp(points[:idx+1], epsilon)
        right = rdp(points[idx:], epsilon)
        return np.vstack([left[:-1], right])
    else:
        return np.array([points[0], points[-1]])

# Simplify each contour
print("\n=== Simplifying contours ===")
sun_simplified = simplify_with_corners(sun_contour, tol=0.5, angle_threshold_deg=20)
print(f"Sun: {len(sun_contour)} -> {len(sun_simplified)} points")

ray_simplified = []
for i, rc in enumerate(ray_contours):
    rs = simplify_with_corners(rc, tol=0.5, angle_threshold_deg=20)
    print(f"Ray {i+1}: {len(rc)} -> {len(rs)} points")
    ray_simplified.append(rs)

# === Convert to SVG path with LINEAR segments (not Bezier) ===
def contour_to_linear_path(contour, close=True):
    """Convert contour to SVG path with linear segments (L commands)."""
    # contour is (N, 2) array of (y, x); convert to (x, y)
    pts = contour[:, [1, 0]]  # (x, y)
    path = f"M {pts[0][0]:.2f},{pts[0][1]:.2f}"
    for i in range(1, len(pts)):
        path += f" L {pts[i][0]:.2f},{pts[i][1]:.2f}"
    if close:
        path += " Z"
    return path

sun_path = contour_to_linear_path(sun_simplified)
ray_paths = [contour_to_linear_path(rs) for rs in ray_simplified]

# Save paths
paths_data = {
    'sun': {'path': sun_path, 'n_points': len(sun_simplified)},
    'rays': [{'path': p, 'n_points': len(rs)} for p, rs in zip(ray_paths, ray_simplified)],
}
with open('/tmp/icon-paths-v2.json', 'w') as f:
    json.dump(paths_data, f, indent=2)

# Generate preview SVG
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1108 787" width="1108" height="787">
  <rect width="1108" height="787" fill="black"/>
  <g fill="white" stroke="none" fill-rule="evenodd">
    <path d="{sun_path}"/>
'''
for p in ray_paths:
    svg += f'    <path d="{p}"/>\n'
svg += '  </g>\n</svg>'

with open('/tmp/icon-preview-v2.svg', 'w') as f:
    f.write(svg)
print("\nSaved /tmp/icon-preview-v2.svg")

# Render to PNG
import cairosvg
cairosvg.svg2png(url="/tmp/icon-preview-v2.svg", write_to="/tmp/icon-preview-v2.png", output_width=1108, output_height=787)
print("Saved /tmp/icon-preview-v2.png")

# Side-by-side comparison
orig = img.crop((516, 494, 1623, 1280)).convert('RGB')
preview = Image.open('/tmp/icon-preview-v2.png').convert('RGB')
preview = preview.resize(orig.size, Image.LANCZOS)
combined = Image.new('RGB', (orig.width*2 + 20, orig.height), 'gray')
combined.paste(orig, (0, 0))
combined.paste(preview, (orig.width + 20, 0))
combined.save('/tmp/icon-comparison-v2.png')
print("Saved /tmp/icon-comparison-v2.png")
