#!/usr/bin/env python3
"""
inject-failover.py

Inyecta un script de auto-failover en el <head> de un HTML.
El script solo se ejecuta si el HTML se está sirviendo desde github.io.
Intenta cargar pages.dev; si responde rápido, redirige allí.
Si no responde, se queda en github.io (que ya cargó).

Uso:
    python3 scripts/inject-failover.py <html_file>
"""
import sys
import re

# Script JS que se inyecta
FAILOVER_JS = """(function(){
// Auto-failover: solo corre en github.io
// Si pages.dev responde rápido, redirige allí (CDN más rápido)
// Si no, se queda en github.io (más confiable desde Cuba)
if(location.hostname.indexOf('github.io')===-1)return;
var PAGES_DEV='https://sun-runers.pages.dev/';
var WORKER='https://sun-runers.dashiellyeneri.workers.dev/';
var MAX_WAIT=2000;
var st=performance.now();
var done=false;
function tryMirror(url){
  var c=new AbortController();
  var t=setTimeout(function(){c.abort()},MAX_WAIT);
  fetch(url,{mode:'no-cors',signal:c.signal,cache:'no-store'})
  .then(function(){
    clearTimeout(t);
    var el=performance.now()-st;
    if(!done&&el<MAX_WAIT){
      done=true;
      window.location.replace(url);
    }
  })
  .catch(function(){clearTimeout(t)});
}
// Probar pages.dev primero (CDN más rápido)
tryMirror(PAGES_DEV);
// Si pages.dev no responde en 1s, probar worker como backup
setTimeout(function(){if(!done)tryMirror(WORKER)},1000);
})();"""

SCRIPT_TAG = '<script>' + FAILOVER_JS + '</script>'


def inject(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Verificar si ya tiene el script (idempotente)
    if 'Auto-failover' in html:
        print(f"  ℹ️  {html_path} ya tiene failover JS, saltando")
        return

    # Insertar el script justo después de <head>
    # El HTML tiene: <!DOCTYPE html><html lang="es"><head><meta charSet="utf-8"/>...
    pattern = r'(<head>)'
    replacement = r'\1' + SCRIPT_TAG

    new_html, count = re.subn(pattern, replacement, html, count=1)

    if count == 0:
        print(f"  ❌ No se encontró <head> en {html_path}")
        sys.exit(1)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)

    print(f"  ✅ Failover JS inyectado en {html_path}")
    print(f"     Tamaño antes: {len(html):,} bytes")
    print(f"     Tamaño después: {len(new_html):,} bytes")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 inject-failover.py <html_file>")
        sys.exit(1)
    inject(sys.argv[1])
