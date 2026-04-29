#!/usr/bin/env bash
#
# scripts/dev-all.sh
#
# Arranca el entorno de desarrollo completo del monorepo:
#
#   1. Compila los MFEs remotos con --mode development (en paralelo)
#   2. Inicia el Shell con el dev server de Vite → lee .env.development
#      en tiempo real; mock de auth activo, sin compilación previa.
#   3. Inicia los MFEs compilados con vite preview
#
# Por qué el Shell usa dev server y no build+preview:
#   - vite preview sirve artefactos ya compilados; si el último build fue
#     de producción, las variables de Keycloak real quedan incrustadas.
#   - vite dev lee los .env en tiempo real → VITE_AUTH_MOCK_ENABLED=true
#     siempre funciona en desarrollo local.

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"
APPS_DIR="$ROOT_DIR/apps"
NVM_SCRIPT="$HOME/.nvm/nvm.sh"

# ─── Cargar NVM ───────────────────────────────────────────────────────────────
if [[ -s "$NVM_SCRIPT" ]]; then
  # shellcheck source=/dev/null
  source "$NVM_SCRIPT"
else
  echo "ERROR: NVM no encontrado en $NVM_SCRIPT"
  echo "  Instalar NVM: https://github.com/nvm-sh/nvm"
  exit 1
fi

ROOT_NODE_VER="$(tr -d '[:space:]' < "$ROOT_DIR/.nvmrc")"

# ─── Helpers ─────────────────────────────────────────────────────────────────

node_version_for() {
  local dir="$1"
  if [[ -f "$dir/.nvmrc" ]]; then
    tr -d '[:space:]' < "$dir/.nvmrc"
  else
    tr -d '[:space:]' < "$ROOT_DIR/.nvmrc"
  fi
}

preview_port_for() {
  local config="$1/vite.config.ts"
  [[ -f "$config" ]] || { echo ""; return; }
  grep -A10 'preview' "$config" \
    | grep -oE 'port:[[:space:]]*[0-9]+' \
    | grep -oE '[0-9]+' \
    | head -1
}

build_app() {
  local dir="$1"
  local name="$2"
  local node_ver="$3"
  local mode="${4:-development}"

  (
    cd "$dir"
    nvm install "$node_ver" --no-progress 2>/dev/null || true
    nvm use "$node_ver" --silent
    npx vite build --mode "$mode" 2>&1 | sed "s/^/  [$name] /"
  )
  local exit_code=$?
  if [[ $exit_code -eq 0 ]]; then
    echo "  ✓ [$name] compilado"
  else
    echo "  ✗ [$name] FALLÓ (código $exit_code)"
    return $exit_code
  fi
}

# ─── Descubrir apps ──────────────────────────────────────────────────────────

SHELL_DIR=""
declare -a REMOTE_DIRS=()

for dir in "$APPS_DIR"/*/; do
  [[ -f "$dir/vite.config.ts" ]] || continue
  name=$(basename "$dir")
  if [[ "$name" == "shell" ]]; then
    SHELL_DIR="${dir%/}"
  else
    REMOTE_DIRS+=("${dir%/}")
  fi
done

if [[ -z "$SHELL_DIR" ]]; then
  echo "ERROR: No se encontró apps/shell/ con vite.config.ts"
  exit 1
fi

# ─── Banner ──────────────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║    SipaBanca MFE — Entorno de desarrollo completo      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Apps detectadas:"
for dir in "${REMOTE_DIRS[@]}"; do
  name=$(basename "$dir")
  port=$(preview_port_for "$dir")
  node_ver=$(node_version_for "$dir")
  echo "  • $name  (Node $node_ver, preview puerto ${port:-?})"
done
shell_port=$(preview_port_for "$SHELL_DIR")
shell_node=$(node_version_for "$SHELL_DIR")
echo "  • shell   (Node $shell_node, dev server puerto ${shell_port:-?})  ← host"
echo ""

# ─── Fase 1: compilar MFEs remotos en paralelo ───────────────────────────────
echo "══════════════════════════════════════════════════════════"
echo " Fase 1/1 — Compilando MFEs remotos (en paralelo)..."
echo "══════════════════════════════════════════════════════════"

BUILD_PIDS=()
BUILD_NAMES=()

for dir in "${REMOTE_DIRS[@]}"; do
  name=$(basename "$dir")
  node_ver=$(node_version_for "$dir")
  build_app "$dir" "$name" "$node_ver" "development" &
  BUILD_PIDS+=($!)
  BUILD_NAMES+=("$name")
done

FAILED=0
for i in "${!BUILD_PIDS[@]}"; do
  if ! wait "${BUILD_PIDS[$i]}"; then
    echo "  ✗ ${BUILD_NAMES[$i]} falló al compilar"
    FAILED=1
  fi
done

if [[ $FAILED -ne 0 ]]; then
  echo ""
  echo "ERROR: Uno o más MFEs remotos no compilaron. Abortando."
  exit 1
fi

# ─── Iniciar servidores ───────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo " Iniciando servidores..."
echo "══════════════════════════════════════════════════════════"

declare -a CMDS=()
declare -a NAMES=()
COLORS=("cyan" "magenta" "yellow" "blue" "white")

for dir in "${REMOTE_DIRS[@]}"; do
  name=$(basename "$dir")
  port=$(preview_port_for "$dir")
  node_ver=$(node_version_for "$dir")

  if [[ -z "$port" ]]; then
    echo "  ⚠  Saltando '$name' — no se encontró 'port' en vite.config.ts"
    continue
  fi

  echo "  • $name → http://localhost:$port  [preview]"
  CMDS+=("cd \"$dir\" && . \"$NVM_SCRIPT\" && nvm use $node_ver --silent && npx vite preview --port $port --host")
  NAMES+=("$name")
done

# Shell: dev server — lee .env.development en tiempo real
echo "  • shell → http://localhost:$shell_port  [dev server]  ← abrir en el navegador"
CMDS+=("cd \"$SHELL_DIR\" && . \"$NVM_SCRIPT\" && nvm use $shell_node --silent && npx vite --port $shell_port --host")
NAMES+=("shell")

echo ""

NAMES_CSV=$(IFS=','; echo "${NAMES[*]}")
COLOR_CSV=""
for ((i = 0; i < ${#NAMES[@]}; i++)); do
  [[ -n "$COLOR_CSV" ]] && COLOR_CSV+=","
  COLOR_CSV+="${COLORS[$i % ${#COLORS[@]}]}"
done

exec npx concurrently \
  --names "$NAMES_CSV" \
  --prefix-colors "$COLOR_CSV" \
  --kill-others \
  "${CMDS[@]}"
