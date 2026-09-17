import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { CuerpoDocumento } from '../components';
import { useDocumentoLegal } from '../hooks';
import type { TipoDocumento } from '../types';

interface DocumentoLegalScreenProps {
  tipo: TipoDocumento;
}

/**
 * El titulo mientras el documento no llego. El de verdad viene adentro del
 * documento, pero el encabezado tiene que decir algo desde el primer frame.
 */
const TITULO_POR_TIPO: Record<TipoDocumento, string> = {
  terminos: 'Términos y condiciones',
  privacidad: 'Política de privacidad',
};

/**
 * UNA pantalla para los dos documentos de texto: cambia el `tipo` y nada mas.
 * Los pasos de la baja vienen con otra forma y tienen la suya
 * (`ComoEliminarCuentaScreen`).
 *
 * Se abre con y sin sesion (desde el registro, desde la aceptacion y desde el
 * perfil), asi que vive fuera de `/admin`.
 *
 * No se bifurca movil/escritorio, igual que el login: es una columna de texto
 * con tope de ancho, que es exactamente lo que quiere un documento en un
 * monitor. Un cartel de "en construccion" aca dejaria la politica de privacidad
 * inaccesible desde una ventana ancha, y eso es lo que Google verifica.
 */
export function DocumentoLegalScreen({ tipo }: DocumentoLegalScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const legal = useDocumentoLegal(tipo);
  const refresco = useRefrescar(legal.refrescar);

  // Se puede llegar por link directo (sin historial): ahi la flecha vuelve a la
  // raiz, que decide sola entre el login y la app.
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const titulo = legal.documento?.titulo ?? TITULO_POR_TIPO[tipo];

  if (legal.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo={titulo} ancho="contenido" onVolver={volver}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!legal.documento) {
    return (
      <Pantalla titulo={titulo} ancho="contenido" onVolver={volver}>
        <EstadoVacio
          titulo="No pudimos traer el documento"
          descripcion={legal.error ?? undefined}
          accion={<Button label="Reintentar" variant="secondary" onPress={legal.reintentar} />}
        />
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo={titulo} ancho="contenido" onVolver={volver}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <CuerpoDocumento documento={legal.documento} />
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingBottom: theme.spacing.xl },
  });
