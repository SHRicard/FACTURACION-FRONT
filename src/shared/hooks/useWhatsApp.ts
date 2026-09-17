import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { enlaceWhatsApp, normalizarTelefonoAR } from '@/shared/utils';

/** Si ese telefono se entiende como un celular: sin eso, el boton no aparece. */
const puedeAbrir = (telefono?: string | null): boolean => normalizarTelefonoAR(telefono) !== null;

/**
 * Abrir el chat de WhatsApp de un cliente.
 *
 * Abre el chat vacio: el mensaje lo escribe quien cobra, que conoce al cliente.
 * Si el telefono no puede abrir el link (sin WhatsApp instalado), se avisa.
 */
export function useWhatsApp() {
  const [error, setError] = useState<string | null>(null);

  const abrir = useCallback(async (telefono?: string | null) => {
    const numero = normalizarTelefonoAR(telefono);
    if (!numero) return;
    setError(null);
    try {
      await Linking.openURL(enlaceWhatsApp(numero));
    } catch {
      setError('No pudimos abrir WhatsApp en este teléfono.');
    }
  }, []);

  return { abrir, puedeAbrir, error };
}
