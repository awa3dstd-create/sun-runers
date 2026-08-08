#!/usr/bin/env python3
"""Build the complete SUN-RUNERS logo SVG by combining icon + text paths."""
import json

# Load icon paths (v3)
with open('/tmp/icon-paths-v3.json', 'r') as f:
    icon_data = json.load(f)

# Load text paths
with open('/tmp/text-paths.json', 'r') as f:
    text_data = json.load(f)

# Coordinate systems:
# Icon paths are in icon-local coords (0-1108 x, 0-787 y)
# Icon's position in image: x_offset=516, y_offset=494
# Text paths are in text-local coords (0-1530 x, 0-171 y)
# Text's position in image: x_offset=262, y_offset=1429
# Logo total bbox in image: x=[262, 1792], y=[494, 1600]
# So we use viewBox="0 0 1530 1106" and shift everything by (-262, -494)

ICON_X_OFFSET = 516 - 262  # = 254
ICON_Y_OFFSET = 494 - 494  # = 0
TEXT_X_OFFSET = 262 - 262  # = 0
TEXT_Y_OFFSET = 1429 - 494  # = 935

VIEWBOX_W = 1530
VIEWBOX_H = 1106  # 1600 - 494

print(f"ViewBox: 0 0 {VIEWBOX_W} {VIEWBOX_H}")
print(f"Icon offset: ({ICON_X_OFFSET}, {ICON_Y_OFFSET})")
print(f"Text offset: ({TEXT_X_OFFSET}, {TEXT_Y_OFFSET})")

# Build SVG with offset transformations
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEWBOX_W} {VIEWBOX_H}" preserveAspectRatio="xMidYMid meet">
  <g transform="translate({ICON_X_OFFSET},{ICON_Y_OFFSET})">
    <path d="{icon_data['sun_path']}" fill="currentColor" fill-rule="evenodd"/>
'''
for p in icon_data['ray_paths']:
    svg += f'    <path d="{p}" fill="currentColor" fill-rule="evenodd"/>\n'
svg += '  </g>\n'
svg += f'  <g transform="translate({TEXT_X_OFFSET},{TEXT_Y_OFFSET})">\n'
for p in text_data['component_paths']:
    svg += f'    <path d="{p}" fill="currentColor" fill-rule="evenodd"/>\n'
svg += '  </g>\n</svg>'

# Save the logo SVG
logo_path = '/home/z/my-project/public/sun-runers-logo.svg'
with open(logo_path, 'w') as f:
    f.write(svg)
print(f"\nSaved logo to {logo_path}")
print(f"SVG size: {len(svg)} chars")

# Also save a version with explicit white color (for favicon, etc.)
svg_white = svg.replace('currentColor', '#FFFFFF')
with open('/home/z/my-project/public/sun-runers-logo-white.svg', 'w') as f:
    f.write(svg_white)
print("Saved white version")

# Save a black version
svg_black = svg.replace('currentColor', '#000000')
with open('/home/z/my-project/public/sun-runers-logo-black.svg', 'w') as f:
    f.write(svg_black)
print("Saved black version")

# Render preview
from PIL import Image
import cairosvg
# Render on black background (like the original)
svg_black_bg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEWBOX_W} {VIEWBOX_H}" width="{VIEWBOX_W}" height="{VIEWBOX_H}">
  <rect width="{VIEWBOX_W}" height="{VIEWBOX_H}" fill="black"/>
  <g transform="translate({ICON_X_OFFSET},{ICON_Y_OFFSET})">
    <path d="{icon_data['sun_path']}" fill="white" fill-rule="evenodd"/>
'''
for p in icon_data['ray_paths']:
    svg_black_bg += f'    <path d="{p}" fill="white" fill-rule="evenodd"/>\n'
svg_black_bg += '  </g>\n'
svg_black_bg += f'  <g transform="translate({TEXT_X_OFFSET},{TEXT_Y_OFFSET})">\n'
for p in text_data['component_paths']:
    svg_black_bg += f'    <path d="{p}" fill="white" fill-rule="evenodd"/>\n'
svg_black_bg += '  </g>\n</svg>'

with open('/tmp/logo-preview.svg', 'w') as f:
    f.write(svg_black_bg)

cairosvg.svg2png(url="/tmp/logo-preview.svg", write_to="/tmp/logo-preview.png", output_width=VIEWBOX_W, output_height=VIEWBOX_H)
print("Saved /tmp/logo-preview.png")

# Compare with original
orig = Image.open('/home/z/my-project/upload/17861512721bcc.png').convert('RGB')
# Crop original to logo bbox
orig_crop = orig.crop((262, 494, 1792, 1600))
preview = Image.open('/tmp/logo-preview.png').convert('RGB').resize(orig_crop.size, Image.LANCZOS)
combined = Image.new('RGB', (orig_crop.width*2 + 20, orig_crop.height), 'gray')
combined.paste(orig_crop, (0, 0))
combined.paste(preview, (orig_crop.width + 20, 0))
combined.save('/tmp/logo-comparison.png')
print("Saved /tmp/logo-comparison.png")
