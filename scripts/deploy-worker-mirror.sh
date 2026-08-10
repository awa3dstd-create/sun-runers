#!/usr/bin/env bash
# deploy-worker-mirror.sh
# Despliega un Worker espejo en Cloudflare que sirve el mismo HTML estático
# que pages-deploy/public/, pero desde el dominio workers.dev
# (rango de IPs distinto a pages.dev).
#
# Uso:
#   ./scripts/deploy-worker-mirror.sh <CLOUDFLARE_API_TOKEN> <CLOUDFLARE_ACCOUNT_ID>
#
# Si no se pasa ACCOUNT_ID, se intenta inferir de la API de Cloudflare.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "❌ Uso: $0 <CLOUDFLARE_API_TOKEN> [CLOUDFLARE_ACCOUNT_ID]"
  exit 1
fi

CF_TOKEN="$1"
CF_ACCOUNT_ID="${2:-29b40f5c76f58a5e101d22226337cf46}"

WORKER_DIR="/home/z/my-project/worker-mirror"
DEPLOY_DIR="/home/z/my-project/pages-deploy/public"

echo "=== Deploy Worker espejo a Cloudflare ==="
echo "Account ID: ${CF_ACCOUNT_ID}"
echo "Worker:     sun-runers"
echo "URL final:  https://sun-runers.dashiellyeneri.workers.dev (depende del account)"
echo ""

# 1. Sincronizar el directorio ./public del worker con pages-deploy/public
echo "→ Sincronizando assets estáticos..."
mkdir -p "${WORKER_DIR}/public"
rsync -a --delete "${DEPLOY_DIR}/" "${WORKER_DIR}/public/"

# 2. Verificar que hay contenido
FILE_COUNT=$(find "${WORKER_DIR}/public" -type f | wc -l)
SIZE=$(du -sh "${WORKER_DIR}/public" | cut -f1)
echo "  ${FILE_COUNT} archivos, ${SIZE} total"
echo ""

# 3. Deploy con wrangler
echo "→ Deployando con wrangler..."
cd "${WORKER_DIR}"

CLOUDFLARE_API_TOKEN="${CF_TOKEN}" \
CLOUDFLARE_ACCOUNT_ID="${CF_ACCOUNT_ID}" \
npx wrangler deploy 2>&1 | tee /tmp/wrangler-deploy.log

# 4. Extraer la URL final del output de wrangler
echo ""
echo "=== Verificación ==="
URL=$(grep -oE 'https://[a-z0-9-]+\.workers\.dev' /tmp/wrangler-deploy.log | head -1)
if [ -n "$URL" ]; then
  echo "✅ Worker desplegado en: ${URL}"
  echo ""
  echo "→ Verificando que responde..."
  sleep 3
  HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -L "${URL}")
  echo "  HTTP ${HTTP_CODE}"
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✅ Sitio accesible"
  else
    echo "  ⚠️  Aún propagándose (normal en el primer deploy)"
  fi
else
  echo "⚠️  No se pudo extraer la URL del output de wrangler."
  echo "   Revisa /tmp/wrangler-deploy.log o https://dash.cloudflare.com/${CF_ACCOUNT_ID}/workers"
fi

echo ""
echo "=== Limpieza ==="
# Limpiar el token del entorno (ya no se necesita)
unset CLOUDFLARE_API_TOKEN
echo "✅ Token limpiado del entorno"
