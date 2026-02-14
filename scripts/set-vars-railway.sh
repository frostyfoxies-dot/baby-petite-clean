#!/usr/bin/env bash
set -e

ENV_FILE="/Users/adam/Desktop/Projects/Baby/.env.production.example"

echo "📦 Setting Railway environment variables for service 'web'..."

while IFS= read -r line; do
  # Skip comments, empty lines, and placeholder lines
  [[ "$line" =~ ^#.* ]] && continue
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXX$ ]] && continue
  [[ "$line" =~ ^CLOUDFLARE_ZONE_ID=your_zone_id_here$ ]] && continue
  [[ "$line" =~ ^NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX$ ]] && continue

  # Set variable
  railway variables set "$line" --service web
  echo "✓ Set: $line"
done < "$ENV_FILE"

echo ""
echo "✅ All variables configured."
echo ""
echo "Next: run './scripts/deploy.sh' or:"
echo "  railway up"