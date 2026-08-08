#!/usr/bin/env python3
"""Clean tracing using connected components, then construct SVG with geometric sun."""
from PIL import Image
import numpy as np
import json
from skimage import measure
from scipy import ndimage

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)
lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]).astype(float)
lum_norm = lum / 255.0

# Use 50% threshold for binary mask (then trace each connected component)
mask = lum_norm > 0.5

icon_x_min, icon_x_max = 516, 1623
icon_y_min, icon_y_max = 494, 1280
icon_region = mask[icon_y_min:icon_y_max+1, icon_x_min:icon_x_max+1]
icon_lum = lum_norm[icon_y_min:icon_y_max+1, icon_x_min:icon_x_max+1]

# Label connected components
labeled, n = ndimage.label(icon_region)
print(f"Connected components: {n}")

# For each component, get its outer contour
component_contours = []
for i in range(1, n+1):
    comp_mask = (labeled == i)
    # Pad to avoid edge issues
    padded = np.pad(comp_mask, 1)
    contours = measure.find_contours(padded.astype(float), 0.5)
    if not contours:
        continue
    # Take the longest contour (outer)
    longest = max(contours, key=len)
    # Remove padding offset (subtract 1)
    longest = longest - 1
    # Get component bbox
    ys, xs = np.where(comp_mask)
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    component_contours.append({
        'label': i,
        'contour': longest,
        'n_points': len(longest),
        'bbox': bbox,
        'width': bbox[2] - bbox[0],
        'height': bbox[3] - bbox[1],
        'area': int(comp_mask.sum()),
    })

# Sort by area (largest first)
component_contours.sort(key=lambda c: c['area'], reverse=True)
print("\nComponents by area:")
for c in component_contours:
    print(f"  Label {c['label']}: area={c['area']}, bbox={c['bbox']}, w={c['width']}, h={c['height']}, contour_pts={c['n_points']}")

# Sun = largest, rays = next 3 (sorted by x_center, left to right)
sun_comp = component_contours[0]
ray_comps = sorted(component_contours[1:4], key=lambda c: (c['bbox'][0] + c['bbox'][2])/2)

print(f"\nSun: bbox={sun_comp['bbox']}, contour_pts={sun_comp['n_points']}")
for i, rc in enumerate(ray_comps):
    print(f"Ray {i+1}: bbox={rc['bbox']}, contour_pts={rc['n_points']}")

# === Simplify contours preserving corners ===
def rdp(points, epsilon):
    """Ramer-Douglas-Peucker simplification."""
    if len(points) < 3:
        return points
    pts = np.asarray(points, dtype=float)
    
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
    
    dmax = 0
    idx = 0
    for i in range(1, len(pts)-1):
        d = perp_distance(pts[i], pts[0], pts[-1])
        if d > dmax:
            dmax = d
            idx = i
    
    if dmax > epsilon:
        left = rdp(pts[:idx+1], epsilon)
        right = rdp(pts[idx:], epsilon)
        return np.vstack([left[:-1], right])
    else:
        return np.array([pts[0], pts[-1]])

def simplify_preserve_corners(contour, tol=0.8, corner_angle_deg=20):
    """Simplify contour: detect corners, use RDP between corners."""
    pts = contour.astype(float)
    n = len(pts)
    
    # Detect corners
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
            continue
        cos_angle = np.dot(v1, v2) / (n1 * n2)
        cos_angle = np.clip(cos_angle, -1, 1)
        angle = np.degrees(np.arccos(cos_angle))
        # angle is the EXTERIOR angle (deviation from straight)
        # angle = 180 - interior_angle
        # For a straight line, angle = 0 (no deviation)
        # For a sharp corner, angle is large
        if angle > corner_angle_deg:
            is_corner[i] = True
    
    corner_indices = np.where(is_corner)[0]
    print(f"    Detected {len(corner_indices)} corner points")
    
    if len(corner_indices) < 2:
        # No corners, just RDP whole thing
        return rdp(pts, tol)
    
    # Apply RDP between consecutive corners
    simplified = []
    for i in range(len(corner_indices)):
        start_idx = corner_indices[i]
        end_idx = corner_indices[(i + 1) % len(corner_indices)]
        if end_idx <= start_idx:
            segment = np.concatenate([pts[start_idx:], pts[:end_idx+1]])
        else:
            segment = pts[start_idx:end_idx+1]
        simp = rdp(segment, tol)
        # Exclude last point (it's the first of next segment)
        if i < len(corner_indices) - 1:
            simplified.extend(simp[:-1].tolist())
        else:
            # For the last segment, also exclude the last point (which is the first corner)
            simplified.extend(simp[:-1].tolist())
    
    return np.array(simplified)

print("\n=== Simplifying ===")
# Use plain RDP with appropriate tolerance
# RDP naturally preserves corners because they have high perpendicular distance
sun_simp = rdp(sun_comp['contour'], epsilon=1.0)
print(f"  Sun: {sun_comp['n_points']} -> {len(sun_simp)} points")

ray_simp = []
for i, rc in enumerate(ray_comps):
    rs = rdp(rc['contour'], epsilon=1.0)
    print(f"  Ray {i+1}: {rc['n_points']} -> {len(rs)} points")
    ray_simp.append(rs)

# === Convert to SVG path (LINE segments, no Bezier) ===
def to_svg_path(contour, close=True):
    """Convert (N, 2) array of (y, x) to SVG path with L commands."""
    pts = contour[:, [1, 0]]  # (x, y)
    path = f"M {pts[0][0]:.2f},{pts[0][1]:.2f}"
    for i in range(1, len(pts)):
        path += f" L {pts[i][0]:.2f},{pts[i][1]:.2f}"
    if close:
        path += " Z"
    return path

sun_path = to_svg_path(sun_simp)
ray_paths = [to_svg_path(rs) for rs in ray_simp]

# === Generate SVG ===
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1108 787" width="1108" height="787">
  <rect width="1108" height="787" fill="black"/>
  <g fill="white" stroke="none" fill-rule="evenodd">
    <path d="{sun_path}"/>
'''
for p in ray_paths:
    svg += f'    <path d="{p}"/>\n'
svg += '  </g>\n</svg>'

with open('/tmp/icon-preview-v3.svg', 'w') as f:
    f.write(svg)
print("\nSaved /tmp/icon-preview-v3.svg")

import cairosvg
cairosvg.svg2png(url="/tmp/icon-preview-v3.svg", write_to="/tmp/icon-preview-v3.png", output_width=1108, output_height=787)

# Comparison
orig = img.crop((516, 494, 1623, 1280)).convert('RGB')
preview = Image.open('/tmp/icon-preview-v3.png').convert('RGB')
preview = preview.resize(orig.size, Image.LANCZOS)
combined = Image.new('RGB', (orig.width*2 + 20, orig.height), 'gray')
combined.paste(orig, (0, 0))
combined.paste(preview, (orig.width + 20, 0))
combined.save('/tmp/icon-comparison-v3.png')
print("Saved /tmp/icon-comparison-v3.png")

# Save paths to JSON
output = {
    'sun_path': sun_path,
    'sun_n_points': len(sun_simp),
    'ray_paths': ray_paths,
    'ray_n_points': [len(rs) for rs in ray_simp],
}
with open('/tmp/icon-paths-v3.json', 'w') as f:
    json.dump(output, f, indent=2)
print("Saved paths to /tmp/icon-paths-v3.json")
