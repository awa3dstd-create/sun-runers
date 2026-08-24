# Sync Pages Production — 2026-08-24

## Deploy exitoso a Cloudflare Pages

**Deployment ID:** 465b1c0f  
**URL de producción:** https://sun-runers.pages.dev  
**Tamaño HTML:** 215,569 bytes  
**Patches incluidos:** mobile CSS + JS + multi-equipo widget

## Problemas resueltos

1. Scroll se sube solo en móvil → JS intercepta window.scrollTo espurios
2. Animación intro no aparece → JS fuerza hide después de 4s + al primer interaction
3. Lentitud móvil → CSS desactiva backdrop-filter, magnetic, tilt, aurora, will-change
4. Cotizador limitado → Widget multi-equipo: 4 categorías, N equipos por categoría

## Archivos

- `pages-deploy/public/index.html` — HTML parcheado con CSS+JS inline (215KB)
- `pages-deploy/public/_next/static/chunks/*.js` — JS chunks de Next.js
- `pages-deploy/public/_next/static/chunks/*.css` — CSS compilado
- `pages-deploy/public/_next/static/media/*.woff2` — Fonts Geist
- `scripts/mobile-patch.css` — CSS con reglas mobile-only
- `scripts/mobile-patch.js` — JS con interceptores + widget multi-equipo
- `scripts/inject-patches.py` — Inyecta patches en HTML
