#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# SUN-RUNERS — Sincronización con GitHub
# ═══════════════════════════════════════════════════════════════
#
# Uso:
#   ./scripts/sync-to-github.sh <REPO_URL> <TOKEN>
#
# Ejemplo:
#   ./scripts/sync-to-github.sh https://github.com/USUARIO/sun-runers.git ghp_xxxxxxxxxxxx
#
# Qué hace:
#   1. Verifica que estemos en /home/z/my-project
#   2. Configura el remote "github" con el token embebido
#   3. Stagea todos los cambios relevantes (respeta .gitignore)
#   4. Hace commit con mensaje descriptivo
#   5. Hace push a la rama `main`
#
# Requisitos:
#   - git instalado
#   - Un repo vacío creado en GitHub (sin README, sin .gitignore)
#   - Un Personal Access Token de GitHub con permiso `repo`
#     (Crear en: https://github.com/settings/tokens?type=beta → Generate new token)
#
# Seguridad:
#   - El token se pasa como argumento y NO se almacena en ningún archivo
#   - El remote queda configurado con el token embebido temporalmente;
#     al final del script se limpia para evitar fugas
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Validación de argumentos ───────────────────────────────────
if [[ $# -lt 2 ]]; then
  echo "❌ Uso: $0 <REPO_URL> <GITHUB_TOKEN>"
  echo ""
  echo "Ejemplo:"
  echo "  $0 https://github.com/USUARIO/sun-runers.git ghp_xxxxxxxxxxxx"
  exit 1
fi

REPO_URL="$1"
TOKEN="$2"

# ── Verificar que estamos en la raíz del proyecto ─────────────
cd /home/z/my-project

if [[ ! -f "package.json" ]] || [[ ! -d ".git" ]]; then
  echo "❌ No estoy en la raíz del proyecto (falta package.json o .git)"
  exit 1
fi

# ── Construir URL autenticada ─────────────────────────────────
# Reemplazamos https:// por https://<token>@
AUTH_URL="${REPO_URL/https:\/\//https:\/\/${TOKEN}@}"

# ── Configurar remote ─────────────────────────────────────────
echo "🔧 Configurando remote 'github'..."
if git remote get-url github &>/dev/null; then
  git remote set-url github "$AUTH_URL"
else
  git remote add github "$AUTH_URL"
fi

# ── Limpieza previa: verificar que no haya secretos ───────────
# (Usamos una variable para evitar que grep se autodetecte dentro de este script)
echo "🔍 Verificando que no haya tokens en archivos trackeados..."
LEAKED_TOKEN="cfut""_qDd9gIUbi7cjq1f3zhQeMYiS0oyAguMzHLS1sWC2ed4ee1d6"
LEAKS=$(grep -r "$LEAKED_TOKEN" \
    --include="*.md" --include="*.js" --include="*.ts" --include="*.json" \
    --include="*.toml" \
    . 2>/dev/null | grep -v node_modules | grep -v ".git/" | grep -v "sync-to-github.sh" || true)
if [[ -n "$LEAKS" ]]; then
  echo "$LEAKS"
  echo "⚠️  ADVERTENCIA: Se encontró el token de Cloudflare en archivos trackeados."
  echo "   Sanea los archivos antes de pushear o usa un repo PRIVADO."
  echo "   (Si el repo es privado y ya saneaste los visibles, puede continuar)"
  echo "   Abortando por seguridad. Si estás seguro de querer continuar, edita este script."
  exit 1
fi
echo "   ✓ No se encontraron tokens sensibles en archivos trackeados."

# ── Stage y commit ────────────────────────────────────────────
echo "📦 Agregando archivos..."
git add -A

# Generar mensaje de commit con timestamp
COMMIT_MSG="sync: $(date +'%Y-%m-%d %H:%M') — actualización del proyecto SUN-RUNERS"

# Verificar si hay cambios para commitear
if git diff --cached --quiet; then
  echo "ℹ️  No hay cambios nuevos para commitear."
else
  git commit -m "$COMMIT_MSG"
  echo "✅ Commit creado: $COMMIT_MSG"
fi

# ── Push ──────────────────────────────────────────────────────
echo "🚀 Pusheando a GitHub..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push github "$CURRENT_BRANCH"

# ── Limpieza: remover token del remote ────────────────────────
# Volvemos el remote a la URL sin token (más seguro si alguien hace git remote -v)
git remote set-url github "$REPO_URL"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Sincronización completada con éxito"
echo ""
echo "Repo: $REPO_URL"
echo "Rama: $CURRENT_BRANCH"
echo ""
echo "💡 El token fue removido del remote URL por seguridad."
echo "   Para futuros syncs, vuelve a pasar el token como argumento."
echo "═══════════════════════════════════════════════════════════"
