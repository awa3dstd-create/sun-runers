#!/usr/bin/env bash
# deploy-gh-pages.sh
# Crea la rama gh-pages con el contenido de pages-deploy/public/
# y la empuja a GitHub para activar GitHub Pages.
#
# Uso:
#   ./scripts/deploy-gh-pages.sh <GITHUB_PAT>
#
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "❌ Uso: $0 <GITHUB_TOKEN>"
  exit 1
fi

TOKEN="$1"
REPO="awa3dstd-create/sun-runers"
REPO_URL="https://${TOKEN}@github.com/${REPO}.git"
DEPLOY_DIR="/home/z/my-project/pages-deploy/public"
WORK_TREE="/tmp/gh-pages-worktree"

echo "=== Deploy a GitHub Pages ==="
echo "Repo:  ${REPO}"
echo "Rama:  gh-pages"
echo "Origen: ${DEPLOY_DIR}"
echo ""

# 1. Limpiar worktree previo si existe
if [ -d "$WORK_TREE" ]; then
  echo "→ Limpiando worktree previo..."
  cd /home/z/my-project
  git worktree remove --force "$WORK_TREE" 2>/dev/null || rm -rf "$WORK_TREE"
fi

# 2. Crear rama gh-pages huérfana (sin historia) en un worktree temporal
echo "→ Creando rama gh-pages huérfana..."
cd /home/z/my-project
git worktree add --detach "$WORK_TREE" 2>/dev/null
cd "$WORK_TREE"
git checkout --orphan gh-pages 2>/dev/null || git checkout gh-pages

# 3. Limpiar todo el contenido del worktree
echo "→ Limpiando contenido previo..."
git rm -rf . 2>/dev/null || true
rm -rf .git/index 2>/dev/null || true

# 4. Copiar el contenido de pages-deploy/public al worktree
echo "→ Copiando ${DEPLOY_DIR} → ${WORK_TREE}/..."
cp -r "${DEPLOY_DIR}/." "${WORK_TREE}/"

# 5. Añadir .nojekyll para que GitHub Pages no procese Jekyll
#    (evita que los archivos que empiezan con _ sean ignorados)
touch "${WORK_TREE}/.nojekyll"

# 6. Crear README explicativo
cat > "${WORK_TREE}/README.md" <<'EOF'
# SUN-RUNERS — GitHub Pages

Este es el sitio estático de **SUN-RUNERS**, empresa cubana de ingeniería eléctrica.

Esta rama (`gh-pages`) se genera automáticamente desde `pages-deploy/public/`
del repositorio principal. No editar directamente.

Para más información, ver la rama `main`.
EOF

# 7. Configurar git
git config user.name "SUN-RUNERS Deploy Bot"
git config user.email "deploy@sun-runers.local"

# 8. Commit y push
echo "→ Haciendo commit..."
git add -A
git commit -m "deploy: GitHub Pages mirror ($(date -u +%Y-%m-%d %H:%M UTC))" \
  --allow-empty

echo "→ Empujando a GitHub (rama gh-pages)..."
git push "$REPO_URL" gh-pages:gh-pages --force

echo ""
echo "✅ Push exitoso a gh-pages"
echo ""

# 9. Limpiar el remote URL del token
echo "→ Limpiando token del remote URL..."
git remote remove deploy-temp 2>/dev/null || true

# 10. Limpiar worktree
cd /home/z/my-project
git worktree remove --force "$WORK_TREE" 2>/dev/null || rm -rf "$WORK_TREE"

echo ""
echo "=== Siguiente paso: activar GitHub Pages via API ==="
echo "El script activar-gh-pages.sh hará esto a continuación."
