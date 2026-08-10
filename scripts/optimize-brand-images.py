#!/usr/bin/env python3
"""Optimiza imágenes de marcas para web: resize + compress."""
import os
from PIL import Image

SRC = "/home/z/my-project/public/assets/brands"
TARGET_SIZE = (600, 600)  # max width/height
QUALITY = 78

for fname in sorted(os.listdir(SRC)):
    if not (fname.endswith(".jpg") or fname.endswith(".jpeg") or fname.endswith(".png")):
        continue
    if fname.endswith("_opt.jpg") or fname.endswith("_opt.png"):
        continue
    path = os.path.join(SRC, fname)
    out_path = os.path.join(SRC, f"{os.path.splitext(fname)[0]}_opt.jpg")

    img = Image.open(path)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        # Composite onto white background for JPEG
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail(TARGET_SIZE, Image.LANCZOS)
    img.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    orig_size = os.path.getsize(path)
    new_size = os.path.getsize(out_path)
    print(f"  {fname} ({orig_size//1024}KB) -> {os.path.basename(out_path)} ({new_size//1024}KB) [{img.size[0]}x{img.size[1]}]")

    # Remove original (we use _opt.jpg)
    os.remove(path)

print("\n✅ Optimización completada")
