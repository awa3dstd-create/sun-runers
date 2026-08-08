import re
import base64
from pathlib import Path

html = Path('/home/z/my-project/pages-deploy/public/index.html').read_text()

# Find hero section
hero_start = html.find('id="inicio"')

# Find first data:image after hero_start
data_pos = html.find('data:image/', hero_start)
# Look at the surrounding structure
context_start = max(0, data_pos - 200)
# Find the end of the data URI
end = data_pos
while end < len(html) and html[end] != '"' and html[end] != "'":
    end += 1

print("=== Context before image ===")
print(html[context_start:data_pos])
print()
print("=== Image attribute (first 100 chars) ===")
print(html[data_pos:data_pos+100])
print()
print("=== Image data length ===")
print(f"{end - data_pos} chars")
print()
# Try to extract the actual b64
b64_data = html[data_pos:end]
m = re.match(r'data:image/([a-z+]+);base64,(.+)', b64_data)
if m:
    fmt = m.group(1)
    b64 = m.group(2)
    print(f"Format: {fmt}")
    print(f"Base64 length: {len(b64)}")
    # Decode (auto-pad)
    padded = b64 + '=' * (-len(b64) % 4)
    try:
        decoded = base64.b64decode(padded)
        print(f"Decoded size: {len(decoded)} bytes ({len(decoded)/1024:.1f} KB)")
        # Save it
        Path('/home/z/my-project/scripts/extracted-hero.jpg').write_bytes(decoded)
        print("Saved to /home/z/my-project/scripts/extracted-hero.jpg")
    except Exception as e:
        print(f"Decode error: {e}")
