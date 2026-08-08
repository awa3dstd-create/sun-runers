#!/usr/bin/env python3
"""Save the sun's outline as a high-res visualization."""
from PIL import Image
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

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

# Print all the boundary points (leftmost x for each y, rightmost x for each y)
print("Sun complete outline (y, x_left, x_right):")
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        print(f"  y={y}: x_left={xs.min()}, x_right={xs.max()}, count={len(xs)}")

# Visualize
fig, axes = plt.subplots(1, 2, figsize=(20, 10))
axes[0].imshow(sun_only, cmap='gray_r')
axes[0].set_title('Sun mask')
axes[0].set_xlabel('x'); axes[0].set_ylabel('y')

# Plot the outline
outline_y = []
outline_x_left = []
outline_x_right = []
for y in range(sun_only.shape[0]):
    row = sun_only[y, :]
    xs = np.where(row)[0]
    if len(xs) > 0:
        outline_y.append(y)
        outline_x_left.append(xs.min())
        outline_x_right.append(xs.max())

axes[1].plot(outline_x_left, outline_y, 'b-', label='left edge', linewidth=2)
axes[1].plot(outline_x_right, outline_y, 'r-', label='right edge', linewidth=2)
axes[1].set_xlim(0, 700)
axes[1].set_ylim(700, 0)
axes[1].set_xlabel('x')
axes[1].set_ylabel('y')
axes[1].set_title('Sun edges')
axes[1].legend()
axes[1].grid(True)
axes[1].set_aspect('equal')
plt.savefig('/tmp/sun-edges.png', dpi=100, bbox_inches='tight')
print("\nSaved /tmp/sun-edges.png")
