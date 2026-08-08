import re
import base64
from pathlib import Path

html = Path('/home/z/my-project/pages-deploy/public/index.html').read_text()

hero_start = html.find('id="inicio"')
hero_chunk = html[hero_start:hero_start+2500]

# Match data URI including the full attribute that contains it
# The img tag has the data URI inside a string attribute, let's see the structure
# Show first 2500 chars with data URIs shortened
def shorten(m):
    b64 = m.group(2)
    # Pad to multiple of 4
    padded = b64 + '=' * (-len(b64) % 4)
    try:
        size_kb = len(base64.b64decode(padded)) / 1024
        return f'data:{m.group(1)};base64,[{size_kb:.0f}kb]'
    except Exception:
        return f'data:{m.group(1)};base64,[?]'

hero_chunk = re.sub(r'data:(image/[a-z+]+);base64,([A-Za-z0-9+/]+={0,3})', shorten, hero_chunk)
print(hero_chunk)
