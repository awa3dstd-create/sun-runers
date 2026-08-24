#!/usr/bin/env python3
"""
SUN-RUNERS — Inyectar mobile patches en HTML compilado
y deployar al Worker sun-runers via Cloudflare API
"""

import re
import json
import sys
from pathlib import Path

LIVE_DIR = Path('/home/z/my-project/live-analysis')
PATCH_CSS = Path('/home/z/my-project/scripts/mobile-patch.css')
PATCH_JS = Path('/home/z/my-project/scripts/mobile-patch.js')
OUTPUT_HTML = LIVE_DIR / 'patched.html'

def inject_patches():
    print('=' * 60)
    print(' SUN-RUNERS — Inyectando mobile patches en HTML')
    print('=' * 60)

    # Leer HTML original
    html = (LIVE_DIR / 'current.html').read_text(encoding='utf-8')
    print(f'\n1. HTML original: {len(html):,} bytes')

    # Leer patches
    css_patch = PATCH_CSS.read_text(encoding='utf-8')
    js_patch = PATCH_JS.read_text(encoding='utf-8')
    print(f'   CSS patch: {len(css_patch):,} bytes')
    print(f'   JS patch:  {len(js_patch):,} bytes')

    # Inyectar CSS en el <head> justo antes de </head>
    css_block = f'<style id="sun-runers-mobile-patch">{css_patch}</style>'
    if '</head>' in html:
        html = html.replace('</head>', f'{css_block}\n</head>', 1)
        print('\n2. CSS inyectado en <head> ✓')
    else:
        print('\n2. ERROR: No se encontró </head>')
        return False

    # Inyectar JS antes de </body>
    js_block = f'<script id="sun-runers-mobile-js">{js_patch}</script>'
    if '</body>' in html:
        html = html.replace('</body>', f'{js_block}\n</body>', 1)
        print('3. JS inyectado antes de </body> ✓')
    else:
        # Buscar último </html> o añadir al final
        html += js_block
        print('3. JS añadido al final del HTML (no se encontró </body>)')

    # Guardar HTML parcheado
    OUTPUT_HTML.write_text(html, encoding='utf-8')
    print(f'\n4. HTML parcheado guardado: {OUTPUT_HTML}')
    print(f'   Tamaño final: {len(html):,} bytes')

    # Verificar que los patches están presentes
    if 'sun-runers-mobile-patch' in html and 'sun-runers-mobile-js' in html:
        print('\n5. Verificación: ✓ ambos patches presentes')
        return True
    else:
        print('\n5. ERROR: Patches no encontrados en HTML final')
        return False

if __name__ == '__main__':
    success = inject_patches()
    sys.exit(0 if success else 1)
