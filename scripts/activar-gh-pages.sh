#!/usr/bin/env bash
# activar-gh-pages.sh
# Activa GitHub Pages en el repo usando la API de GitHub
# para servir desde la rama gh-pages.
#
# Uso:
#   ./scripts/activar-gh-pages.sh <GITHUB_PAT>
#
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "❌ Uso: $0 <GITHUB_TOKEN>"
  exit 1
fi

TOKEN="$1"
REPO="awa3dstd-create/sun-runers"
API="https://api.github.com/repos/${REPO}/pages"

echo "=== Activar GitHub Pages via API ==="
echo "Repo: ${REPO}"
echo "URL API: ${API}"
echo ""

# 1. Verificar si ya está activado
echo "→ Verificando estado actual de GitHub Pages..."
STATUS=$(curl -sS -o /tmp/pages-status.json -w "%{http_code}" \
  -H "Authorization: token ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "${API}")

if [ "$STATUS" = "200" ]; then
  echo "ℹ️  GitHub Pages ya está configurado. Estado actual:"
  cat /tmp/pages-status.json | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f\"  - Source: {d.get('source', {}).get('branch', '?')} / {d.get('source', {}).get('path', '?')}\")
print(f\"  - URL: {d.get('html_url', '?')}\")
print(f\"  - Status: {d.get('status', '?')}\")
"
  echo ""
  echo "→ Actualizando configuración para usar rama gh-pages..."
  METHOD="PUT"
else
  echo "ℹ️  GitHub Pages no está activado todavía. Creando..."
  METHOD="POST"
fi

# 2. Activar/actualizar GitHub Pages para servir desde gh-pages /
echo "→ Configurando source: branch=gh-pages, path=/ ..."
RESULT=$(curl -sS -w "\n%{http_code}" \
  -X "$METHOD" \
  -H "Authorization: token ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "${API}" \
  -d '{"source":{"branch":"gh-pages","path":"/"}}')

HTTP_CODE=$(echo "$RESULT" | tail -1)
BODY=$(echo "$RESULT" | sed '$d')

echo "→ HTTP ${HTTP_CODE}"
echo ""

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "202" ]; then
  echo "✅ GitHub Pages activado correctamente"
  echo ""
  echo "$BODY" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'  🌐 URL pública:  {d.get(\"html_url\", \"?\")}')
print(f'  📂 Source:       {d.get(\"source\", {}).get(\"branch\", \"?\")} / {d.get(\"source\", {}).get(\"path\", \"?\")}')
print(f'  ⏳ Status:       {d.get(\"status\", \"?\")}')
"
  echo ""
  echo "ℹ️  El primer deploy tarda 1-2 minutos en propagarse."
  echo "ℹ️  Puedes ver el progreso en:"
  echo "    https://github.com/${REPO}/settings/pages"
else
  echo "❌ Error al activar GitHub Pages:"
  echo "$BODY" | head -20
  exit 1
fi
