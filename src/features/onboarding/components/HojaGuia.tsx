import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text, espacioDeBarra } from '@/shared/ui/atoms';
import { useEstiloTabs, useTheme, type Theme } from '@/theme';

import { useTour } from '../hooks';
import { PASOS } from '../pasos';
import type { TabAdmin } from '../types';

interface HojaGuiaProps {
  /**
   * Los tabs de la barra, EN ORDEN. De aca sale donde cae el halo: los tabs se
   * reparten el ancho en partes iguales, asi que con el orden alcanza.
   *
   * Se pasa por props y no se importa: los tabs los define el layout, y si el
   * dia de manana se agrega uno, el halo se acomoda solo.
   */
  tabs: readonly TabAdmin[];
}

/** Cuanto hay que arrastrar hacia abajo para que la hoja se baje. */
const ARRASTRE_PARA_BAJAR = 60;

/**
 * Hoja guia del tour de bienvenida.
 *
 * Sube desde abajo, dice que hacer y resalta el tab del que esta hablando. NO
 * bloquea la app a proposito: la persona puede tocar, equivocarse y volver, y
 * la hoja la sigue esperando. Se baja arrastrandola y vuelve desde Mas.
 *
 * Se monta una sola vez, en el layout del area de administrador: si viviera
 * dentro de cada pantalla, cambiar de tab la desmontaria y volveria a animar.
 */
export function HojaGuia({ tabs }: HojaGuiaProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // La barra tiene tres formas posibles (las elige el cliente en Configuracion)
  // y el halo tiene que caer sobre la de verdad, no sobre una fija.
  const { estilo } = useEstiloTabs();
  const tour = useTour();
  // Los hooks van SIEMPRE antes de cualquier return condicional.
  const desplazamiento = useSharedValue(0);

  const bajar = Gesture.Pan()
    // Solo hacia abajo: hacia arriba no hay nada que hacer y el gesto le robaria
    // el scroll a la pantalla de atras.
    .activeOffsetY(12)
    .onUpdate((evento) => {
      desplazamiento.value = Math.max(0, evento.translationY);
    })
    .onEnd(() => {
      if (desplazamiento.value > ARRASTRE_PARA_BAJAR) {
        desplazamiento.value = 0;
        runOnJS(tour.minimizar)();
        return;
      }
      // No llego: vuelve a su lugar en vez de quedar a medio camino.
      desplazamiento.value = withSpring(0, { damping: 18 });
    });

  const estiloArrastre = useAnimatedStyle(() => ({
    transform: [{ translateY: desplazamiento.value }],
  }));

  const paso = tour.paso;
  if (!paso) return null;

  const styles = createStyles(theme);
  // -1 (paso sin tab) = no se dibuja el halo.
  const indiceTab = paso.tab ? tabs.indexOf(paso.tab) : -1;
  const espacioBarra = espacioDeBarra(estilo, insets.bottom);

  return (
    <>
      {indiceTab >= 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.filaHalo,
            {
              bottom: insets.bottom + estilo.margenInferior,
              height: estilo.alto,
              paddingHorizontal: estilo.margenLateral,
            },
          ]}
        >
          {/* Los tabs se reparten el ancho en partes iguales: se dibuja la fila
              entera y se pinta una sola, asi el reparto lo hace flex y no hay
              que medir la pantalla. */}
          {tabs.map((nombre, indice) => (
            <View key={nombre} style={styles.ranura}>
              {indice === indiceTab ? (
                <View
                  style={[
                    styles.halo,
                    // En la barra flotante el halo se redondea como la capsula.
                    estilo.radio > 0 && { borderRadius: theme.radius.full },
                  ]}
                >
                  {/*
                    El relleno va en una capa aparte con su propia opacidad:
                    aplicarsela al View de afuera desteniria tambien el borde, y
                    el borde tiene que quedar solido para que el tab se lea
                    marcado y no apagado.
                  */}
                  <View style={styles.haloRelleno} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      <GestureDetector gesture={bajar}>
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(180)}
          style={[styles.hoja, { bottom: espacioBarra }, estiloArrastre]}
        >
          {/* Pista de que se puede arrastrar. Decorativa: lo que se lee es el titulo. */}
          <View style={styles.agarre} accessibilityElementsHidden importantForAccessibility="no" />

          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" style={styles.titulo} accessibilityRole="header">
              {paso.titulo}
            </Text>
            {/* El contador escrito acompana a los puntos de abajo: los puntos
                se leen de un vistazo, este dice el numero exacto y es lo unico
                de los dos que puede leer un lector de pantalla. */}
            <Text variant="caption" tone="muted">
              {tour.numero} de {tour.total}
            </Text>
          </View>

          <Text variant="body" tone="muted">
            {paso.texto}
          </Text>

          <View style={styles.pie}>
            {/*
              Los puntos son decorativos: el contador de arriba ya dice "2 de 4"
              en palabras, asi que marcarlos como no accesibles evita que el
              lector de pantalla repita el progreso dos veces.
            */}
            <View
              style={styles.puntos}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {PASOS.map((cadaPaso, indice) => (
                <View
                  key={cadaPaso.id}
                  style={[styles.punto, indice === tour.numero - 1 && styles.puntoActivo]}
                />
              ))}
            </View>

            <View style={styles.acciones}>
              <Button label="Saltear" variant="ghost" size="sm" onPress={tour.saltear} />
              <Button
                label={paso.accion ?? 'Siguiente'}
                variant="primary"
                size="sm"
                onPress={tour.avanzar}
              />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    hoja: {
      position: 'absolute',
      left: 0,
      right: 0,
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      // Sombra hacia arriba: la hoja tiene que leerse por encima del contenido.
      elevation: 12,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
    },
    agarre: {
      width: 36,
      height: 4,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing.xs,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    // Sin esto, un titulo largo empuja el contador fuera de la hoja.
    titulo: { flexShrink: 1 },
    pie: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    puntos: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    punto: {
      width: 6,
      height: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.border,
    },
    // El paso actual se alarga ademas de cambiar de color: asi se distingue
    // tambien sin percibir bien los colores.
    puntoActivo: { width: 16, backgroundColor: theme.colors.primary },
    acciones: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    // Fila de ranuras del ancho de la barra. Solo una se pinta.
    filaHalo: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
    ranura: { flex: 1 },
    halo: {
      flex: 1,
      borderRadius: theme.radius.md,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      overflow: 'hidden',
    },
    haloRelleno: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: theme.colors.primary,
      opacity: 0.12,
    },
  });
