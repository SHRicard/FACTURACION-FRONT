import { AlertCircle } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnlaceAuth, PuertaBienvenida } from '@/features/auth/components';
import { useSesion } from '@/features/auth/hooks';
import { useRefrescar } from '@/shared/hooks';
import { Button, Container, EstadoVacio, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { CuerpoDocumento } from '../components';
import { useAceptarTerminos, useDocumentoLegal } from '../hooks';
import { RUTA_POR_DOCUMENTO } from '../rutas';

/**
 * El paso 0 de la cuenta: aceptar los terminos y la politica de privacidad.
 *
 * Aparece cuando la sesion trae `pendiente: 'terminos'`, que es en dos momentos:
 * con una cuenta que nunca acepto, y con TODAS cuando el texto legal cambia de
 * version (el backend las vuelve a poner en pendiente solo). Hasta que acepte,
 * ninguna ruta del negocio responde: no se puede saltear.
 *
 * La unica salida es "Ahora no", que cierra la sesion. No hay forma de "aceptar
 * que no acepto": ese es tambien el criterio del backend, que responde 400 a un
 * `false`.
 *
 * No se bifurca movil/escritorio, igual que el login y la bienvenida: es texto
 * con dos botones, y un "en construccion" dejaria la cuenta trabada en una
 * ventana ancha sin poder aceptar nada.
 */
export function AceptarTerminosScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { cerrarSesion } = useSesion();
  const legal = useDocumentoLegal('terminos');
  const aceptacion = useAceptarTerminos();
  const refresco = useRefrescar(legal.refrescar);

  return (
    <PuertaBienvenida paso="terminos">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Container style={styles.contenido}>
          <View style={styles.encabezado}>
            <Text variant="heading" weight="bold" accessibilityRole="header">
              Antes de empezar
            </Text>
            <Text variant="body" tone="muted">
              Para usar la app tenés que aceptar los términos y condiciones y la política de
              privacidad.
            </Text>
          </View>

          {aceptacion.error ? (
            <View style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
              <AlertCircle size={18} color={theme.colors.error} />
              <View style={styles.flex}>
                <Text variant="caption" tone="error">
                  {aceptacion.error}
                </Text>
              </View>
            </View>
          ) : null}

          <ScrollView
            style={styles.flex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            refreshControl={refresco.control}
          >
            {legal.cargando && !refresco.refrescando ? (
              <View style={styles.centro}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : null}

            {/*
              El documento no llego. Se puede reintentar, pero NO se ofrece
              aceptar: nadie acepta un texto que no pudo leer.
            */}
            {!legal.cargando && !legal.documento ? (
              <EstadoVacio
                titulo="No pudimos traer los términos"
                descripcion={legal.error ?? undefined}
                accion={
                  <Button label="Reintentar" variant="secondary" onPress={legal.reintentar} />
                }
              />
            ) : null}

            {legal.documento ? <CuerpoDocumento documento={legal.documento} mostrarTitulo /> : null}
          </ScrollView>

          <View style={styles.acciones}>
            {/* La politica va aparte y se acepta junto con los terminos: tiene
                que poder leerse antes de tocar "Acepto". */}
            <EnlaceAuth
              href={RUTA_POR_DOCUMENTO.privacidad}
              label="Leer la política de privacidad"
            />
            <Button
              label="Acepto"
              onPress={aceptacion.confirmar}
              loading={aceptacion.aceptando}
              disabled={!legal.documento}
              size="lg"
              fullWidth
            />
            <Button label="Ahora no" variant="ghost" onPress={cerrarSesion} fullWidth />
          </View>
        </Container>
      </SafeAreaView>
    </PuertaBienvenida>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    contenido: { flex: 1, gap: theme.spacing.md, paddingVertical: theme.spacing.lg },
    flex: { flex: 1 },
    encabezado: { gap: theme.spacing.xs },
    error: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.surface,
    },
    centro: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    scroll: { paddingBottom: theme.spacing.lg },
    acciones: { gap: theme.spacing.sm },
  });
