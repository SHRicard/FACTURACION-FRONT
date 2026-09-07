import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Documento HTML raiz. SOLO aplica en web: envuelve cada pagina del render
 * estatico. No se renderiza en iOS ni en Android.
 *
 * POR QUE EXISTE
 * Las fuentes las embebe el config plugin de `expo-font`, que es solo nativo. En
 * web no existen, asi que sin esto las 5 tipografias del selector se ven todas
 * iguales (caen al stack del sistema) y el cliente no puede comparar nada.
 *
 * Se cargan desde Google Fonts. Si preferis no depender de un CDN externo (por
 * privacidad o para que funcione offline), la alternativa es self-hostear: los
 * .ttf ya estan en node_modules/@expo-google-fonts y se sirven con @font-face.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Los mismos pesos que se embeben en nativo, ni uno mas. */}
        <link
          rel="stylesheet"
          href={
            'https://fonts.googleapis.com/css2' +
            '?family=Inter:wght@400;500;700' +
            '&family=Poppins:wght@400;500;600;700' +
            '&family=Montserrat:wght@600;700' +
            '&family=Open+Sans:wght@400;600;700' +
            '&family=Roboto:wght@400;500;700' +
            '&family=Lora:wght@600;700' +
            '&display=swap'
          }
        />

        {/*
          Sin esto el body no scrollea en web: React Native Web asume que el
          scroll lo maneja un ScrollView, no el documento.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
