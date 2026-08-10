#!/usr/bin/env bash
# search-brand-images.sh
# Busca imágenes reales de las 8 marcas que aún no tienen foto en la sección Tecnologías.
# Usa z-ai image-search en paralelo.
set -uo pipefail

OUT_DIR="/home/z/my-project/scripts/brand-search-results"
mkdir -p "$OUT_DIR"

# 8 marcas sin imagen (deben coincidir con site-data.ts)
declare -A QUERIES=(
  ["sunri"]="Sunri hybrid solar inverter 4kW 48V"
  ["sunshine"]="Sunshine solar inverter 5kW 48V off-grid"
  ["eco-worthy"]="Eco-Worthy Cubix100 48V solar battery inverter"
  ["goodwe"]="GoodWe ES G2 hybrid solar inverter"
  ["solax"]="SolaX X-Hybrid solar inverter"
  ["srne"]="SRNE HESP hybrid solar inverter 5kW"
  ["easun"]="Easun ISolar SM off-grid solar inverter"
  ["huawei"]="Huawei SUN2000 solar string inverter"
)

# Función para buscar una marca
search_brand() {
  local slug="$1"
  local query="${QUERIES[$slug]}"
  local outfile="${OUT_DIR}/${slug}.json"
  echo "  → ${slug}..."
  z-ai image-search -q "$query" -c 3 --no-rank -o "$outfile" 2>&1 | tail -2
  echo "    ✓ ${slug} done"
}

# Exportar la función para que parallel pueda usarla
export -f search_brand
export OUT_DIR QUERIES

echo "=== Búsqueda paralela de imágenes de marcas ==="
echo ""

# Lanzar todas las búsquedas en paralelo (background)
for slug in "${!QUERIES[@]}"; do
  search_brand "$slug" &
done

# Esperar a que terminen todas
wait

echo ""
echo "=== Resultados ==="
for slug in "${!QUERIES[@]}"; do
  outfile="${OUT_DIR}/${slug}.json"
  if [ -f "$outfile" ]; then
    count=$(python3 -c "import json; d=json.load(open('$outfile')); print(len(d.get('results',[])) if d.get('success') else 0)")
    echo "  ${slug}: ${count} imágenes"
  else
    echo "  ${slug}: ❌ no hay archivo"
  fi
done
