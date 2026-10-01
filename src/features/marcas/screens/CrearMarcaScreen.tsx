import { MapPin, Phone, Store, Users } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AuthLayout, PuertaBienvenida } from '@/features/auth/components';
import { useSesion } from '@/features/auth/hooks';
import { Button, CampoControlado, Modal, Text } from '@/shared/ui/atoms';
import { conPuntos } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { BotonUbicacion, CampoColores, CampoLogo } from '../components';
import { useCrearMarca, useEsperarSocio, useUbicacionComercio } from '../hooks';
import { LARGO_MAXIMO_MARCA } from '../schemas';

/**
 * Bienvenida, paso 2: la marca. Dos caminos, uno arriba del otro:
 *   - crear la propia (el que arranca el negocio), con su logo;
 *   - esperar a que el socio lo sume con su DNI (el que se suma a uno que ya
 *     existe). Si este creara su propia marca, despues no lo podrian sumar.
 *
 * No se bifurca movil/escritorio, igual que el login.
 */
export function CrearMarcaScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { usuario, cerrarSesion } = useSesion();
  const marca = useCrearMarca();
  const socio = useEsperarSocio();
  const ubicacion = useUbicacionComercio(marca.ponerDireccion);

  const icono = (Icono: typeof Store) => (
    <Icono size={18} color={theme.colors.textMuted} strokeWidth={1.9} />
  );

  const salir = (
    <Button label="Salir y entrar con otra cuenta" variant="ghost" onPress={cerrarSesion} />
  );

  // La marca ya existe y el logo no se guardo: no se vuelve al formulario
  // (crearla de nuevo daria "Ya tenes una marca").
  if (marca.logoFallido) {
    const { logoFallido } = marca;
    return (
      <PuertaBienvenida paso="marca">
        <AuthLayout
          titulo="Tu marca ya está creada"
          subtitulo="Falta el logo. Lo vas a necesitar para generar las facturas."
          footer={salir}
        >
          <Text variant="body" tone="error" accessibilityLiveRegion="polite">
            {logoFallido.mensaje}
          </Text>
          <CampoLogo
            uri={marca.logo.uri}
            eligiendo={marca.logo.eligiendo}
            aviso={marca.logo.aviso}
            fase={marca.logo.fase}
            progreso={marca.logo.progreso}
            onElegir={marca.logo.elegir}
            onQuitar={marca.logo.quitar}
          />
          {logoFallido.reintentable && marca.logo.uri ? (
            <Button
              label="Probar de nuevo"
              onPress={logoFallido.reintentar}
              loading={marca.cargando}
              size="lg"
              fullWidth
            />
          ) : null}
          <Button
            label="Seguir sin logo"
            variant={logoFallido.reintentable ? 'ghost' : 'primary'}
            onPress={logoFallido.seguirSinLogo}
            disabled={marca.cargando}
            fullWidth
          />
        </AuthLayout>
      </PuertaBienvenida>
    );
  }

  return (
    <PuertaBienvenida paso="marca">
      <AuthLayout
        titulo="¿Cómo se llama tu negocio?"
        subtitulo="Todo lo que cargues —clientes, tickets, pagos— queda en tu marca, y la ven todos sus dueños."
        error={marca.error}
        footer={salir}
      >
        <CampoControlado
          control={marca.form.control}
          name="nombre"
          label="Nombre"
          required
          placeholder="BebyRo"
          helperText="Va grande en las facturas que le mandás a tus clientes."
          autoCapitalize="words"
          maxLength={LARGO_MAXIMO_MARCA.nombre}
          returnKeyType="next"
          leftSlot={icono(Store)}
        />
        <CampoLogo
          uri={marca.logo.uri}
          eligiendo={marca.logo.eligiendo}
          aviso={marca.logo.aviso}
          fase={marca.logo.fase}
          progreso={marca.logo.progreso}
          onElegir={marca.logo.elegir}
          onQuitar={marca.logo.quitar}
        />
        <CampoControlado
          control={marca.form.control}
          name="direccion"
          label="Dirección"
          placeholder="Av. Siempreviva 742"
          autoCapitalize="sentences"
          maxLength={LARGO_MAXIMO_MARCA.direccion}
          returnKeyType="next"
          leftSlot={icono(MapPin)}
        />
        {/* La marca se crea casi siempre parado en el local: un toque y listo. */}
        <BotonUbicacion
          onPress={ubicacion.usar}
          buscando={ubicacion.buscando}
          aviso={ubicacion.aviso}
          onAbrirAjustes={ubicacion.abrirAjustes}
        />
        <CampoControlado
          control={marca.form.control}
          name="telefono"
          label="Teléfono"
          placeholder="11 4444-5555"
          keyboardType="phone-pad"
          maxLength={LARGO_MAXIMO_MARCA.telefono}
          returnKeyType="done"
          leftSlot={icono(Phone)}
        />
        {/* Tiñen el PDF. Arrancan con un par ya elegido, no con los de la app. */}
        <CampoColores nombreMarca={marca.nombre} colores={marca.colores} conEtiqueta />
        <Button
          label="Crear mi marca"
          onPress={marca.enviar}
          loading={marca.cargando}
          size="lg"
          fullWidth
        />

        <View style={styles.divisor} accessibilityElementsHidden importantForAccessibility="no">
          <View style={styles.linea} />
          <Text variant="caption" tone="muted">
            o
          </Text>
          <View style={styles.linea} />
        </View>

        {/* El otro camino: el DNI a la vista, grande, para dictarlo o mostrarlo. */}
        <View style={styles.socio}>
          <View style={styles.socioTitulo}>
            <Users size={18} color={theme.colors.primary} />
            <Text variant="body" weight="bold">
              ¿Tu socio ya tiene la marca creada?
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            Pasale tu DNI para que te sume. No crees una marca propia: después no te podría sumar.
          </Text>
          {usuario?.dni ? (
            <Text variant="heading" weight="bold" family="text" selectable>
              {conPuntos(usuario.dni)}
            </Text>
          ) : null}
          <Button
            label="Ya me sumó"
            variant="secondary"
            onPress={socio.comprobar}
            loading={socio.comprobando}
            fullWidth
          />
          {socio.aviso ? (
            <Text variant="caption" tone="warning" accessibilityLiveRegion="polite">
              {socio.aviso}
            </Text>
          ) : null}
        </View>
      </AuthLayout>

      {/* Sin logo se puede seguir, pero dicho en claro para que lo va a necesitar. */}
      <Modal
        visible={marca.sinLogo.visible}
        onClose={marca.sinLogo.cancelar}
        titulo="¿Seguir sin logo?"
        descripcion="Para generar las facturas vas a necesitar el logo de tu marca. Si ahora no lo tenés a mano, lo subís después desde Más → Mi marca."
        acciones={
          <>
            <Button label="Seguir sin logo" variant="ghost" onPress={marca.sinLogo.seguir} />
            <Button label="Elegir logo" onPress={marca.sinLogo.elegir} />
          </>
        }
      />
    </PuertaBienvenida>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    divisor: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    linea: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    socio: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    socioTitulo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  });
