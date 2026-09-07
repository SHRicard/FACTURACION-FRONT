import { Receipt } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { EstadoVacio, Pantalla } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { useFacturas } from '../hooks';

/**
 * Listado de facturas.
 *
 * Todavia sin API: cuando llegue, el listado sale de `useFacturas()` y este
 * ScrollView se reemplaza por un FlatList con el mismo `refreshControl`.
 */
export function FacturasScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const facturas = useFacturas();
  const refresco = useRefrescar(facturas.refrescar);

  return (
    <Pantalla titulo="Facturas" descripcion="Todo lo que emitiste.">
      {/*
        El ScrollView existe para poder tirar para abajo aunque no haya nada que
        scrollear: sin el, el gesto no tiene de donde colgarse. `flexGrow` es lo
        que deja el estado vacio centrado en vez de pegado arriba.
      */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={refresco.control}
      >
        <EstadoVacio
          icono={<Receipt size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo="Todavia no hay facturas"
          descripcion="Cuando emitas la primera, va a aparecer en esta lista."
        />
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { flexGrow: 1, paddingBottom: theme.spacing.lg },
  });
