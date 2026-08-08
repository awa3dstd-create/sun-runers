#!/usr/bin/env python3
"""Crop and save different parts of the sun for visual inspection."""
from PIL import Image

img = Image.open("/home/z/my-project/upload/17861512721bcc.png")
# Icon region: x=[516,1623], y=[494,1280]
# Sun bbox (in image coords): x=[516, 516+647=1163], y=[494, 494+654=1148]
# Save different parts at high zoom

# 1. The whole icon
img.crop((516, 494, 1623, 1280)).save("/tmp/icon-full.png")

# 2. The sun (whole)
img.crop((516, 494, 1163, 1148)).save("/tmp/sun-full.png")

# 3. Upper-right of sun (where the "notch" might be)
img.crop((900, 494, 1163, 800)).save("/tmp/sun-upper-right.png")

# 4. Bottom of sun (where the cut meets the lower-left arc)
img.crop((516, 950, 1163, 1148)).save("/tmp/sun-bottom.png")

# 5. Apex (top) of sun
img.crop((800, 494, 1000, 700)).save("/tmp/sun-apex.png")

# 6. Left side of sun
img.crop((516, 700, 800, 1148)).save("/tmp/sun-left.png")

# 7. Make a 4x enlarged version of the sun for detailed inspection
sun = img.crop((516, 494, 1163, 1148))
sun_4x = sun.resize((sun.width*2, sun.height*2), Image.NEAREST)
sun_4x.save("/tmp/sun-2x.png")

# Save the whole logo scaled to 1024 for inspection
img.resize((1024, 1024)).save("/tmp/logo-1024.png")
print("Saved crops to /tmp/")
