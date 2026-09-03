# Referencia: ESLint + Prettier (Expo)

Setup de linting (calidad de código) y formato. **ESLint** detecta problemas reales (variables sin usar, hooks mal usados); **Prettier** se ocupa solo del formato. Se integran vía `eslint-config-prettier`, que apaga las reglas de formato de ESLint para que no choquen con Prettier.

> A diferencia de RN CLI (que trae `@react-native/eslint-config`), un proyecto Expo usa **`eslint-config-expo`**, que se instala y configura con el comando propio `npx expo lint`.

## 1. Generar la config base con Expo

```bash
npx expo lint
```

La primera vez, este comando instala `eslint`, `eslint-config-expo` y crea `eslint.config.js` (flat config, ESLint 9) en la raíz del proyecto.

## 2. Instalar Prettier

```bash
npm install --save-dev prettier eslint-config-prettier
```

## 3. `.prettierrc.js` (raíz del proyecto)

```js
module.exports = {
  arrowParens: 'always',
  bracketSpacing: true,
  singleQuote: true,
  semi: true,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
};
```

## 4. Conectar Prettier con ESLint

`npx expo lint` deja un `eslint.config.js` en **flat config**. Sumale Prettier al final:

```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier, // ÚLTIMO: desactiva reglas de formato que chocan con Prettier
]);
```

> Regla: `prettier` siempre va **al final** del array.

## 5. Scripts en `package.json`

```json
"scripts": {
  "lint": "expo lint",
  "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx}\""
}
```

## 6. (Recomendado) Formato automático en VS Code

Creá `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

Requiere las extensiones **ESLint** y **Prettier** instaladas en VS Code.

## Verificación

```bash
npm run lint      # no debería tirar errores de configuración
npm run format    # formatea todo src/
```
