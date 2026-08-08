import re
import base64
from pathlib import Path

html = Path('/home/z/my-project/pages-deploy/public/index.html').read_text()

hero_start = html.find('id="inicio"')
hero_chunk = html[hero_start:hero_start+3000]

def replace_data(m):
    try:
        decoded = base64.b64decode(m.group(2) + '===')  # pad
        size_kb = len(decoded) / 1024
        return f'[DATA_URI:{size_kb:.0f}kb]'
    except Exception:
        return '[DATA_URI:?]'

hero_chunk = re.sub(r'data:(image/[a-z+]+);base64,([A-Za-z0-9+/=]+)', replace_data, hero_chunk)
print(hero_chunk)
