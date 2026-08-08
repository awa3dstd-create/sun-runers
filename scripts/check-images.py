import re
import base64
from pathlib import Path

html = Path('/home/z/my-project/pages-deploy/public/index.html').read_text()

# Find all data:image URIs and their byte size
pattern = re.compile(r'data:image/([a-z+]+);base64,([A-Za-z0-9+/=]+)')
matches = pattern.findall(html)

print(f"Total embebidas: {len(matches)}")
for i, (fmt, b64) in enumerate(matches, 1):
    decoded = base64.b64decode(b64)
    size_kb = len(decoded) / 1024
    print(f"  #{i}: {fmt:10s} {size_kb:7.1f} KB")

# Find context (150 chars before each match)
print("\n--- Contexto de cada imagen ---")
positions = [m.start() for m in re.finditer(r'data:image/', html)]
for i, pos in enumerate(positions, 1):
    start = max(0, pos - 200)
    end = min(len(html), pos + 50)
    context = html[start:end]
    # Clean up: collapse whitespace, remove other data URIs
    context = re.sub(r'data:image/[^"]+', '[IMG]', context)
    context = re.sub(r'\s+', ' ', context)
    print(f"\n#{i}: ...{context[-200:]}...")
