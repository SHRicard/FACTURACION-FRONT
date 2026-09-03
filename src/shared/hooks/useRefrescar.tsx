import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';

import { useTheme } from '@/theme';

/**
 * Tiempo minimo que la rueda queda visible. Sin esto, un refresh que resuelve
 * en 50ms se ve como un parpadeo y el usuario no sabe si paso algo.
 */
const MIN_SPINNER_MS = 400;

/**
 * Gesto de "tirar para abajo para refrescar", con los colores del theme,
 * el minimo de spinner visible y el corte si la pantalla se desmonta a mitad.
 *
 * Toda pantalla que muestre datos de la API tiene que usarlo. Nunca armes un
 * `RefreshControl` suelto en la pantalla.
 *
 * @param refrescar el `refrescar` del hook de la feature (el `refetch` de RTK
 *                  Query envuelto). Tiene que devolver la promesa.
 *
 * @example
 * const ficha = useCliente(clienteId);
 * const refresco = useRefrescar(ficha.refrescar);
 * <ScrollView refreshControl={refresco.control}>...</ScrollView>
 */
export function useRefrescar(refrescar: () => Promise<unknown>) {
  const theme = useTheme();
  const [refrescando, setRefrescando] = useState(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const alRefrescar = useCallback(async () => {
    setRefrescando(true);
    const inicio = Date.now();
    try {
      await refrescar();
    } finally {
      const restante = MIN_SPINNER_MS - (Date.now() - inicio);
      if (restante > 0) {
        await new Promise((resolver) => setTimeout(resolver, restante));
      }
      // Si la pantalla se desmonto a mitad del refresh, no toques el estado.
      if (montado.current) setRefrescando(false);
    }
  }, [refrescar]);

  const control = (
    <RefreshControl
      refreshing={refrescando}
      onRefresh={alRefrescar}
      colors={[theme.colors.primary]}
      tintColor={theme.colors.primary}
      progressBackgroundColor={theme.colors.surface}
    />
  );

  return { refrescando, control, refrescar: alRefrescar };
}
