import re
import base64
from pathlib import Path

html = Path('/home/z/my-project/pages-deploy/public/index.html').read_text()

hero_start = html.find('id="inicio"')

# Find first <img after hero_start
img_start = html.find('<img', hero_start)
# Find end of img tag
img_end = html.find('>', img_start)
img_tag_raw = html[img_start:img_end+1]

# Replace data URI with placeholder for readability
def shorten(m):
    b64 = m.group(2)
    padded = b64 + '=' * (-len(b64) % 4)
    try:
        size_kb = len(base64.b64decode(padded)) / 1024
        return f'data:{m.group(1)};base64,[{size_kb:.0f}KB]'
    except Exception:
        return f'data:{m.group(1)};base64,[?]'

img_tag_readable = re.sub(r'data:(image/[a-z+]+);base64,([A-Za-z0-9+/]+={0,3})', shorten, img_tag_raw)
print("=== Full img tag ===")
print(img_tag_readable)
print()
print(f"Total img tag length: {len(img_tag_raw)}")
