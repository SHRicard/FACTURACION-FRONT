import { usePathname, useRouter } from 'expo-router';
import { Palette } from 'lucide-react-native';
import { useCallback } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StorageKeys, storageService } from '@/services/storage';
import { useTheme, type Theme } from '@/theme';

/** Lado del boton. No sale del theme: el theme no tipa tamanos de componente. */
const TAMANO = 56;

/**
 * Cuanto se tiene que mover el dedo para que sea un arrastre y no un toque.
 *
 * Sin este margen, el temblor normal de la mano al tocar activaria el arrastre
 * y el boton nunca abriria el catalogo.
 */
const UMBRAL_ARRASTRE = 6;

/**
 * Separacion inicial contra el borde de abajo. Arranca por encima de la barra
 * de tabs, que mide alrededor de 60px y no forma parte del area segura.
 */
const ALTO_BARRA_TABS = 72;

type Posicion = { x: number; y: number };

type Limites = { minX: number; maxX: number; minY: number; maxY: number };

/** La posicion donde quedo la ultima vez, si es que hay una sana guardada. */
function leerPosicionGuardada(): Posicion | null {
  const guardada = storageService.get<Posicion>(StorageKeys.POSICION_BOTON_DS);
  // El storage puede traer cualquier cosa (una version vieja, un JSON a mano):
  // si no son dos numeros de verdad, se ignora y arranca en la esquina.
  if (!guardada || !Number.isFinite(guardada.x) || !Number.isFinite(guardada.y)) return null;
  return guardada;
}

function guardarPosicion(posicion: Posicion): void {
  storageService.set(StorageKeys.POSICION_BOTON_DS, posicion);
}

/** Deja la posicion dentro de la pantalla. Vale igual en el hilo de UI. */
function acotar(posicion: Posicion, limites: Limites): Posicion {
  'worklet';
  return {
    x: clamp(posicion.x, limites.minX, limites.maxX),
    y: clamp(posicion.y, limites.minY, limites.maxY),
  };
}

/**
 * Acceso flotante al catalogo del design system.
 *
 * Se ARRASTRA: no vive clavado en una esquina, porque ahi tapa justo lo que uno
 * quiere mirar (un boton de la pantalla, la ultima fila de una lista). Se lo
 * corre con el dedo y queda donde se lo deje, incluso despues de recargar.
 *
 * Solo aparece en desarrollo (`__DEV__`): en un build de produccion el bundler
 * lo elimina junto con la rama muerta. Se esconde cuando ya estas en el catalogo.
 */
export function BotonDesignSystem() {
  // Los hooks van SIEMPRE antes de cualquier return condicional.
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Hasta donde puede llegar el boton. Sale del ancho de VENTANA (no de la
  // plataforma), asi que se recalcula solo al rotar o al achicar el navegador.
  const margen = theme.spacing.lg;
  const limites: Limites = {
    minX: insets.left + margen,
    maxX: Math.max(insets.left + margen, width - insets.right - margen - TAMANO),
    minY: insets.top + margen,
    maxY: Math.max(insets.top + margen, height - insets.bottom - margen - TAMANO),
  };

  // `useSharedValue` solo mira este valor en el PRIMER render: en los siguientes
  // se ignora, asi que recalcularlo no pisa lo que el usuario haya arrastrado.
  const posicion = useSharedValue<Posicion>(
    acotar(
      leerPosicionGuardada() ?? { x: limites.maxX, y: limites.maxY - ALTO_BARRA_TABS },
      limites,
    ),
  );
  // Donde estaba al empezar el arrastre. Sin esto habria que acumular deltas a
  // mano y el boton se desincroniza del dedo despues de acotarlo contra un borde.
  const inicioArrastre = useSharedValue<Posicion>({ x: 0, y: 0 });
  const escala = useSharedValue(1);
  const opacidad = useSharedValue(1);

  const irAlCatalogo = useCallback(() => {
    router.push('/design-system');
  }, [router]);

  const arrastrar = Gesture.Pan()
    // Los dos ejes con umbral: el toque tiene que poder ganar en cualquier
    // direccion, si no arrastrar en diagonal se come el tap.
    .activeOffsetX([-UMBRAL_ARRASTRE, UMBRAL_ARRASTRE])
    .activeOffsetY([-UMBRAL_ARRASTRE, UMBRAL_ARRASTRE])
    .onStart(() => {
      inicioArrastre.value = posicion.value;
      escala.value = withSpring(1.1);
    })
    .onUpdate((evento) => {
      posicion.value = acotar(
        {
          x: inicioArrastre.value.x + evento.translationX,
          y: inicioArrastre.value.y + evento.translationY,
        },
        limites,
      );
    })
    .onFinalize(() => {
      escala.value = withSpring(1);
      // Se guarda al soltar, no en cada frame: el arrastre dispara decenas de
      // updates por segundo y cada uno seria una escritura al storage.
      runOnJS(guardarPosicion)(posicion.value);
    });

  const abrir = Gesture.Tap()
    .onBegin(() => {
      opacidad.value = 0.7;
    })
    .onEnd((_evento, exito) => {
      if (exito) runOnJS(irAlCatalogo)();
    })
    .onFinalize(() => {
      opacidad.value = 1;
    });

  // Carrera: el que se active primero cancela al otro. Con los umbrales de
  // arriba, quedarse quieto abre el catalogo y moverse arrastra.
  const gesto = Gesture.Race(arrastrar, abrir);

  const estiloAnimado = useAnimatedStyle(() => {
    // Se acota tambien al dibujar, no solo al arrastrar: si la ventana se achica
    // o el celular rota, la posicion guardada puede caer fuera de la pantalla y
    // el boton desaparece sin forma de traerlo de vuelta.
    const { x, y } = acotar(posicion.value, limites);

    return {
      transform: [{ translateX: x }, { translateY: y }, { scale: escala.value }],
      opacity: opacidad.value,
    };
  });

  if (!__DEV__ || pathname === '/design-system') return null;

  const styles = createStyles(theme);

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        style={[styles.boton, estiloAnimado]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Abrir el catalogo del design system"
        accessibilityHint="Arrastralo para moverlo de lugar"
        // Los gestos de RNGH no llegan con el lector de pantalla prendido: este
        // es el unico camino para activarlo desde TalkBack o VoiceOver.
        onAccessibilityTap={irAlCatalogo}
      >
        <Palette size={24} color={theme.colors.primary} />
      </Animated.View>
    </GestureDetector>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    boton: {
      // Ancla en 0,0: la posicion real la pone el transform, que se anima en el
      // hilo de UI. Con `left`/`top` el arrastre pasaria por el hilo de JS y se
      // notaria el tironeo.
      position: 'absolute',
      left: 0,
      top: 0,
      width: TAMANO,
      height: TAMANO,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      // Sombra para que se despegue del contenido de la pantalla.
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
  });
