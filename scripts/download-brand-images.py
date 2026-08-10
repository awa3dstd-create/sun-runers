#!/usr/bin/env python3
"""
download-brand-images.py

Busca y descarga imágenes de las 8 marcas sin foto, secuencialemente
(para evitar rate limit 429 del servicio z-ai image-search).
Optimiza con PIL y guarda en /home/z/my-project/public/assets/brands/.
"""
import json
import subprocess
import time
import sys
import os
import urllib.request
from pathlib import Path
from PIL import Image
import io

OUT_DIR = Path("/home/z/my-project/scripts/brand-search-results")
DOWNLOAD_DIR = Path("/home/z/my-project/public/assets/brands")
FINAL_DIR = Path("/home/z/my-project/pages-deploy/public/assets/brands")

OUT_DIR.mkdir(parents=True, exist_ok=True)
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
FINAL_DIR.mkdir(parents=True, exist_ok=True)

# 8 marcas sin imagen
BRANDS = {
    "sunri":       "Sunri hybrid solar inverter 4kW 48V",
    "sunshine":    "Sunshine solar inverter 5kW 48V off-grid",
    "eco-worthy":  "Eco-Worthy solar inverter battery system",
    "goodwe":      "GoodWe ES G2 hybrid solar inverter",
    "solax":       "SolaX X-Hybrid solar inverter wall mounted",
    "srne":        "SRNE hybrid solar inverter 5kW",
    "easun":       "Easun ISolar SM off-grid solar inverter",
    "huawei":      "Huawei SUN2000 solar string inverter",
}

def search_image(slug: str, query: str) -> dict:
    """Busca imagen con z-ai image-search CLI — captura stdout en vez de usar -o."""
    print(f"  → Buscando '{slug}'...")
    try:
        result = subprocess.run(
            ["z-ai", "image-search", "-q", query, "-c", "3", "--no-rank"],
            capture_output=True, text=True, timeout=180
        )
        if result.returncode != 0:
            print(f"    ❌ Error CLI (exit {result.returncode}): {result.stderr[:200]}")
            return {}
        # El CLI imprime "🚀..." líneas de log y luego el JSON.
        # Extraer solo el JSON (desde la primera '{' hasta el final).
        out = result.stdout
        json_start = out.find('{')
        if json_start == -1:
            print(f"    ❌ No se encontró JSON en output")
            return {}
        json_str = out[json_start:]
        data = json.loads(json_str)
        # Guardar para debug
        outfile = OUT_DIR / f"{slug}.json"
        with open(outfile, 'w') as f:
            json.dump(data, f, indent=2)
        if not data.get("success"):
            print(f"    ❌ API error: {data.get('error', 'unknown')}")
            return {}
        results = data.get("results", [])
        print(f"    ✓ {len(results)} resultados")
        return data
    except subprocess.TimeoutExpired:
        print(f"    ❌ Timeout")
        return {}
    except json.JSONDecodeError as e:
        print(f"    ❌ JSON decode error: {e}")
        return {}
    except Exception as e:
        print(f"    ❌ Excepción: {type(e).__name__}: {e}")
        return {}

def download_and_optimize(url: str, slug: str) -> bool:
    """Descarga la imagen y la optimiza."""
    out_path = DOWNLOAD_DIR / f"{slug}.jpg"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            img_data = resp.read()
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        # Resize a max 600x600 manteniendo aspect ratio
        img.thumbnail((600, 600), Image.LANCZOS)
        # Crear fondo blanco (por si tiene transparencia)
        canvas = Image.new("RGB", img.size, (255, 255, 255))
        # Si la imagen no es cuadrada, centrarla en canvas cuadrado 600x600
        if img.size[0] != 600 or img.size[1] != 600:
            canvas = Image.new("RGB", (600, 600), (255, 255, 255))
            offset = ((600 - img.size[0]) // 2, (600 - img.size[1]) // 2)
            canvas.paste(img, offset)
        else:
            canvas = img
        canvas.save(out_path, "JPEG", quality=78, progressive=True, optimize=True)
        # Copiar también a pages-deploy
        import shutil
        shutil.copy2(out_path, FINAL_DIR / f"{slug}.jpg")
        size_kb = out_path.stat().st_size // 1024
        print(f"    ✓ Guardado {out_path.name} ({size_kb} KB)")
        return True
    except Exception as e:
        print(f"    ❌ Error descargando: {e}")
        return False

def main():
    print("=== Búsqueda y descarga de imágenes de marcas ===")
    print(f"Total marcas a procesar: {len(BRANDS)}")
    print()

    success_count = 0
    failed = []

    for slug, query in BRANDS.items():
        print(f"[{slug}]")
        data = search_image(slug, query)
        if not data or not data.get("results"):
            failed.append(slug)
            print(f"  ⚠️  Sin resultados para {slug}")
            time.sleep(3)  # Pausa para evitar rate limit
            continue

        # Intentar descargar la primera imagen que funcione
        downloaded = False
        for i, result in enumerate(data["results"]):
            url = result.get("original_url")
            if not url:
                continue
            print(f"  → Probando imagen {i+1}: {url[:80]}...")
            if download_and_optimize(url, slug):
                downloaded = True
                success_count += 1
                break

        if not downloaded:
            failed.append(slug)
            print(f"  ⚠️  Ninguna imagen pudo ser descargada para {slug}")

        # Pausa entre marcas para evitar rate limit
        time.sleep(5)

    print()
    print("=" * 50)
    print(f"RESUMEN:")
    print(f"  ✓ Descargadas: {success_count}/{len(BRANDS)}")
    if failed:
        print(f"  ❌ Fallidas:   {', '.join(failed)}")
    print("=" * 50)

    return 0 if not failed else 1

if __name__ == "__main__":
    sys.exit(main())
