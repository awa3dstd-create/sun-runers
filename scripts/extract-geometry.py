#!/usr/bin/env python3
"""Extract precise geometry of each icon component (sun + 3 rays)."""
from PIL import Image
import numpy as np
import json
from scipy import ndimage

IMG_PATH = "/home/z/my-project/upload/17861512721bcc.png"
img = Image.open(IMG_PATH).convert("RGB")
arr = np.array(img)
H, W, _ = arr.shape
lum = (0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2])
mask = lum > 128

# Icon region (from previous analysis)
icon_y_min, icon_y_max = 494, 1280
icon_xmin_global, icon_xmax_global = 516, 1623
icon_region = mask[icon_y_min:icon_y_max+1, icon_xmin_global:icon_xmax_global+1]

# Label components
labeled, num_features = ndimage.label(icon_region)
print(f"Components: {num_features}")

# For each ray (parallelogram), find the 4 corner coordinates
# A slanted parallelogram with 4 corners — find the convex hull of each component
from scipy.spatial import ConvexHull

components = []
for i in range(1, num_features+1):
    ys, xs = np.where(labeled == i)
    pts = np.column_stack([xs, ys])  # (x, y)
    hull = ConvexHull(pts)
    hull_pts = pts[hull.vertices]
    # Order hull points by angle from centroid
    centroid = hull_pts.mean(axis=0)
    angles = np.arctan2(hull_pts[:,1]-centroid[1], hull_pts[:,0]-centroid[0])
    order = np.argsort(angles)
    hull_pts = hull_pts[order]
    # Compute size
    comp = {
        'id': i,
        'size': int(len(ys)),
        'xmin': int(xs.min()),
        'xmax': int(xs.max()),
        'ymin': int(ys.min()),
        'ymax': int(ys.max()),
        'hull': hull_pts.tolist(),
    }
    components.append(comp)
    print(f"Comp {i}: bbox x=[{comp['xmin']},{comp['xmax']}] y=[{comp['ymin']},{comp['ymax']}] w={comp['xmax']-comp['xmin']+1} h={comp['ymax']-comp['ymin']+1} hull_pts={len(hull_pts)}")

# Sort components left to right
components.sort(key=lambda c: (c['xmin'] + c['xmax'])/2)

# === Identify sun vs rays ===
# Sun is component with largest area at the top-left
# Rays are components that span the bottom
sun = max(components, key=lambda c: c['size'])
rays = [c for c in components if c['id'] != sun['id']]
rays.sort(key=lambda c: c['xmin'])

print(f"\n=== SUN ===")
print(f"bbox x=[{sun['xmin']},{sun['xmax']}] y=[{sun['ymin']},{sun['ymax']}] w={sun['xmax']-sun['xmin']+1} h={sun['ymax']-sun['ymin']+1}")
# The sun is a circle with a cut on the lower-right.
# Find its center and radius from the bbox (it should be roughly square)
sun_w = sun['xmax'] - sun['xmin'] + 1
sun_h = sun['ymax'] - sun['ymin'] + 1
print(f"sun w={sun_w} h={sun_h}")
# The circle's bounding box (top half + left portion should be a full circle)
# Find the leftmost and topmost points
# Get the actual sun mask
sun_mask = (labeled == sun['id'])
# Find the topmost row that has many pixels (the top of the circle)
sun_ys, sun_xs = np.where(sun_mask)
# Find the leftmost column with high pixel density (left edge of circle)
# Look at the leftmost 50% of x-range to find the actual circle extent (excluding cut)
# Find the topmost row of the circle (it's a flat top of the circle)
print(f"sun x range actual: [{sun_xs.min()},{sun_xs.max()}]")
print(f"sun y range actual: [{sun_ys.min()},{sun_ys.max()}]")

# To find the circle's true center and radius, fit a circle to the upper-left arc
# Use the top half and left half of the sun
top_half_pts = []
for x in range(sun['xmin'], sun['xmax']+1):
    col = sun_mask[:, x]
    ys_in_col = np.where(col)[0]
    if len(ys_in_col) > 0:
        top_half_pts.append((x, ys_in_col.min()))  # topmost y for each column

left_half_pts = []
for y in range(sun['ymin'], sun['ymax']+1):
    row = sun_mask[y, :]
    xs_in_row = np.where(row)[0]
    if len(xs_in_row) > 0:
        left_half_pts.append((xs_in_row.min(), y))  # leftmost x for each row

print(f"\nTop-of-circle points (first 5): {top_half_pts[:5]}")
print(f"Top-of-circle points (last 5): {top_half_pts[-5:]}")
print(f"Left-of-circle points (first 5): {left_half_pts[:5]}")
print(f"Left-of-circle points (last 5): {left_half_pts[-5:]}")

# The leftmost x and topmost y form a quarter circle.
# Find circle center: topmost y gives center_y - radius; leftmost x gives center_x - radius
# But the cut removes part of the lower-right. The topmost-leftmost pixels define the circle bounds.
top_y_min = min(p[1] for p in top_half_pts)
left_x_min = min(p[0] for p in left_half_pts)
# Bottom of full circle would be top_y_min + diameter; right of full circle would be left_x_min + diameter
# But cut removes lower-right. Find where the circle's leftmost extent is widest (the vertical center)
# At the vertical center, the leftmost x = center_x - radius = left_x_min
# So center_x = left_x_min + radius, where radius = (widest_col_extent)/2 of the top arc
# Use top-half: find max horizontal extent (width) of the top arc
# Top arc: take rows from y_min to y_min + radius_estimate
# Estimate radius from top half width
# Use RANSAC-like fit
all_top_pts = np.array(top_half_pts)
# Find min y (topmost)
y_top = all_top_pts[:,1].min()
# At the topmost y, x should equal center_x (apex of circle)
topmost_cols = all_top_pts[all_top_pts[:,1] == y_top][:,0]
center_x_estimate = topmost_cols.mean()
print(f"\nTopmost y={y_top}, x at top={topmost_cols.tolist()} -> center_x≈{center_x_estimate:.2f}")

all_left_pts = np.array(left_half_pts)
x_left = all_left_pts[:,0].min()
leftmost_rows = all_left_pts[all_left_pts[:,0] == x_left][:,1]
center_y_estimate = leftmost_rows.mean()
print(f"Leftmost x={x_left}, y at left={leftmost_rows.tolist()} -> center_y≈{center_y_estimate:.2f}")

# Radius: distance from (center_x, center_y) to any top arc point
# At the top, dy = -radius, dx = 0; so radius = center_y - y_top
radius_estimate = center_y_estimate - y_top
print(f"Radius estimate: {radius_estimate:.2f}")
# Verify with leftmost: radius = center_x - x_left
radius_from_left = center_x_estimate - x_left
print(f"Radius from left: {radius_from_left:.2f}")

# Cross-check: the bbox width should be roughly equal to diameter if not for the cut
print(f"Bbox width: {sun_w}, height: {sun_h}, diameter would be: {2*radius_estimate:.2f}")

# === Analyze the cut ===
# The cut is on the lower-right. Find where the circle's right edge breaks.
# For each row y from top to bottom, find rightmost x
right_per_row = []
for y in range(sun['ymin'], sun['ymax']+1):
    row = sun_mask[y, :]
    xs_in_row = np.where(row)[0]
    if len(xs_in_row) > 0:
        right_per_row.append((y, xs_in_row.max()))

print(f"\nRight-of-circle points (first 5): {right_per_row[:5]}")
print(f"Right-of-circle points (last 10): {right_per_row[-10:]}")
# Where the right edge diverges from circle equation is where the cut starts

# === Now extract ray geometry ===
print("\n=== RAYS ===")
for i, ray in enumerate(rays):
    print(f"\nRay {i+1}: bbox x=[{ray['xmin']},{ray['xmax']}] y=[{ray['ymin']},{ray['ymax']}] w={ray['xmax']-ray['xmin']+1} h={ray['ymax']-ray['ymin']+1}")
    print(f"  Hull points ({len(ray['hull'])}):")
    for p in ray['hull']:
        print(f"    ({p[0]},{p[1]})")

# Save all geometry to JSON
geometry = {
    'icon_global': {
        'xmin': int(icon_xmin_global),
        'ymin': int(icon_y_min),
        'xmax': int(icon_xmax_global),
        'ymax': int(icon_y_max),
        'width': int(icon_xmax_global - icon_xmin_global + 1),
        'height': int(icon_y_max - icon_y_min + 1),
    },
    'sun': {
        'bbox': {'xmin': int(sun['xmin']), 'ymin': int(sun['ymin']), 'xmax': int(sun['xmax']), 'ymax': int(sun['ymax'])},
        'center_x': float(center_x_estimate),
        'center_y': float(center_y_estimate),
        'radius': float(radius_estimate),
    },
    'rays': [
        {
            'id': r['id'],
            'bbox': {'xmin': r['xmin'], 'ymin': r['ymin'], 'xmax': r['xmax'], 'ymax': r['ymax']},
            'hull': r['hull'],
        } for r in rays
    ],
    'text_global': {
        'xmin': 262, 'ymin': 1429, 'xmax': 1792, 'ymax': 1600,
    }
}

# Compute ray precise corners using convex hull but simplify to 4 corners
# Each ray is a parallelogram — fit a parallelogram to its hull
def fit_parallelogram(hull_pts):
    """Fit a parallelogram to a set of hull points by finding the 4 extreme corners."""
    hull = np.array(hull_pts)
    # Use convex hull again (already convex), find 4 corners via PCA
    # Approach: find the two longest edges of the convex hull, those define the parallelogram
    # Simpler: use min-area bounding rectangle
    from scipy.spatial import ConvexHull
    if len(hull) < 3:
        return hull[:4].tolist()
    # Compute edges and find dominant directions
    # Use rotating calipers: find min-area bounding rectangle
    ch = ConvexHull(hull)
    pts = hull[ch.vertices]
    # Try all edge directions
    best_rect = None
    best_area = float('inf')
    for i in range(len(pts)):
        # Edge from pts[i] to pts[i+1]
        p1 = pts[i]
        p2 = pts[(i+1) % len(pts)]
        edge = p2 - p1
        edge_len = np.linalg.norm(edge)
        if edge_len < 1: continue
        edge_dir = edge / edge_len
        # Perpendicular
        perp = np.array([-edge_dir[1], edge_dir[0]])
        # Project all points onto edge_dir and perp
        rel = pts - p1
        proj_e = rel @ edge_dir
        proj_p = rel @ perp
        e_min, e_max = proj_e.min(), proj_e.max()
        p_min, p_max = proj_p.min(), proj_p.max()
        area = (e_max - e_min) * (p_max - p_min)
        if area < best_area:
            best_area = area
            # 4 corners
            c1 = p1 + edge_dir * e_min + perp * p_min
            c2 = p1 + edge_dir * e_max + perp * p_min
            c3 = p1 + edge_dir * e_max + perp * p_max
            c4 = p1 + edge_dir * e_min + perp * p_max
            best_rect = [c1, c2, c3, c4]
    return best_rect

for i, ray in enumerate(rays):
    corners = fit_parallelogram(ray['hull'])
    ray['corners'] = [[float(c[0]), float(c[1])] for c in corners]
    print(f"\nRay {i+1} fitted parallelogram corners:")
    for c in corners:
        print(f"  ({c[0]:.2f}, {c[1]:.2f})")
    # Compute slant angle: take edge from corner 0 to corner 1
    c = np.array(corners)
    edge = c[1] - c[0]
    angle = np.degrees(np.arctan2(-edge[1], edge[0]))  # negative y because image y is inverted
    print(f"  Edge angle (horizontal): {angle:.2f}°")
    edge_len = np.linalg.norm(edge)
    edge2 = c[2] - c[1]
    edge2_len = np.linalg.norm(edge2)
    print(f"  Edge1 length (long axis): {edge_len:.2f}")
    print(f"  Edge2 length (thickness): {edge2_len:.2f}")

with open('/tmp/logo-geometry.json', 'w') as f:
    json.dump(geometry, f, indent=2)
print("\nSaved geometry to /tmp/logo-geometry.json")
