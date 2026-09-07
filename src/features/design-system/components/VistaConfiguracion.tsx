import { StyleSheet, View } from 'react-native';

import {
  SelectorEstiloCabecera,
  SelectorEstiloTabs,
  SelectorModo,
  SelectorTipografia,
  Text,
} from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { Muestra } from './Muestra';
import { Seccion } from './Seccion';

/**
 * Todo lo que CAMBIA la app, junto y de un vistazo.
 *
 * Es lo mismo que ve el cliente en Configuracion, pero reunido aca para poder
 * probar una combinacion y mirar el catalogo de al lado sin salir.
 */
export function VistaConfiguracion() {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.grilla}>
      <Seccion
        titulo="Apariencia"
        descripcion="Claro, oscuro o lo que diga el celular. Queda guardado en el storage."
      >
        <SelectorModo />
      </Seccion>

      <Seccion
        titulo="Tipografia"
        descripcion="Cada opcion se dibuja con su propia fuente. Al elegir, cambia TODA la app al instante."
      >
        <SelectorTipografia />

        <Muestra codigo='variant="heading" weight="bold" → familia display'>
          <Text variant="heading" weight="bold">
            Titulo principal
          </Text>
        </Muestra>
        <Muestra codigo='variant="body" → familia text'>
          <Text variant="body">El texto corriente de la app.</Text>
        </Muestra>
        <Muestra codigo="Inter tiene cifras tabulares: los montos alinean">
          <View>
            <Text variant="body">$ 1.234.567,89</Text>
            <Text variant="body">$&nbsp;&nbsp;&nbsp;&nbsp;98.400,00</Text>
            <Text variant="body">$ 1.002.930,50</Text>
          </View>
        </Muestra>
      </Seccion>

      <Seccion
        titulo="Barra de tabs"
        descripcion="Los tres estilos de la barra de abajo. Cambia la barra de verdad: mirala mientras elegis."
      >
        <SelectorEstiloTabs />
      </Seccion>

      <Seccion
        titulo="Cabecera"
        descripcion="Como se ve el titulo al entrar al detalle de algo. Se aplica a todas las pantallas con flecha de volver."
      >
        <SelectorEstiloCabecera />
      </Seccion>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // Row + wrap: con secciones al 100% se comporta como columna, y al 48%
    // arma dos columnas. Un solo layout para los dos casos.
    grilla: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      gap: theme.spacing.xl,
    },
  });
