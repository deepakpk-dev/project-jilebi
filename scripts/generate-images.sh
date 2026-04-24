#!/usr/bin/env bash
# Image generation script — kie.ai Nano Banana 2
# Run: bash scripts/generate-images.sh
# Do not commit this script with API key filled in.

set -euo pipefail

API_KEY="${KIE_API_KEY}"
BASE_URL="https://api.kie.ai/api/v1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

create_task() {
  local prompt="$1"
  local aspect_ratio="$2"
  local response
  response=$(curl -s -X POST "${BASE_URL}/jobs/createTask" \
    -H "Authorization: Bearer ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"nano-banana-2\",
      \"input\": {
        \"prompt\": \"${prompt}\",
        \"aspect_ratio\": \"${aspect_ratio}\",
        \"resolution\": \"2K\",
        \"output_format\": \"jpg\"
      }
    }")
  echo "$response" | grep -o '"taskId":"[^"]*"' | head -1 | cut -d'"' -f4
}

poll_task() {
  local task_id="$1"
  local max_attempts=60
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    local response
    response=$(curl -s "${BASE_URL}/jobs/recordInfo?taskId=${task_id}" \
      -H "Authorization: Bearer ${API_KEY}")
    local state
    state=$(echo "$response" | grep -o '"state":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$state" = "success" ]; then
      echo "$response" | grep -o '"resultUrls":\["[^"]*"' | head -1 | cut -d'"' -f4
      return 0
    elif [ "$state" = "fail" ]; then
      echo "ERROR: Task $task_id failed" >&2
      return 1
    fi
    sleep 5
    attempt=$((attempt + 1))
  done
  echo "ERROR: Task $task_id timed out" >&2
  return 1
}

generate_image() {
  local prompt="$1"
  local aspect_ratio="$2"
  local output_path="$3"
  echo "→ Generating: $(basename "$output_path")"
  local task_id
  task_id=$(create_task "$prompt" "$aspect_ratio")
  if [ -z "$task_id" ]; then
    echo "  ERROR: Failed to create task" >&2
    return 1
  fi
  echo "  Task ID: $task_id (polling...)"
  local image_url
  image_url=$(poll_task "$task_id")
  if [ -z "$image_url" ]; then
    echo "  ERROR: No image URL returned" >&2
    return 1
  fi
  curl -s -L "$image_url" -o "${PROJECT_ROOT}/${output_path}"
  echo "  ✓ Saved to ${output_path}"
}

echo "Starting image generation for Jilebi restaurant website..."
echo ""

generate_image \
  "Close-up of freshly made jalebi, spiral golden Indian sweet pastry glistening with syrup, elegant dark background, warm amber and gold tones, professional restaurant food photography, shallow depth of field, bokeh" \
  "16:9" \
  "public/hero.jpg"

generate_image \
  "Cozy elegant Indian restaurant interior, warm golden ambient lighting, wooden tables with white linens, soft evening atmosphere, welcoming dining room, subtle Indian decorative elements, inviting and intimate" \
  "4:3" \
  "public/about.jpg"

generate_image \
  "Authentic butter chicken curry in a dark copper bowl, creamy rich orange-red sauce, garnished with swirl of cream and fresh coriander leaves, warm natural side lighting, rustic wooden table background, professional food photography" \
  "4:3" \
  "public/gallery/butter-chicken.jpg"

generate_image \
  "Elegant Indian restaurant dining area, warm golden pendant lights, tasteful decor with subtle Indian motifs, comfortable upholstered chairs, evening ambiance, welcoming and sophisticated atmosphere" \
  "4:3" \
  "public/gallery/interior-1.jpg"

generate_image \
  "Traditional clay tandoor oven in a restaurant kitchen, glowing orange hot coals visible inside the cylindrical oven, naan bread being cooked on the interior walls, dramatic warm light, professional kitchen photography" \
  "4:3" \
  "public/gallery/tandoor.jpg"

generate_image \
  "Traditional Indian thali on a round stainless steel plate, multiple small bowls filled with colorful curries, rice, dal, raita, papadum, and naan, vibrant and abundant presentation, overhead flat-lay shot, warm natural lighting" \
  "1:1" \
  "public/gallery/thali.jpg"

generate_image \
  "Gulab jamun Indian dessert, three golden-brown soft milk dumplings floating in rose-flavored syrup in an elegant ceramic bowl, garnished with crushed pistachios, warm amber tones, close-up food photography" \
  "4:3" \
  "public/gallery/dessert.jpg"

generate_image \
  "Indian restaurant table setting for two, elegant white ceramic plates, gold cutlery, soft candlelight, subtle floral centerpiece, warm intimate atmosphere, shallow depth of field, fine dining" \
  "4:3" \
  "public/gallery/interior-2.jpg"

echo ""
echo "All images generated successfully!"
