#!/bin/bash
# Genera imágenes para el sitio web, secuencialmente con pausas para evitar rate limiting

set -e

ASSETS=/home/z/my-project/public/assets
PORTFOLIO=$ASSETS/portfolio

mkdir -p "$PORTFOLIO"

generate() {
  local prompt="$1"
  local output="$2"
  local size="${3:-1344x768}"
  
  if [ -f "$output" ]; then
    echo "SKIP (exists): $output"
    return 0
  fi
  
  echo "Generating: $output"
  for attempt in 1 2 3; do
    if z-ai image -p "$prompt" -o "$output" -s "$size" 2>&1; then
      echo "OK: $output"
      sleep 8
      return 0
    fi
    echo "Attempt $attempt failed, waiting 15s..."
    sleep 15
  done
  echo "FAILED: $output"
  return 1
}

# Hero image (using 1344x768 because 1440x720 fails validation)
generate "Architectural photograph of modern rooftop solar photovoltaic panels installed on a minimalist concrete house at golden hour sunset, clean composition, warm amber light, professional architectural photography, ultra pro minimalist aesthetic, no people, no text, no watermark" \
  "$ASSETS/hero.jpg" "1344x768"

# Portfolio 1: Rooftop solar
generate "Professional photograph of residential rooftop solar panel installation in Caribbean setting, photovoltaic modules on tile roof, blue sky, clean minimalist composition, architectural photography, no people, no text, no watermark" \
  "$PORTFOLIO/p1.jpg" "1344x768"

# Portfolio 2: Battery backup
generate "Professional photograph of lithium battery backup system installation, LiFePO4 battery bank mounted on clean white wall, modern minimalist, organized cabling, professional installation, no people, no text, no watermark" \
  "$PORTFOLIO/p2.jpg" "1344x768"

# Portfolio 3: Hybrid inverter
generate "Professional photograph of hybrid solar inverter installation on wall, modern minimalist equipment, clean organized wiring, contemporary residential setting, architectural photography, no people, no text, no watermark" \
  "$PORTFOLIO/p3.jpg" "1344x768"

# Portfolio 4: Water pumping
generate "Professional photograph of solar water pumping system installation in rural setting, photovoltaic panels next to water pump equipment, clean minimalist composition, no people, no text, no watermark" \
  "$PORTFOLIO/p4.jpg" "1344x768"

# Portfolio 5: Climate / AC
generate "Professional photograph of modern split air conditioning system installation on minimalist wall, clean architectural setting, inverter technology, professional installation, no people, no text, no watermark" \
  "$PORTFOLIO/p5.jpg" "1344x768"

# Portfolio 6: Electrical panel
generate "Professional photograph of modern residential electrical panel installation, organized circuit breakers, clean minimalist wiring, professional workmanship, contemporary setting, no people, no text, no watermark" \
  "$PORTFOLIO/p6.jpg" "1344x768"

echo "=== Final inventory ==="
ls -la "$ASSETS"
ls -la "$PORTFOLIO"
