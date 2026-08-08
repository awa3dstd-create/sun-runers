#!/usr/bin/env python3
"""Trace the text 'SUN-RUNNERS' from the original image."""
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

# Text region: x=[262, 1792], y=[1429, 1600] (image coords)
text_x_min, text_x_max = 262, 1792
text_y_min, text_y_max = 1429, 1600
text_region = (lum_norm > 0.5)[text_y_min:text_y_max+1, text_x_min:text_x_max+1]
text_lum = lum_norm[text_y_min:text_y_max+1, text_x_min:text_x_max+1]

print(f"Text region size: {text_region.shape}")

# Find connected components (each letter is a separate component, except "U" and "N" might merge)
labeled, n = ndimage.label(text_region)
print(f"Connected components: {n}")

# For each component, get bbox and outer contour
components = []
for i in range(1, n+1):
    comp_mask = (labeled == i)
    ys, xs = np.where(comp_mask)
    if len(ys) < 10:  # skip tiny noise
        continue
    bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))
    # Get contour
    padded = np.pad(comp_mask, 1)
    contours = measure.find_contours(padded.astype(float), 0.5)
    if not contours:
        continue
    longest = max(contours, key=len) - 1
    components.append({
        'label': i,
        'bbox': bbox,
        'contour': longest,
        'n_points': len(longest),
        'area': int(comp_mask.sum()),
    })

# Sort by x (left to right)
components.sort(key=lambda c: c['bbox'][0])

print(f"\nComponents (sorted left to right):")
for c in components:
    print(f"  Label {c['label']}: bbox={c['bbox']}, w={c['bbox'][2]-c['bbox'][0]}, h={c['bbox'][3]-c['bbox'][1]}, area={c['area']}, pts={c['n_points']}")

# === Simplify each component with RDP ===
def rdp(points, epsilon):
    """Ramer-Douglas-Peucker simplification."""
    if len(points) < 3:
        return np.asarray(points, dtype=float)
    pts = np.asarray(points, dtype=float)
    
    def perp_distance(pt, line_start, line_end):
        if np.allclose(line_start, line_end):
            return np.linalg.norm(pt - line_start)
        line_vec = line_end - line_start
        line_len = np.linalg.norm(line_vec)
        if line_len < 1e-9:
            return np.linalg.norm(pt - line_start)
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

# Use moderate tolerance to keep letterforms clean
print("\n=== Simplifying text components ===")
simplified_components = []
for c in components:
    simp = rdp(c['contour'], epsilon=0.8)
    print(f"  Label {c['label']}: {c['n_points']} -> {len(simp)} points")
    simplified_components.append({
        'bbox': c['bbox'],
        'contour': simp,
        'n_points': len(simp),
    })

# === Convert to SVG paths ===
def to_svg_path(contour, close=True):
    """Convert (N, 2) array of (y, x) to SVG path with L commands."""
    pts = contour[:, [1, 0]]  # (x, y)
    path = f"M {pts[0][0]:.2f},{pts[0][1]:.2f}"
    for i in range(1, len(pts)):
        path += f" L {pts[i][0]:.2f},{pts[i][1]:.2f}"
    if close:
        path += " Z"
    return path

text_paths = [to_svg_path(c['contour']) for c in simplified_components]

# Total text bbox
text_w = text_x_max - text_x_min
text_h = text_y_max - text_y_min
print(f"\nText bbox: w={text_w}, h={text_h}")

# === Generate SVG preview ===
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {text_w} {text_h}" width="{text_w}" height="{text_h}">
  <rect width="{text_w}" height="{text_h}" fill="black"/>
  <g fill="white" stroke="none" fill-rule="evenodd">
'''
for p in text_paths:
    svg += f'    <path d="{p}"/>\n'
svg += '  </g>\n</svg>'

with open('/tmp/text-preview.svg', 'w') as f:
    f.write(svg)
print("Saved /tmp/text-preview.svg")

import cairosvg
cairosvg.svg2png(url="/tmp/text-preview.svg", write_to="/tmp/text-preview.png", output_width=text_w, output_height=text_h)
print("Saved /tmp/text-preview.png")

# Side by side comparison
orig = img.crop((text_x_min, text_y_min, text_x_max+1, text_y_max+1)).convert('RGB')
preview = Image.open('/tmp/text-preview.png').convert('RGB')
preview = preview.resize(orig.size, Image.LANCZOS)
combined = Image.new('RGB', (orig.width*2 + 20, orig.height), 'gray')
combined.paste(orig, (0, 0))
combined.paste(preview, (orig.width + 20, 0))
combined.save('/tmp/text-comparison.png')
print("Saved /tmp/text-comparison.png")

# Save paths data
output = {
    'text_bbox': {'x': text_x_min, 'y': text_y_min, 'w': text_w, 'h': text_h},
    'component_paths': text_paths,
    'component_bboxes': [c['bbox'] for c in simplified_components],
}
with open('/tmp/text-paths.json', 'w') as f:
    json.dump(output, f, indent=2)
print("Saved /tmp/text-paths.json")
