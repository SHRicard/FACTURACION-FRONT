#!/usr/bin/env bash
#
# Instalador del stack para el proyecto Expo (managed workflow)
# Instala todas las dependencias definidas en el CLAUDE-EXPO.md de una sola corrida.
#
# Uso: correr desde la RAÍZ del proyecto (donde está package.json):
#   bash scripts/install-stack.sh
#
# ⚠️ Pasos nativos posteriores (NO los hace este script):
#   - Regenerar el proyecto nativo efímero:  npx expo prebuild --clean
#   - Correr en development build:           npx expo run:android
#   - MMKV v4: requiere react-native-nitro-modules (ya incluido abajo)
#   - Reanimated/worklets: revisar la nota de babel-preset-expo en config base
#     (el plugin se agrega solo desde SDK 50+, NO lo dupliques a mano)
#
set -e

echo "📦 Instalando el stack del proyecto (vía npx expo install)..."
echo ""

# ───────────────────────────────────────────────
# 1. Estado: Redux Toolkit + React-Redux
#    (RTK Query viene incluido dentro de @reduxjs/toolkit)
#    No son libs nativas ligadas al SDK de Expo → npm install alcanza,
#    pero "expo install" también funciona (cae a npm install si no hay
#    versión pineada para el paquete).
# ───────────────────────────────────────────────
echo "→ Estado (Redux Toolkit + React-Redux)"
npx expo install @reduxjs/toolkit react-redux

# ───────────────────────────────────────────────
# 2. Navegación: React Navigation (Native Stack) + peer deps
# ───────────────────────────────────────────────
echo "→ Navegación (React Navigation + peer deps)"
npx expo install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# ───────────────────────────────────────────────
# 3. Gestos y animaciones (peer deps de navegación / UI)
#    "expo install" resuelve la versión exacta compatible con el SDK actual.
# ───────────────────────────────────────────────
echo "→ Gestos y animaciones"
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets

# ───────────────────────────────────────────────
# 4. Formularios + validación
# ───────────────────────────────────────────────
echo "→ Formularios y validación (React Hook Form + Zod)"
npx expo install react-hook-form zod @hookform/resolvers

# ───────────────────────────────────────────────
# 5. Storage local: MMKV (v4 = Nitro Module)
#    ⚠️ Código nativo: no funciona en Expo Go, requiere development build.
# ───────────────────────────────────────────────
echo "→ Storage local (MMKV)"
npx expo install react-native-mmkv react-native-nitro-modules

# ───────────────────────────────────────────────
# 6. Íconos: Lucide (sobre react-native-svg, base obligatoria)
# ───────────────────────────────────────────────
echo "→ Íconos (react-native-svg + Lucide)"
npx expo install react-native-svg lucide-react-native

# ───────────────────────────────────────────────
# 7. Fechas: Luxon (+ tipos de TypeScript)
# ───────────────────────────────────────────────
echo "→ Fechas (Luxon)"
npx expo install luxon
npm install --save-dev @types/luxon

echo ""
echo "✅ Stack instalado."
echo ""
echo "⚠️  Pasos nativos pendientes (hacelos a mano):"
echo "   1. Regenerar proyecto nativo:  npx expo prebuild --clean"
echo "   2. Correr en development build:  npx expo run:android"
echo "   3. Reiniciar Metro con cache limpia:  npx expo start --clear"
echo "   4. NO agregues el plugin de Reanimated/worklets a mano en babel.config.js"
echo "      si usás babel-preset-expo v11+ (SDK 50+) — ya lo agrega solo."


# ───────────────────────────────────────────────
# 8. Ejecucion
# ───────────────────────────────────────────────
# bash scripts/install-stack.sh
