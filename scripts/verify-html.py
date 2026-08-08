import re
import base64
from pathlib import Path

html = Path('/home/z/my-project/pages-deploy/public/index.html').read_text()

# Find all img tags and verify src= is present
img_tags = re.findall(r'<img[^>]*>', html)
print(f"Total <img> tags: {len(img_tags)}")

for i, tag in enumerate(img_tags, 1):
    # Shorten data URIs for display
    def shorten(m):
        b64 = m.group(2)
        padded = b64 + '=' * (-len(b64) % 4)
        try:
            size_kb = len(base64.b64decode(padded)) / 1024
            return f'data:{m.group(1)};base64,[{size_kb:.0f}KB]'
        except Exception:
            return f'data:{m.group(1)};base64,[?]'
    short = re.sub(r'data:(image/[a-z+]+);base64,([A-Za-z0-9+/]+={0,3})', shorten, tag)
    if len(short) > 200:
        short = short[:100] + "..." + short[-100:]
    print(f"  #{i}: {short}")

# Check for broken pattern <img "data: (missing src=)
broken = re.findall(r'<img\s+"data:', html)
print(f"\nBroken <img \"data: (missing src=): {len(broken)}")

# Check banner removed
banner = "PREVIEW ESTÁTICO" in html
print(f"Banner 'PREVIEW ESTÁTICO' present: {banner}")
