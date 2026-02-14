#!/usr/bin/env bash
set -e

ENV_FILE="/Users/adam/Desktop/Projects/Baby/.env.production.example"

echo "📦 Setting Railway variables (skip deploys)..."

while IFS= read -r line; do
  [[ "$line" =~ ^#.* ]] && continue
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXX$ ]] && continue
  [[ "$line" =~ ^CLOUDFLARE_ZONE_ID=your_zone_id_here$ ]] && continue
  [[ "$line" =~ ^NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX$ ]] && continue

  railway variables set "$line" --service web --skip-deploys
  echo "✓ $line"
done < "$ENV_FILE"

echo ""
echo "✅ Variables set. Now run: railway up"