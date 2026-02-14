#!/usr/bin/env bash
set -e

echo "Setting Railway environment variables..."

# Read .env.production.example and set each variable
while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.* ]] && continue
  [[ -z "$line" ]] && continue
  # Skip placeholders
  [[ "$line" =~ your_ ]] && continue
  [[ "$line" =~ ^NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXX$ ]] && continue
  [[ "$line" =~ ^CLOUDFLARE_ZONE_ID=your_zone_id_here$ ]] && continue
  [[ "$line" =~ ^NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX$ ]] && continue

  # Set variable
  echo "Setting: $line"
  railway variables set "$line"
done < /Users/adam/Desktop/Projects/Baby/.env.production.example

echo "✅ All variables set."