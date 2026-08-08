#!/usr/bin/env python3
"""Trace sun and rays using marching squares, smooth into SVG paths."""
from PIL import Image
import numpy as np
import json
from skimage import measure

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
# Sort components by size
comps_sorted = sorted(range(1, n+1), key=lambda i: sizes[i-1], reverse=True)
print(f"Components (sorted by size): {[(i, int(sizes[i-1])) for i in comps_sorted]}")

# Sun = largest, rays = others (sorted left to right)
sun_label = comps_sorted[0]
ray_labels = sorted([i for i in comps_sorted[1:]], key=lambda i: ndimage.center_of_mass(icon_region, labeled, i)[1])

# === Get high-resolution contours for each component ===
# Use a higher threshold for cleaner edges (0.5 = exact pixel boundary)
# Actually, use level=0.5 for binary mask to get pixel-perfect boundary

def get_clean_contour(component_mask):
    """Get the outer contour of a binary mask, cleaned and ordered."""
    # Pad to avoid boundary issues
    padded = np.pad(component_mask, 1)
    contours = measure.find_contours(padded.astype(float), 0.5)
    if not contours:
        return None
    # Take the longest contour (outer boundary)
    longest = max(contours, key=len)
    # Remove padding offset
    longest = longest - 1
    return longest  # (row, col) = (y, x)

def simplify_contour(contour, tolerance=1.0):
    """Simplify a contour using Douglas-Reucker algorithm."""
    from scipy.spatial.distance import euclidean
    def perp_distance(pt, line_start, line_end):
        if np.allclose(line_start, line_end):
            return euclidean(pt, line_start)
        # Project pt onto line
        line_vec = line_end - line_start
        line_len = np.linalg.norm(line_vec)
        line_unit = line_vec / line_len
        pt_vec = pt - line_start
        proj_len = np.dot(pt_vec, line_unit)
        proj = line_start + line_unit * proj_len
        return euclidean(pt, proj)
    
    def rdp(points, eps):
        if len(points) < 3:
            return points
        # Find point with max distance from line connecting first and last
        dmax = 0
        idx = 0
        for i in range(1, len(points)-1):
            d = perp_distance(points[i], points[0], points[-1])
            if d > dmax:
                dmax = d
                idx = i
        if dmax > eps:
            left = rdp(points[:idx+1], eps)
            right = rdp(points[idx:], eps)
            return left[:-1] + right
        else:
            return [points[0], points[-1]]
    
    points = [np.array(p) for p in contour]
    simplified = rdp(points, tolerance)
    return np.array(simplified)

def contour_to_smooth_path(contour):
    """Convert contour to smooth SVG path using Catmull-Rom to Bezier conversion."""
    # contour is (N, 2) array of (row, col) = (y, x)
    # Convert to (x, y) and reverse y for SVG (top-down)
    pts = contour[:, [1, 0]].astype(float)  # (x, y)
    n = len(pts)
    if n < 3:
        return ""
    
    # Build SVG path using cubic Bezier curves between consecutive points
    # Use Catmull-Rom spline (tension=0.5)
    path_parts = [f"M {pts[0][0]:.2f},{pts[0][1]:.2f}"]
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        # Catmull-Rom to Bezier conversion
        # cp1 = p1 + (p2 - p0) / 6
        # cp2 = p2 - (p3 - p1) / 6
        cp1x = p1[0] + (p2[0] - p0[0]) / 6
        cp1y = p1[1] + (p2[1] - p0[1]) / 6
        cp2x = p2[0] - (p3[0] - p1[0]) / 6
        cp2y = p2[1] - (p3[1] - p1[1]) / 6
        path_parts.append(f"C {cp1x:.2f},{cp1y:.2f} {cp2x:.2f},{cp2y:.2f} {p2[0]:.2f},{p2[1]:.2f}")
    path_parts.append("Z")
    return " ".join(path_parts)

# Process each component
components_data = []

# Sun
sun_mask = (labeled == sun_label)
sun_contour = get_clean_contour(sun_mask)
print(f"Sun contour: {len(sun_contour)} points")
sun_simplified = simplify_contour(sun_contour, tolerance=0.8)
print(f"Sun simplified: {len(sun_simplified)} points")
sun_path = contour_to_smooth_path(sun_simplified)
components_data.append({'name': 'sun', 'path': sun_path, 'n_points': len(sun_simplified)})

# Rays
for i, ray_label in enumerate(ray_labels):
    ray_mask = (labeled == ray_label)
    ray_contour = get_clean_contour(ray_mask)
    print(f"Ray {i+1} contour: {len(ray_contour)} points")
    ray_simplified = simplify_contour(ray_contour, tolerance=0.8)
    print(f"Ray {i+1} simplified: {len(ray_simplified)} points")
    ray_path = contour_to_smooth_path(ray_simplified)
    components_data.append({'name': f'ray{i+1}', 'path': ray_path, 'n_points': len(ray_simplified)})

# Save the paths to JSON
with open('/tmp/icon-paths.json', 'w') as f:
    json.dump(components_data, f, indent=2)
print(f"\nSaved {len(components_data)} component paths to /tmp/icon-paths.json")

# Also save an SVG preview to verify
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1108 787" width="554" height="393.5">
  <rect width="1108" height="787" fill="black"/>
  <g fill="white" stroke="none">
'''
for c in components_data:
    svg += f'    <path d="{c["path"]}"/>\n'
svg += '  </g>\n</svg>'
with open('/tmp/icon-preview.svg', 'w') as f:
    f.write(svg)
print("Saved /tmp/icon-preview.svg")

# Render preview to PNG for inspection
import subprocess
result = subprocess.run(['python3', '-c', '''
from PIL import Image
import cairosvg
cairosvg.svg2png(url="/tmp/icon-preview.svg", write_to="/tmp/icon-preview.png", output_width=1108, output_height=787)
print("Saved PNG preview")
'''], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
