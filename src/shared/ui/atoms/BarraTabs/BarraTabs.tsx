import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DIAMETRO_BURBUJA_TABS, useEstiloTabs, useTheme } from '@/theme';

import { Text } from '../Text';
import { createStyles } from './BarraTabs.styles';
import type { BarraTabsProps, TabDefinido } from './BarraTabs.types';

/** Tamano del icono de un tab. */
const TAMANO_ICONO = 24;

/**
 * Como viaja la burbuja de un tab al otro.
 *
 * Una transicion y no un resorte: el resorte pasa de largo y vuelve, y en un
 * recorrido tan corto eso se lee como un temblor. Con `out` sale rapido y
 * desacelera hasta clavar la posicion final, que es lo unico que interesa.
 */
const TRANSICION = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};

/**
 * Barra de tabs de la app, en los tres estilos que puede elegir el cliente
 * (ver `estilosTabs` en el theme y el selector en Configuracion).
 *
 * Reemplaza a la barra que trae el navegador para poder usar los tokens del
 * theme y, sobre todo, para marcar el tab activo como lo hacen iOS y Mercado
 * Libre: el icono pasa de linea a RELLENO. El color solo no alcanza —hay que
 * percibirlo— y ademas se pierde contra un fondo claro.
 *
 * No sabe de rutas ni de negocio: los tabs entran por props desde el layout.
 */
function BarraTabsComponent({ state, descriptors, navigation, insets, tabs }: BarraTabsProps) {
  const theme = useTheme();
  const { estilo } = useEstiloTabs();
  const styles = useMemo(
    () => createStyles(theme, estilo, insets.bottom),
    [theme, estilo, insets.bottom],
  );

  // Ancho de la barra, para saber donde cae cada tab. Se mide en vez de
  // calcularse: la barra puede tener margenes laterales segun el estilo.
  const [ancho, setAncho] = useState(0);
  const anchoDeTab = ancho / tabs.length;

  const rutaActiva = state.routes[state.index];
  const indiceActivo = tabs.findIndex((tab) => tab.ruta === rutaActiva?.name);
  const TabActivo = indiceActivo >= 0 ? tabs[indiceActivo] : undefined;

  const desplazamiento = useSharedValue(0);
  // La primera posicion se pone sin animar: si no, la burbuja entra volando
  // desde el borde izquierdo cada vez que se abre la app.
  const yaUbicada = useRef(false);

  useEffect(() => {
    if (!estilo.conBurbuja || anchoDeTab <= 0 || indiceActivo < 0) return;

    const destino = anchoDeTab * indiceActivo + (anchoDeTab - DIAMETRO_BURBUJA_TABS) / 2;
    if (yaUbicada.current) {
      desplazamiento.value = withTiming(destino, TRANSICION);
    } else {
      desplazamiento.value = destino;
      yaUbicada.current = true;
    }
  }, [estilo.conBurbuja, anchoDeTab, indiceActivo, desplazamiento]);

  const estiloBurbuja = useAnimatedStyle(() => ({
    transform: [{ translateX: desplazamiento.value }],
  }));

  const medir = (evento: LayoutChangeEvent) => setAncho(evento.nativeEvent.layout.width);

  const conBurbuja = estilo.conBurbuja && TabActivo !== undefined && anchoDeTab > 0;

  const dibujarTab = (tab: TabDefinido) => {
    const ruta = state.routes.find((r) => r.name === tab.ruta);
    // Una ruta declarada en el layout pero no montada todavia: se saltea en vez
    // de romper la barra entera.
    if (!ruta) return null;

    const activo = rutaActiva?.key === ruta.key;
    const { options } = descriptors[ruta.key] ?? {};
    const color = activo ? theme.colors.primary : theme.colors.textMuted;

    const alTocar = () => {
      const evento = navigation.emit({
        type: 'tabPress',
        target: ruta.key,
        canPreventDefault: true,
      });
      // Si ya estamos parados ahi, tocar de nuevo no navega: el navegador ya
      // maneja el "volver al principio del stack" por su cuenta.
      if (!activo && !evento.defaultPrevented) navigation.navigate(ruta.name);
    };

    const alMantener = () => {
      navigation.emit({ type: 'tabLongPress', target: ruta.key });
    };

    return (
      <Pressable
        key={ruta.key}
        onPress={alTocar}
        onLongPress={alMantener}
        style={({ pressed }) => [styles.tab, pressed && styles.presionado]}
        accessibilityRole="button"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={options?.tabBarAccessibilityLabel ?? tab.etiqueta}
      >
        <View style={activo && conBurbuja ? styles.iconoLevantado : undefined}>
          <tab.Icono
            size={TAMANO_ICONO}
            color={color}
            // Relleno = activo. En un icono de lineas sueltas (el de "Mas") el
            // relleno no se ve, y ahi lo que marca el estado es el grosor.
            fill={activo ? color : 'transparent'}
            strokeWidth={activo ? 2.2 : 1.8}
          />
        </View>
        <Text
          variant="caption"
          weight={activo ? 'bold' : 'medium'}
          tone={activo ? 'primary' : 'muted'}
        >
          {tab.etiqueta}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.envoltorio}>
      <View style={styles.pila}>
        {estilo.margenSuperior > 0 ? <View style={styles.aire} /> : null}
        <View
          style={[styles.barra, estilo.margenInferior > 0 && styles.flotando]}
          onLayout={estilo.conBurbuja ? medir : undefined}
        >
          {tabs.map(dibujarTab)}
        </View>

        {conBurbuja ? (
          // No recibe toques: el tab que tiene debajo es el que ya esta activo,
          // y asi un segundo toque le sigue llegando (es lo que usa el
          // navegador para volver al principio del stack).
          <Animated.View
            pointerEvents="none"
            style={[styles.burbuja, estiloBurbuja]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {/*
              De linea, NO relleno. Adentro de la burbuja el relleno tapa el
              dibujo: el icono de facturas se convierte en una mancha porque el
              monto y las lineas de adentro quedan del mismo color que el
              cuerpo. Aca el relleno tampoco hace falta —el circulo azul ya dice
              que es el tab activo—, asi que el icono se dibuja entero.
            */}
            <TabActivo.Icono
              size={TAMANO_ICONO}
              color={theme.colors.onPrimary}
              fill="transparent"
              strokeWidth={2}
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

export const BarraTabs = memo(BarraTabsComponent);
