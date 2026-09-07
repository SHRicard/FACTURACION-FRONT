#!/usr/bin/env bash
#
# run.sh — levanta la app con todo lo necesario.
#
#   ./run.sh              → Android en el celular conectado por USB (dev client)
#   ./run.sh android      → idem
#   ./run.sh web          → dev server web en el navegador
#   ./run.sh ios          → iOS (solo macOS)
#   ./run.sh start        → solo Metro, sin compilar ni instalar nada
#   ./run.sh clean        → prebuild --clean + rebuild nativo desde cero
#   ./run.sh doctor       → diagnostico del entorno, no levanta nada
#
# Flags:
#   --clear-cache   arranca Metro con la cache de transformacion vacia
#
# OJO: esta app NO corre en Expo Go. Usa MMKV, nitro-modules, reanimated y
# gesture-handler, que son codigo nativo y no estan en el binario de Expo Go.
# Hay que usar el development build que genera este script.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$RAIZ"

PUERTO_METRO=8081
PAQUETE_ANDROID="com.anonymous.FACTURACIONFRONT"

rojo()  { printf '\033[0;31m%s\033[0m\n' "$*"; }
verde() { printf '\033[0;32m%s\033[0m\n' "$*"; }
amar()  { printf '\033[0;33m%s\033[0m\n' "$*"; }
gris()  { printf '\033[0;90m%s\033[0m\n' "$*"; }
titulo(){ printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }

morir() { rojo "✗ $*"; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# Entorno
# ─────────────────────────────────────────────────────────────────────────────

adb_bin() {
  if command -v adb >/dev/null 2>&1; then command -v adb; return; fi
  for base in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "$HOME/Android/Sdk" "$HOME/Library/Android/sdk"; do
    [ -n "$base" ] && [ -x "$base/platform-tools/adb" ] && { echo "$base/platform-tools/adb"; return; }
  done
  return 1
}

verificar_base() {
  command -v node >/dev/null 2>&1 || morir "No hay Node instalado."
  [ -f package.json ] || morir "No estoy en la raiz del proyecto (falta package.json)."

  if [ ! -d node_modules ]; then
    titulo "Instalando dependencias (no existe node_modules)"
    npm install
  fi

  if [ ! -f .env ]; then
    amar "! No existe .env — lo copio de .env.example"
    cp .env.example .env
  fi
}

verificar_android() {
  local sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"
  [ -d "$sdk" ] || morir "No encuentro el SDK de Android. Exporta ANDROID_HOME."
  export ANDROID_HOME="$sdk"
  export PATH="$sdk/platform-tools:$sdk/emulator:$PATH"

  ADB="$(adb_bin)" || morir "No encuentro adb. Instala platform-tools en el SDK."

  command -v java >/dev/null 2>&1 || morir "No hay JDK instalado (hace falta Java 17)."
  local jver
  jver="$(java -version 2>&1 | head -1 | grep -oE '[0-9]+' | head -1)"
  [ "$jver" -ge 17 ] 2>/dev/null || amar "! Java $jver detectado; Expo SDK 57 espera 17 o mas."
}

# ─────────────────────────────────────────────────────────────────────────────
# Dispositivo
# ─────────────────────────────────────────────────────────────────────────────

dispositivos_conectados() {
  "$ADB" devices | awk 'NR>1 && $2=="device" {print $1}'
}

esperar_dispositivo() {
  titulo "Buscando dispositivo Android"
  "$ADB" start-server >/dev/null 2>&1 || true

  if [ -z "$(dispositivos_conectados)" ]; then
    amar "No hay ningun dispositivo listo. Revisa:"
    gris "  · el cable conectado y el modo 'Transferencia de archivos'"
    gris "  · Opciones de desarrollador → Depuracion por USB activada"
    gris "  · el dialogo 'Permitir depuracion USB' aceptado en la pantalla del celu"
    "$ADB" devices -l | sed 's/^/  /'
    printf '  esperando'
    for _ in $(seq 1 30); do
      [ -n "$(dispositivos_conectados)" ] && break
      printf '.'; sleep 2
    done
    printf '\n'
  fi

  local devs; devs="$(dispositivos_conectados)"
  [ -n "$devs" ] || morir "Sigo sin ver un dispositivo autorizado (adb devices vacio)."

  local n; n="$(printf '%s\n' "$devs" | wc -l | tr -d ' ')"
  if [ "$n" -gt 1 ]; then
    amar "! Hay $n dispositivos; uso el primero. Los demas: exporta ANDROID_SERIAL."
  fi
  SERIAL="$(printf '%s\n' "$devs" | head -1)"
  local modelo
  modelo="$("$ADB" -s "$SERIAL" shell getprop ro.product.model 2>/dev/null | tr -d '\r')"
  verde "✓ Dispositivo: $SERIAL ($modelo)"
}

avisar_expo_go() {
  if "$ADB" -s "$SERIAL" shell pm list packages 2>/dev/null | grep -q host.exp.exponent; then
    amar "! Tenes Expo Go instalado en el celu."
    gris "  Esta app NO corre ahi (MMKV / nitro / reanimated son nativos)."
    gris "  Abri siempre '${PAQUETE_ANDROID}', el development build que instala este script."
  fi
}

# Puentea los puertos del host al celu por USB. Sin esto el celu tiene que
# alcanzar la IP de la PC por wifi, y con 'localhost' en el .env no llega nunca.
tender_puentes() {
  titulo "Tendiendo puentes USB (adb reverse)"
  "$ADB" -s "$SERIAL" reverse "tcp:$PUERTO_METRO" "tcp:$PUERTO_METRO" >/dev/null
  verde "✓ localhost:$PUERTO_METRO (Metro)"

  # El puerto de la API sale del .env: si apunta a localhost hay que puentearlo
  # igual que Metro, o los fetch del celu se van a su propio loopback.
  local url puerto
  url="$(grep -E '^EXPO_PUBLIC_API_BASE_URL=' .env 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  if printf '%s' "$url" | grep -qE '^https?://(localhost|127\.0\.0\.1)'; then
    puerto="$(printf '%s' "$url" | sed -E 's#^https?://[^:/]+:?([0-9]*).*#\1#')"
    puerto="${puerto:-80}"
    "$ADB" -s "$SERIAL" reverse "tcp:$puerto" "tcp:$puerto" >/dev/null
    verde "✓ localhost:$puerto (API — $url)"
  else
    gris "  API en $url (no es localhost, no necesita puente)"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Metro
# ─────────────────────────────────────────────────────────────────────────────

liberar_metro() {
  local pid
  pid="$(lsof -ti "tcp:$PUERTO_METRO" -sTCP:LISTEN 2>/dev/null | head -1 || true)"
  [ -n "$pid" ] || return 0

  amar "! El puerto $PUERTO_METRO esta ocupado por el PID $pid."
  gris "  Un Metro viejo sirviendo otro arbol de archivos es la causa tipica de"
  gris "  'en web anda y en el celu no'. Lo bajo y arranco uno limpio."
  kill "$pid" 2>/dev/null || true
  for _ in $(seq 1 10); do
    lsof -ti "tcp:$PUERTO_METRO" -sTCP:LISTEN >/dev/null 2>&1 || { verde "✓ Puerto $PUERTO_METRO libre"; return 0; }
    sleep 1
  done
  kill -9 "$pid" 2>/dev/null || true
  sleep 1
  verde "✓ Puerto $PUERTO_METRO libre"
}

# ─────────────────────────────────────────────────────────────────────────────
# Nativo
# ─────────────────────────────────────────────────────────────────────────────

# android/ e ios/ no se commitean (CNG): si no estan, se regeneran de app.json.
asegurar_nativo() {
  local plataforma="$1"
  if [ ! -d "$plataforma" ]; then
    titulo "Generando la carpeta $plataforma/ (expo prebuild)"
    npx expo prebuild --platform "$plataforma"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Comandos
# ─────────────────────────────────────────────────────────────────────────────

CACHE=""
ARGS=()
for a in "$@"; do
  case "$a" in
    --clear-cache) CACHE="--clear" ;;
    *) ARGS+=("$a") ;;
  esac
done
COMANDO="${ARGS[0]:-android}"

case "$COMANDO" in

  android)
    verificar_base
    verificar_android
    esperar_dispositivo
    avisar_expo_go
    liberar_metro
    asegurar_nativo android
    tender_puentes
    titulo "Compilando e instalando en $SERIAL"
    gris "  La primera vez tarda varios minutos; despues es incremental."
    if [ -n "$CACHE" ]; then
      gris "  --clear-cache: vacio la cache de Metro antes de compilar"
      rm -rf "${TMPDIR:-/tmp}/metro-cache" "${TMPDIR:-/tmp}/haste-map-"* 2>/dev/null || true
    fi
    ANDROID_SERIAL="$SERIAL" npx expo run:android
    ;;

  ios)
    verificar_base
    [ "$(uname)" = "Darwin" ] || morir "iOS solo se compila en macOS."
    liberar_metro
    asegurar_nativo ios
    titulo "Compilando e instalando en iOS"
    npx expo run:ios
    ;;

  web)
    verificar_base
    liberar_metro
    titulo "Levantando la web"
    npx expo start --web $CACHE
    ;;

  start)
    verificar_base
    liberar_metro
    if [ -n "$(adb_bin 2>/dev/null)" ] && ADB="$(adb_bin)" && [ -n "$(dispositivos_conectados)" ]; then
      SERIAL="$(dispositivos_conectados | head -1)"
      tender_puentes
    fi
    titulo "Metro (dev client)"
    gris "  Abri la app ya instalada en el celu; se conecta sola."
    npx expo start --dev-client $CACHE
    ;;

  clean)
    verificar_base
    verificar_android
    liberar_metro
    titulo "Regenerando el proyecto nativo desde cero"
    amar "! Esto borra android/ e ios/ y los reconstruye desde app.json."
    rm -rf android ios
    npx expo prebuild --clean
    esperar_dispositivo
    tender_puentes
    ANDROID_SERIAL="$SERIAL" npx expo run:android
    ;;

  doctor)
    titulo "Entorno"
    printf '  node        %s\n' "$(node -v 2>/dev/null || echo 'FALTA')"
    printf '  npm         %s\n' "$(npm -v 2>/dev/null || echo 'FALTA')"
    printf '  java        %s\n' "$(java -version 2>&1 | head -1 || echo 'FALTA')"
    printf '  ANDROID_HOME %s\n' "${ANDROID_HOME:-'(sin definir)'}"
    printf '  adb         %s\n' "$(adb_bin 2>/dev/null || echo 'FALTA')"
    printf '  node_modules %s\n' "$([ -d node_modules ] && echo ok || echo 'FALTA')"
    printf '  android/    %s\n' "$([ -d android ] && echo ok || echo 'se genera con prebuild')"
    printf '  .env        %s\n' "$([ -f .env ] && echo ok || echo 'FALTA')"

    titulo "Dispositivos"
    if ADB="$(adb_bin 2>/dev/null)"; then
      "$ADB" devices -l | sed 's/^/  /'
      "$ADB" reverse --list 2>/dev/null | sed 's/^/  reverse: /' || true
    else
      rojo "  sin adb"
    fi

    titulo "Puerto $PUERTO_METRO"
    lsof -i "tcp:$PUERTO_METRO" -sTCP:LISTEN 2>/dev/null | sed 's/^/  /' || gris "  libre"

    titulo "Doctor de Expo"
    npx expo-doctor 2>&1 | tail -30 || true
    ;;

  *)
    morir "Comando desconocido: $COMANDO. Usa: android | ios | web | start | clean | doctor"
    ;;
esac
