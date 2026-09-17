import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { useBajaCuenta } from '../hooks';

/** Un item de la lista de "que se elimina". El punto va aparte para que el texto sangre parejo. */
function Punto({ texto }: { texto: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.punto}>
      <Text variant="body" tone="muted">
        •
      </Text>
      <View style={styles.flex}>
        <Text variant="body" tone="muted">
          {texto}
        </Text>
      </View>
    </View>
  );
}

/**
 * Como darse de baja. Es la version dentro de la app de la pagina que Google
 * exige como recurso web, y sale del MISMO endpoint que ella.
 *
 * Tiene pantalla propia y no la compartida de documentos porque el backend la
 * publica con otra forma: no son secciones de texto, es una lista de que se
 * borra mas donde hacerlo.
 *
 * Solo explica: el borrado de verdad se hace desde el perfil, con la sesion
 * abierta. Esta pantalla se abre tambien SIN sesion, que es el caso para el que
 * existe: alguien que perdio el acceso a su cuenta.
 */
export function ComoEliminarCuentaScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const legal = useBajaCuenta();
  const refresco = useRefrescar(legal.refrescar);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (legal.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Cómo eliminar tu cuenta" ancho="contenido" onVolver={volver}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!legal.baja) {
    return (
      <Pantalla titulo="Cómo eliminar tu cuenta" ancho="contenido" onVolver={volver}>
        <EstadoVacio
          titulo="No pudimos traer los pasos"
          descripcion={legal.error ?? undefined}
          accion={<Button label="Reintentar" variant="secondary" onPress={legal.reintentar} />}
        />
      </Pantalla>
    );
  }

  const baja = legal.baja;

  return (
    <Pantalla titulo="Cómo eliminar tu cuenta" ancho="contenido" onVolver={volver}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <Text variant="caption" tone="muted">
          Versión {baja.version}
        </Text>

        {baja.enLaApp ? (
          <View style={styles.bloque}>
            <Text variant="body" weight="bold" accessibilityRole="header">
              Desde la app
            </Text>
            <Text variant="body" tone="muted">
              {baja.enLaApp}
            </Text>
            <Text variant="caption" tone="muted">
              Se borra al momento: no hay período de gracia ni forma de recuperarlo.
            </Text>
          </View>
        ) : null}

        {baja.seElimina.length > 0 ? (
          <View style={styles.seccion}>
            <Text variant="body" weight="bold" accessibilityRole="header">
              Qué se elimina
            </Text>
            {baja.seElimina.map((texto) => (
              <Punto key={texto} texto={texto} />
            ))}
          </View>
        ) : null}

        {/* Para quien ya no puede entrar: es el caso que Google quiere cubierto. */}
        {baja.contacto ? (
          <View style={styles.bloque}>
            <Text variant="body" weight="bold" accessibilityRole="header">
              Si perdiste el acceso a tu cuenta
            </Text>
            <Text variant="body" tone="muted">
              Escribinos a {baja.contacto} desde el correo de tu cuenta y la damos de baja
              {baja.plazoDiasSolicitudPorEmail
                ? ` dentro de los ${baja.plazoDiasSolicitudPorEmail} días.`
                : '.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    seccion: { gap: theme.spacing.sm },
    bloque: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    punto: { flexDirection: 'row', gap: theme.spacing.sm },
    flex: { flex: 1 },
  });
