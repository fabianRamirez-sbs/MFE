#!/usr/bin/env bash
# tools/scripts/check-federation.sh
# Verifica que todos los remoteEntry.js estén accesibles antes del build del Shell

set -euo pipefail

REMOTES=(
  "http://localhost:3001/assets/remoteEntry.js"
  "http://localhost:3002/assets/remoteEntry.js"
  "http://localhost:3003/assets/remoteEntry.js"
  "http://localhost:3004/assets/remoteEntry.js"
)

echo "🔍 Verificando accesibilidad de remoteEntry.js..."

for url in "${REMOTES[@]}"; do
  status=$(curl -o /dev/null -s -w "%{http_code}" "$url" || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "  ✅ $url"
  else
    echo "  ❌ $url — HTTP $status"
    exit 1
  fi
done

echo "✅ Todos los remotes están disponibles."
