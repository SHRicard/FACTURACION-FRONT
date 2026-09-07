import { LayoutDashboard, Menu, Receipt, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme, type EstiloTabs, type Theme } from '@/theme';

/** Los cuatro iconos de la barra, en orden. Solo para la miniatura. */
const ICONOS = [LayoutDashboard, Receipt, Users, Menu];

/** Cual se muestra activo en la miniatura: el tercero, para que no quede en un borde. */
const ACTIVO = 2;

const IconoActivo = ICONOS[ACTIVO];

/**
 * Miniatura de un estilo de barra, a escala.
 *
 * Existe para que el cliente vea lo que esta eligiendo sin tener que aplicarlo
 * y volver: es la misma idea que el selector de tipografia, donde cada opcion
 * se dibuja con su propia fuente.
 *
 * No es la barra de verdad: es un dibujo. Reproduce la forma (el aire, el
 * redondeo, el boton del medio) con los tokens del theme, pero no navega ni
 * conoce las rutas.
 */
export function MuestraBarra({ estilo }: { estilo: EstiloTabs }) {
  const theme = useTheme();
  const styles = createStyles(theme, estilo);

  return (
    <View style={styles.marco}>
      <View style={styles.barra}>
        {ICONOS.map((Icono, indice) => {
          const activo = indice === ACTIVO;
          const color = activo ? theme.colors.primary : theme.colors.textMuted;

          return (
            <View key={indice} style={styles.ranura}>
              <View style={activo && estilo.conBurbuja ? styles.iconoLevantado : undefined}>
                <Icono
                  size={16}
                  color={color}
                  fill={activo ? color : 'transparent'}
                  strokeWidth={activo ? 2.2 : 1.8}
                />
              </View>
              <View style={[styles.etiqueta, activo && styles.etiquetaActiva]} />
            </View>
          );
        })}
        {estilo.conBurbuja ? (
          // Quieta sobre el tab activo: en la barra de verdad se desliza, pero
          // una miniatura animada distrae de lo que se esta eligiendo.
          <View style={styles.burbuja}>
            <IconoActivo
              size={15}
              color={theme.colors.onPrimary}
              fill="transparent"
              strokeWidth={2}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme, estilo: EstiloTabs) =>
  StyleSheet.create({
    // Simula el piso de la pantalla: sin esto, el aire de la barra flotante no
    // se entiende.
    marco: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingTop: theme.spacing.md,
      paddingHorizontal: estilo.margenLateral > 0 ? theme.spacing.sm : 0,
      paddingBottom: estilo.margenInferior > 0 ? theme.spacing.sm : 0,
      overflow: 'hidden',
    },
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      paddingHorizontal: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderRadius: estilo.radio > 0 ? theme.radius.full : 0,
      borderColor: theme.colors.border,
      ...(estilo.margenLateral > 0
        ? { borderWidth: StyleSheet.hairlineWidth }
        : { borderTopWidth: StyleSheet.hairlineWidth }),
    },
    ranura: { flex: 1, alignItems: 'center', gap: 3 },
    // Igual que en la barra de verdad: el icono se apaga pero sigue ocupando su
    // lugar, porque lo que se ve arriba es ese mismo icono.
    iconoLevantado: { opacity: 0 },
    // La etiqueta va como una rayita: a esta escala el texto no se leeria.
    etiqueta: { width: 18, height: 3, borderRadius: 2, backgroundColor: theme.colors.border },
    etiquetaActiva: { backgroundColor: theme.colors.primary },
    burbuja: {
      position: 'absolute',
      // Centrada sobre el tercero de cuatro: (2 + 0.5) / 4 del ancho.
      left: '62.5%',
      marginLeft: -15,
      bottom: 44 - 15,
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      height: 30,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
  });
