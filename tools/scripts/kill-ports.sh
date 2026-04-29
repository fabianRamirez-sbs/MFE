#!/usr/bin/env bash
#
# scripts/kill-ports.sh
#
# Libera los puertos TCP usados por el monorepo SipaBanca-MFE.
#
# DESCRIPCIÓN
#   Descubre automáticamente los puertos de cada app leyendo el campo
#   `preview.port` de cada apps/*/vite.config.ts (la misma lógica que
#   usa dev-all.sh), evitando tener los números hardcodeados.
#
#   Para cada puerto ocupado:
#     1. Muestra el PID y el comando del proceso infractor.
#     2. Envía SIGTERM y espera 1 segundo.
#     3. Si el proceso sigue vivo, envía SIGKILL.
#   Al finalizar informa el estado de cada puerto.
#
# CUÁNDO USARLO
#   - Antes de `npm run dev:all` si los puertos quedaron ocupados de una
#     sesión anterior (p. ej. tras un Ctrl+C incompleto).
#   - Para limpiar procesos zombi de vite/node sin tener que buscar PIDs
#     manualmente.
#
# USO
#   bash scripts/kill-ports.sh
#   npm run kill:ports
#
# DEPENDENCIAS
#   - lsof   → descubrir PIDs por puerto  (paquete lsof, disponible en Ubuntu)
#   - ss     → verificar estado final     (paquete iproute2, preinstalado)
#   - /proc  → leer el comando del proceso (Linux only)
#
# SALIDA
#   0  todos los puertos están libres al terminar
#   0  no había procesos que matar
#   0  advertencia: algún puerto sigue ocupado por proceso externo al proyecto
#      (el script no falla porque no es un error del monorepo)

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../" && pwd)"
APPS_DIR="$ROOT_DIR/apps"

# ─── Helper ───────────────────────────────────────────────────────────────────
#
# preview_port_for <dir>
#   Lee el bloque `preview { ... }` del vite.config.ts de <dir> y devuelve
#   el número de puerto configurado. Devuelve cadena vacía si no lo encuentra.

preview_port_for() {
  local config="$1/vite.config.ts"
  [[ -f "$config" ]] || { echo ""; return; }
  grep -A10 'preview' "$config" \
    | grep -oE 'port:[[:space:]]*[0-9]+' \
    | grep -oE '[0-9]+' \
    | head -1
}

# ─── Recolectar puertos ───────────────────────────────────────────────────────
#
# Itera todas las apps que tengan vite.config.ts y acumula sus puertos.
# Las apps sin `preview.port` definido se omiten con una advertencia posterior.

declare -a PORTS=()

for dir in "$APPS_DIR"/*/; do
  [[ -f "${dir}vite.config.ts" ]] || continue
  port=$(preview_port_for "${dir%/}")
  [[ -n "$port" ]] && PORTS+=("$port")
done

if [[ ${#PORTS[@]} -eq 0 ]]; then
  echo "No se encontraron puertos en ningún vite.config.ts bajo apps/"
  exit 0
fi

# lsof acepta puertos separados por coma: lsof -ti:3001,3002,3005
PORTS_CSV=$(IFS=','; echo "${PORTS[*]}")
PORTS_DISPLAY=$(IFS=' '; echo "${PORTS[*]}")

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║    SipaBanca MFE — Liberar puertos del proyecto        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Puertos detectados: $PORTS_DISPLAY"
echo ""

# ─── Matar procesos ───────────────────────────────────────────────────────────

# lsof -t  → solo PIDs, uno por línea
# 2>/dev/null → silencia el error si ningún proceso ocupa los puertos
PIDS=$(lsof -ti:"$PORTS_CSV" 2>/dev/null || true)

if [[ -z "$PIDS" ]]; then
  echo "✓ Ningún proceso ocupa los puertos. Nada que matar."
else
  echo "Procesos encontrados:"
  for pid in $PIDS; do
    # /proc/<pid>/cmdline tiene argumentos separados por NUL; los convertimos
    # a espacios y truncamos a 80 caracteres para que sea legible en consola.
    cmd=$(cat /proc/"$pid"/cmdline 2>/dev/null | tr '\0' ' ' | cut -c1-80 || echo "?")
    echo "  PID $pid → $cmd"
  done
  echo ""

  # Intento 1: SIGTERM (graceful shutdown)
  # SC2086: word splitting intencional para expandir la lista de PIDs
  # shellcheck disable=SC2086
  kill $PIDS 2>/dev/null || true
  sleep 1

  # Intento 2: SIGKILL si algún proceso sigue vivo tras SIGTERM
  STILL_ALIVE=$(lsof -ti:"$PORTS_CSV" 2>/dev/null || true)
  if [[ -n "$STILL_ALIVE" ]]; then
    echo "Forzando SIGKILL a procesos resistentes..."
    # shellcheck disable=SC2086
    kill -9 $STILL_ALIVE 2>/dev/null || true
    sleep 1
  fi

  echo "✓ Procesos terminados."
fi

# ─── Verificación final ───────────────────────────────────────────────────────
#
# Comprueba uno a uno que ningún proceso escuche ya en cada puerto.
# Si un puerto sigue ocupado es probable que sea un proceso del sistema o
# de otra aplicación que no forma parte del monorepo.

echo ""
echo "Estado de los puertos:"
ALL_FREE=1
for port in "${PORTS[@]}"; do
  if ss -tlnp | grep -q ":$port "; then
    echo "  ✗ Puerto $port — OCUPADO"
    ALL_FREE=0
  else
    echo "  ✓ Puerto $port — libre"
  fi
done

echo ""
if [[ $ALL_FREE -eq 1 ]]; then
  echo "Todos los puertos están libres."
else
  echo "ADVERTENCIA: Uno o más puertos siguen ocupados (proceso externo al proyecto)."
fi
echo ""
