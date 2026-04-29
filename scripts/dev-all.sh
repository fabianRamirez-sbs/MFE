#!/usr/bin/env bash
#
# scripts/dev-all.sh
#
# Compila y sirve dinámicamente TODAS las apps en apps/ que tengan vite.config.ts.
#
# Convenciones que lee de cada app:
#   .nvmrc          → versión de Node (si difiere de la raíz, se cambia con nvm use)
#   vite.config.ts  → busca preview: { port: XXXX }
#
# Orden de arranque:
#   1. Compilar todos los MFEs remotos (no-shell) — secuencial para no mezclar logs
#   2. Compilar el Shell (depende de los remoteEntry.js ya generados)
#   3. Iniciar todos los servidores de preview con concurrently

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS_DIR="$ROOT_DIR/apps"
NVM_SCRIPT="$HOME/.nvm/nvm.sh"
ROOT_NODE_VER="$(tr -d '[:space:]' < "$ROOT_DIR/.nvmrc")"

# ─── Cargar NVM ───────────────────────────────────────────────────────────────
# shellcheck source=/dev/null
[[ -s "$NVM_SCRIPT" ]] && source "$NVM_SCRIPT"

# ─── Helpers ─────────────────────────────────────────────────────────────────

node_version_for() {
  local dir="$1"
  if [[ -f "$dir/.nvmrc" ]]; then
    tr -d '[:space:]' < "$dir/.nvmrc"
  else
    echo "$ROOT_NODE_VER"
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

# Cambia a la versión de Node correcta y compila la app
build_app() {
  local dir="$1"
  local name="$2"
  local node_ver="$3"

  echo ""
  echo "  ▶ Compilando $name  (Node $node_ver)..."

  (
    cd "$dir"
    if [[ "$node_ver" != "$ROOT_NODE_VER" ]]; then
      # Usar el binario npx de la versión nvm instalada directamente
      NVM_NODE_BIN="$HOME/.nvm/versions/node/v${node_ver}/bin"
      if [[ ! -x "$NVM_NODE_BIN/npx" ]]; then
        echo "    Instalando Node $node_ver via nvm..."
        [[ -s "$NVM_SCRIPT" ]] && source "$NVM_SCRIPT"
        nvm install "$node_ver" --silent 2>/dev/null
      fi
      "$NVM_NODE_BIN/npx" vite build --mode development
    else
      npx vite build --mode development
    fi
  )

  if [[ $? -eq 0 ]]; then
    echo "  ✓ $name compilado"
  else
    echo "  ✗ $name FALLÓ — abortando"
    exit 1
  fi
}

# ─── Descubrir apps ──────────────────────────────────────────────────────────

SHELL_DIR=""
declare -a REMOTE_DIRS=()

for dir in "$APPS_DIR"/*/; do
  dir="${dir%/}"
  [[ -f "$dir/vite.config.ts" ]] || continue
  name=$(basename "$dir")
  if [[ "$name" == "shell" ]]; then
    SHELL_DIR="$dir"
  else
    REMOTE_DIRS+=("$dir")
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
  echo "  • $name  (Node $node_ver, puerto ${port:-sin puerto configurado})"
done
echo "  • shell   (Node $(node_version_for "$SHELL_DIR"), puerto $(preview_port_for "$SHELL_DIR"))  ← host"
echo ""

# ─── Fase 1: compilar remotos ────────────────────────────────────────────────
echo "══════════════════════════════════════════════════════════"
echo " Fase 1/2 — Compilando MFEs remotos..."
echo "══════════════════════════════════════════════════════════"

for dir in "${REMOTE_DIRS[@]}"; do
  name=$(basename "$dir")
  node_ver=$(node_version_for "$dir")
  build_app "$dir" "$name" "$node_ver" || exit 1
done

# ─── Fase 2: compilar shell ──────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo " Fase 2/2 — Compilando Shell..."
echo "══════════════════════════════════════════════════════════"

nvm use "$ROOT_NODE_VER" --silent 2>/dev/null || true
build_app "$SHELL_DIR" "shell" "$ROOT_NODE_VER" || exit 1

# ─── Fase 3: iniciar servidores con concurrently ─────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo " Iniciando servidores de preview..."
echo "══════════════════════════════════════════════════════════"

declare -a CMDS=()
declare -a NAMES=()
COLORS=("cyan" "magenta" "yellow" "blue" "white" "green")
COLOR_IDX=0

for dir in "${REMOTE_DIRS[@]}"; do
  name=$(basename "$dir")
  port=$(preview_port_for "$dir")
  node_ver=$(node_version_for "$dir")

  if [[ -z "$port" ]]; then
    echo "  ⚠  Saltando preview de '$name' — sin 'port' en vite.config.ts"
    continue
  fi

  echo "  • $name → http://localhost:$port"

  if [[ "$node_ver" != "$ROOT_NODE_VER" ]]; then
    # Nodo distinto: usar el binario npx directamente desde la instalación nvm
    NVM_NODE_BIN="$HOME/.nvm/versions/node/v${node_ver}/bin"
    CMDS+=("cd \"$dir\" && \"$NVM_NODE_BIN/npx\" vite preview --port $port --host")
  else
    CMDS+=("cd \"$dir\" && npx vite preview --port $port --host")
  fi
  NAMES+=("$name")
  ((COLOR_IDX++)) || true
done

# Shell siempre al final
shell_port=$(preview_port_for "$SHELL_DIR")
echo "  • shell → http://localhost:$shell_port  ← abrir en el navegador"
CMDS+=("cd \"$SHELL_DIR\" && npx vite preview --port $shell_port --host")
NAMES+=("shell")

echo ""

# Construir strings CSV para concurrently
NAMES_CSV=$(IFS=','; echo "${NAMES[*]}")
COLOR_CSV=""
for ((i = 0; i < ${#NAMES[@]}; i++)); do
  [[ -n "$COLOR_CSV" ]] && COLOR_CSV+=","
  COLOR_CSV+="${COLORS[$((i % ${#COLORS[@]}))]}"
done

# Cargar nvm en contexto actual (para que concurrently lo herede)
[[ -s "$NVM_SCRIPT" ]] && source "$NVM_SCRIPT"
nvm use "$ROOT_NODE_VER" --silent 2>/dev/null || true

exec npx concurrently \
  --names "$NAMES_CSV" \
  --prefix-colors "$COLOR_CSV" \
  --kill-others \
  "${CMDS[@]}"


ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS_DIR="$ROOT_DIR/apps"
NVM_SCRIPT="$HOME/.nvm/nvm.sh"

# ─── Cargar NVM ───────────────────────────────────────────────────────────────
# shellcheck source=/dev/null
if [[ -s "$NVM_SCRIPT" ]]; then
  source "$NVM_SCRIPT"
else
  echo "ERROR: NVM no encontrado en $NVM_SCRIPT"
  echo "  Instalar NVM: https://github.com/nvm-sh/nvm"
  exit 1
fi

# ─── Helpers ─────────────────────────────────────────────────────────────────

# Devuelve la versión de Node de una app (su .nvmrc o el de la raíz)
node_version_for() {
  local dir="$1"
  if [[ -f "$dir/.nvmrc" ]]; then
    tr -d '[:space:]' < "$dir/.nvmrc"
  else
    tr -d '[:space:]' < "$ROOT_DIR/.nvmrc"
  fi
}

# Extrae el puerto de preview del vite.config.ts de una app
preview_port_for() {
  local config="$1/vite.config.ts"
  [[ -f "$config" ]] || { echo ""; return; }
  # Busca el bloque preview: { ... port: XXXX }
  grep -A10 'preview' "$config" \
    | grep -oE 'port:[[:space:]]*[0-9]+' \
    | grep -oE '[0-9]+' \
    | head -1
}

# Compila una app con la versión de Node correcta
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
  # Saltar directorios sin vite.config.ts
  [[ -f "$dir/vite.config.ts" ]] || continue

  name=$(basename "$dir")

  if [[ "$name" == "shell" ]]; then
    SHELL_DIR="${dir%/}"   # quitar trailing slash
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
  echo "  • $name  (Node $node_ver, puerto ${port:-?})"
done
node_ver=$(node_version_for "$SHELL_DIR")
port=$(preview_port_for "$SHELL_DIR")
echo "  • shell   (Node $node_ver, puerto ${port:-?})  ← host"
echo ""

# ─── Fase 1: compilar remotos en paralelo ────────────────────────────────────
echo "══════════════════════════════════════════════════════════"
echo " Fase 1/2 — Compilando MFEs remotos (en paralelo)..."
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

# ─── Fase 2: compilar shell ──────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo " Fase 2/2 — Compilando Shell..."
echo "══════════════════════════════════════════════════════════"

shell_node=$(node_version_for "$SHELL_DIR")
build_app "$SHELL_DIR" "shell" "$shell_node" "development"

# ─── Fase 3: iniciar todos con concurrently ──────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo " Iniciando servidores de preview..."
echo "══════════════════════════════════════════════════════════"

declare -a CMDS=()
declare -a NAMES=()
COLORS=("cyan" "magenta" "yellow" "blue" "white")
COLOR_IDX=0

for dir in "${REMOTE_DIRS[@]}"; do
  name=$(basename "$dir")
  port=$(preview_port_for "$dir")
  node_ver=$(node_version_for "$dir")

  if [[ -z "$port" ]]; then
    echo "  ⚠  Saltando preview de '$name' — no se encontró 'port' en vite.config.ts"
    continue
  fi

  echo "  • $name → http://localhost:$port"
  CMDS+=("cd \"$dir\" && source \"$NVM_SCRIPT\" && nvm use $node_ver --silent && npx vite preview --port $port --host")
  NAMES+=("$name")
  ((COLOR_IDX++)) || true
done

# Shell siempre al final
shell_port=$(preview_port_for "$SHELL_DIR")
echo "  • shell  → http://localhost:$shell_port  ← abrir en el navegador"
CMDS+=("cd \"$SHELL_DIR\" && source \"$NVM_SCRIPT\" && nvm use $shell_node --silent && npx vite preview --port $shell_port --host")
NAMES+=("shell")

echo ""
NAMES_CSV=$(
  IFS=','
  echo "${NAMES[*]}"
)

# Construir string de colores (tomar los primeros N colores)
COLOR_CSV=""
for ((i = 0; i < ${#NAMES[@]}; i++)); do
  [[ -n "$COLOR_CSV" ]] && COLOR_CSV+=","
  COLOR_CSV+="${COLORS[$i % ${#COLORS[@]}]}"
done

# Ejecutar
exec npx concurrently \
  --names "$NAMES_CSV" \
  --prefix-colors "$COLOR_CSV" \
  --kill-others \
  "${CMDS[@]}"
