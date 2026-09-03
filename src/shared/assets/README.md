# shared/assets

Imágenes e íconos que usa **más de una feature**. Si lo usa una sola, va en
`features/<x>/assets/` y recién sube acá cuando una segunda feature lo necesite
(misma regla de promoción que los componentes).

## Qué formato usar

| Caso | Formato | Por qué |
|---|---|---|
| Logos e íconos propios | **SVG** | Nítidos en cualquier densidad, sin mantener `@2x`/`@3x`, y siguen el theme por la prop `color`. |
| Fotos e ilustraciones | **PNG / JPG** con `@2x` y `@3x` | No hay ventaja vectorial; se importa solo el nombre base y Metro elige la densidad. |

## Reglas

- Al exportar un SVG propio, usá `currentColor` en `fill` / `stroke`. Con hex fijos,
  la prop `color` no tiene efecto.
  ❌ Excepción: logos de terceros (Google, Apple) no se recolorean.
- La ruta de un `import` de asset tiene que ser **estática**: Metro los resuelve
  en build time, no acepta rutas armadas en runtime.
- **El ícono de la app y la splash screen no viven acá.** Se configuran en
  `app.json` (`icon`, `android.adaptiveIcon`, plugin `expo-splash-screen`)
  apuntando a un PNG de `assets/` en la raíz del proyecto. Los genera Expo en
  build time: nunca se editan `android/app/src/main/res/` ni
  `ios/<App>/Images.xcassets/` a mano.

## ⚠️ Importar SVG como componente: falta un paso

Para hacer `import Logo from '@/shared/assets/logo.svg'` hace falta instalar
`react-native-svg-transformer` y crear un `metro.config.js`. **Todavía no está
hecho** (regla 12: se avisa antes de sumar una dependencia). Hasta entonces, los
íconos salen de `lucide-react-native`, que ya está instalado.
