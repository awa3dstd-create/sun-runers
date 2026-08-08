#!/usr/bin/env python3
"""
Construye un HTML standalone autocontenido del sitio SUN-RUNERS.

Toma el HTML renderizado por Next.js, inline el CSS, y embebe las
imágenes como data URIs para que el archivo se pueda abrir directamente
en cualquier navegador sin necesidad de servidor.
"""

import base64
import re
import sys
from pathlib import Path

SRC_HTML = Path("/tmp/sun-runers-preview.html")
SRC_CSS = Path("/tmp/sun-runers.css")
PUBLIC_DIR = Path("/home/z/my-project/public")
OUT_FILE = Path("/home/z/my-project/pages-deploy/public/index.html")


def encode_image_data_uri(path: Path) -> str:
    """Convierte un archivo de imagen a data URI base64."""
    ext = path.suffix.lower().lstrip(".")
    mime_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "svg": "image/svg+xml",
        "webp": "image/webp",
        "gif": "image/gif",
    }
    mime = mime_map.get(ext, "application/octet-stream")
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:{mime};base64,{b64}"


def main():
    html = SRC_HTML.read_text(encoding="utf-8")
    css = SRC_CSS.read_text(encoding="utf-8")

    # 1. Reemplazar el <link rel="stylesheet" href="/_next/...css">
    #    con un <style> inline.
    html = re.sub(
        r'<link rel="stylesheet" href="/_next/[^"]+\.css"[^>]*/?>',
        f"<style>\n{css}\n</style>",
        html,
    )

    # 2. Eliminar los <link rel="preload" as="script"> y los <script src="/_next/...">
    #    porque el preview es estático (no necesitamos React hydration).
    html = re.sub(
        r'<link rel="preload"[^>]*as="script"[^>]*/?>',
        "",
        html,
    )
    html = re.sub(
        r'<script[^>]*src="/_next/[^"]*"[^>]*>\s*</script>',
        "",
        html,
    )
    # Eliminar cualquier otro script inline de Next que pueda romper el preview
    html = re.sub(
        r'<script[^>]*>self\.__next_f\.push[^<]*</script>',
        "",
        html,
    )
    html = re.sub(
        r'<script[^>]*>\s*\$RC[^<]*</script>',
        "",
        html,
    )

    # 3. Reemplazar las rutas /assets/... y /favicon.svg con data URIs.
    #    Preservamos el atributo (src= o href=) y solo cambiamos el valor.
    def replace_asset(match):
        attr = match.group(1)  # 'src' o 'href'
        relative_path = match.group(2).lstrip("/")
        asset_path = PUBLIC_DIR / relative_path
        if asset_path.exists():
            return f'{attr}="{encode_image_data_uri(asset_path)}"'
        return match.group(0)

    # src="/assets/..." y href="/favicon.svg"
    html = re.sub(
        r'(src|href)="(/(?:assets|favicon\.svg|sun-runers-logo[^"]*\.svg|logo\.svg)[^"]*)"',
        replace_asset,
        html,
    )

    # url(/assets/...) en CSS ya inlineado
    html = re.sub(
        r'url\((/(?:assets|favicon\.svg|sun-runers-logo[^)]*\.svg|logo\.svg)[^)]*)\)',
        lambda m: f'url({encode_image_data_uri(PUBLIC_DIR / m.group(1).lstrip("/"))})'
        if (PUBLIC_DIR / m.group(1).lstrip("/")).exists()
        else m.group(0),
        html,
    )

    # 4. Reemplazar las URLs de fuentes de Next (../media/...) — las eliminamos
    #    porque no las tenemos; el CSS ya tiene fallback a system-ui.
    #    Esto evita errores 404 al abrir el archivo.
    #    Las @font-face con src: url("../media/...") se quedan pero el navegador
    #    hace fallback a system-ui. Para limpiarlas del todo:
    css_clean = re.sub(
        r'@font-face\s*\{[^}]*url\("\.\./media/[^"]*"\)[^}]*\}',
        '/* font-face removed for standalone preview */',
        css,
        flags=re.DOTALL,
    )
    html = html.replace(css, css_clean, 1)

    # 5. Asegurarse de que el IntroAnimation NO aparezca en el preview
    #    (es client-side y no se renderiza en SSR). Lo agregamos como CSS puro
    #    al final del body para que se vea la animación.
    intro_html = """
<!-- IntroAnimation (CSS-only fallback para preview estático) -->
<div class="intro-overlay" aria-hidden="true" style="animation: intro-bg-in 0.6s ease-out both, intro-overlay-out 0.6s ease-in 2.4s both;">
  <div class="intro-logo" style="animation: intro-logo-out 0.6s ease-in 2.4s both;">
    <svg viewBox="0 0 1108 787" fill="none" xmlns="http://www.w3.org/2000/svg" class="intro-icon" style="width: clamp(80px, 14vw, 180px); height: auto; animation: intro-icon-scale 1.0s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;">
      <g fill="#FFFFFF">
        <path d="M 200.00,654.50 L 172.00,640.50 L 148.00,624.50 L 128.00,608.50 L 99.50,581.00 L 78.50,557.00 L 55.50,525.00 L 34.50,488.00 L 23.50,464.00 L 11.50,429.00 L 4.50,401.00 L -0.50,360.00 L -0.50,323.00 L 5.50,273.00 L 14.50,237.00 L 24.50,209.00 L 37.50,181.00 L 54.50,152.00 L 70.50,130.00 L 101.50,95.00 L 129.00,70.50 L 148.00,56.50 L 168.00,43.50 L 200.00,27.50 L 231.00,15.50 L 264.00,6.50 L 287.00,2.50 L 319.00,-0.50 L 352.00,-0.50 L 388.00,3.50 L 420.00,10.50 L 456.00,22.50 L 486.00,36.50 L 517.00,55.50 L 547.00,78.50 L 581.50,113.00 L 597.50,133.00 L 620.50,168.00 L 637.50,203.00 L 646.50,226.00 L 647.50,232.00 L 581.00,232.50 L 482.50,339.00 L 200.00,654.50 Z" fill-rule="evenodd"/>
        <path d="M 271.00,786.50 L 128.00,786.50 L 139.50,772.00 L 396.50,487.00 L 591.00,267.50 L 729.00,267.50 L 726.50,272.00 L 582.50,436.00 L 514.50,511.00 L 271.00,786.50 Z" fill-rule="evenodd"/>
        <path d="M 468.00,786.50 L 320.00,786.50 L 335.50,767.00 L 645.50,417.00 L 775.00,267.50 L 916.00,267.50 L 909.50,277.00 L 468.00,786.50 Z" fill-rule="evenodd"/>
        <path d="M 676.00,786.50 L 517.00,786.50 L 520.50,781.00 L 964.00,267.50 L 1107.00,267.50 L 1086.50,294.00 L 1038.50,350.00 L 987.50,413.00 L 676.00,786.50 Z" fill-rule="evenodd"/>
      </g>
    </svg>
    <span class="intro-wordmark" style="font-family: system-ui, sans-serif; font-weight: 700; font-size: clamp(1rem, 2.2vw, 1.75rem); letter-spacing: 0.18em; text-transform: uppercase; color: #FFFFFF; animation: intro-text-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both;">SUN-RUNERS</span>
  </div>
</div>
<script>
  // Ocultar el intro después de 3 segundos
  (function() {
    var intro = document.querySelector('.intro-overlay');
    if (intro) {
      setTimeout(function() {
        intro.style.display = 'none';
      }, 3100);
    }
  })();
</script>
"""
    # Insertar el intro al inicio del body
    html = re.sub(
        r'(<body[^>]*>)',
        r'\1' + intro_html,
        html,
        count=1,
    )

    # 6. Sin banner de preview — el HTML standalone ahora es producción real
    #    (eliminado el banner que decía "PREVIEW ESTÁTICO")

    # 6b. Header scroll behavior — como eliminamos los scripts de Next.js,
    #     la lógica de scroll del Header no funciona. La reemplazamos con
    #     CSS + JS mínimo: toggle de la clase `header-scrolled` y reglas CSS
    #     que sobreescriben los colores para máximo contraste sobre cualquier
    #     sección (clara u oscura).
    header_css_js = """
<style>
  /* Header scrolled state — fondo sólido para contraste garantizado */
  header.fixed.header-scrolled {
    background-color: var(--background) !important;
    border-color: var(--border) !important;
    color: var(--foreground) !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06) !important;
  }
  /* Nav links en estado scrolled */
  header.fixed.header-scrolled nav a {
    color: var(--muted-foreground) !important;
  }
  header.fixed.header-scrolled nav a:hover {
    color: var(--foreground) !important;
  }
  /* Botón "Solicitar cotización" en estado scrolled */
  header.fixed.header-scrolled button[class*="rounded-full"][class*="bg-background"] {
    background-color: var(--foreground) !important;
    color: var(--background) !important;
  }
  header.fixed.header-scrolled button[class*="rounded-full"][class*="bg-background"]:hover {
    background-color: var(--foreground) !important;
    opacity: 0.9;
  }
  /* Botón hamburguesa móvil — hereda color del header */
  header.fixed.header-scrolled button[aria-label="Abrir menú"],
  header.fixed.header-scrolled button[aria-label="Cerrar menú"] {
    color: var(--foreground) !important;
  }
</style>
<script>
  // Toggle clase header-scrolled según scroll position
  (function() {
    var header = document.querySelector('header.fixed');
    if (!header) return;
    function updateHeader() {
      if (window.scrollY > 8) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  })();
</script>
"""
    html = re.sub(
        r'(</body>)',
        header_css_js + r'\1',
        html,
        count=1,
    )

    # 7. Forzar que el body tenga scroll normal (a veces Next inlinea overflow:hidden)
    html = re.sub(
        r'</head>',
        '<style>html,body{overflow:auto !important;}</style></head>',
        html,
        count=1,
    )

    # 8. Escribir el archivo final
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(html, encoding="utf-8")

    size_kb = OUT_FILE.stat().st_size / 1024
    print(f"✅ Standalone HTML generado: {OUT_FILE}")
    print(f"   Tamaño: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
