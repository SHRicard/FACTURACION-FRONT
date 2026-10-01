import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { textoCantidad } from '@/features/especies/formato';
import type { Especie } from '@/features/especies/types';
import { Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

interface SelectorEspecieProps {
  especies: readonly Especie[];
  /** Id de la elegida, o vacio. */
  valor: string;
  onCambiar: (id: string) => void;
  error?: string;
}

/**
 * Elige la especie de un renglon.
 *
 * Se dibuja como un campo y abre un modal con la lista, en vez de un desplegable
 * nativo: no hay un picker que se vea igual en iOS, Android y web, y la lista es
 * corta (son categorias, no productos).
 */
export function SelectorEspecie({ especies, valor, onCambiar, error }: SelectorEspecieProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [abierto, setAbierto] = useState(false);

  const elegida = especies.find((especie) => especie.id === valor);

  return (
    <View style={styles.campo}>
      <Text variant="caption" tone="muted">
        Especie *
      </Text>
      <Pressable
        onPress={() => setAbierto(true)}
        style={({ pressed }) => [
          styles.caja,
          error ? styles.cajaError : null,
          pressed && styles.presionada,
        ]}
        accessibilityRole="button"
        accessibilityLabel={elegida ? `Especie: ${elegida.nombre}` : 'Elegir especie'}
      >
        <Text
          variant="body"
          tone={elegida ? 'default' : 'muted'}
          numberOfLines={1}
          style={styles.valor}
        >
          {elegida?.nombre ?? 'Elegir'}
        </Text>
        <ChevronDown size={18} color={theme.colors.textMuted} />
      </Pressable>
      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={abierto}
        onClose={() => setAbierto(false)}
        titulo="Especie"
        descripcion="El tipo de mercadería. El modelo y el talle van en el renglón."
      >
        {/* La lista es corta, pero un negocio con muchas categorias no tiene por
            que quedar con opciones fuera del modal. */}
        <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
          {especies.map((especie) => {
            const activa = especie.id === valor;
            // Cuantas le quedan, como dato. Nunca deshabilita la opcion: una
            // especie en 0 se elige igual y el ticket se carga igual.
            const cantidad =
              especie.cantidad !== undefined ? textoCantidad(especie.cantidad) : null;

            return (
              <Pressable
                key={especie.id}
                onPress={() => {
                  onCambiar(especie.id);
                  setAbierto(false);
                }}
                style={({ pressed }) => [styles.opcion, pressed && styles.presionada]}
                accessibilityRole="radio"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={cantidad ? `${especie.nombre}, ${cantidad}` : especie.nombre}
              >
                <View style={styles.textos}>
                  <Text variant="body" weight={activa ? 'bold' : 'regular'}>
                    {especie.nombre}
                  </Text>
                  {especie.descripcion ? (
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {especie.descripcion}
                    </Text>
                  ) : null}
                </View>
                {cantidad ? (
                  <Text variant="caption" tone="muted">
                    {cantidad}
                  </Text>
                ) : null}
                {activa ? <Check size={20} color={theme.colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    campo: { gap: theme.spacing.xs },
    caja: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      minHeight: 48,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      // El mismo fondo que los `Input` de al lado: se dibuja como un campo mas.
      backgroundColor: theme.colors.surface,
    },
    cajaError: { borderColor: theme.colors.error },
    presionada: { opacity: 0.7 },
    valor: { flex: 1 },
    // Tope de alto para que el modal no crezca fuera de la pantalla.
    lista: { maxHeight: 280 },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      paddingVertical: theme.spacing.sm,
    },
    textos: { flex: 1, gap: 2 },
  });
