import { useRouter } from 'expo-router';
import {
  HandCoins,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Store,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import {
  BotonIcono,
  Button,
  CampoControlado,
  EstadoVacio,
  Modal,
  Pantalla,
  Text,
} from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  AvatarIniciales,
  BotonUbicacion,
  CampoDni,
  EditarColores,
  FilaDueno,
  SeccionColores,
  SeccionLogo,
  TarjetaEstadistica,
  VistaPreviaLogo,
} from '../../components';
import {
  useColoresMarca,
  useEditarMarca,
  useIrmeDeMarca,
  useLogoMarca,
  useMiMarca,
  useSacarDueno,
  useSumarDueno,
  useUbicacionComercio,
} from '../../hooks';
import { LARGO_MAXIMO_MARCA } from '../../schemas';

/**
 * Mi marca: el negocio, lo que mueve, y quienes lo manejan.
 *
 * Arriba lo que se viene a mirar (los numeros), despues los duenos —todos
 * iguales: cualquiera suma, saca o edita— y abajo de todo, separado, irse.
 */
export function MiMarcaMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);

  const ficha = useMiMarca();
  const refresco = useRefrescar(ficha.refrescar);
  const sumar = useSumarDueno();
  const sacar = useSacarDueno();
  const irme = useIrmeDeMarca(ficha.miId);
  const edicion = useEditarMarca(ficha.marca);
  const ubicacion = useUbicacionComercio(edicion.ponerDireccion);
  const logo = useLogoMarca(ficha.marca);
  const colores = useColoresMarca(ficha.marca);

  const volver = () => router.back();

  if (ficha.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Mi marca" ancho="contenido" onVolver={volver} labelVolver="Mas">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!ficha.marca) {
    return (
      <Pantalla titulo="Mi marca" ancho="contenido" onVolver={volver} labelVolver="Mas">
        <EstadoVacio
          titulo="No pudimos traer tu marca"
          descripcion={ficha.error ?? undefined}
          accion={<Button label="Reintentar" variant="secondary" onPress={ficha.reintentar} />}
        />
      </Pantalla>
    );
  }

  const { marca } = ficha;
  const { estadisticas } = marca;
  const contacto = [marca.direccion, marca.telefono].filter(Boolean);

  return (
    <Pantalla
      titulo="Mi marca"
      ancho="contenido"
      onVolver={volver}
      labelVolver="Mas"
      accion={
        <BotonIcono accessibilityLabel="Editar los datos de la marca" onPress={edicion.abrir}>
          <Pencil size={22} color={theme.colors.primary} strokeWidth={1.9} />
        </BotonIcono>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
        keyboardShouldPersistTaps="handled"
      >
        {/* La marca como sale en las facturas: logo (o iniciales) y nombre. */}
        <View style={styles.cabecera}>
          <AvatarIniciales nombre={marca.nombre} imagen={marca.logoUrl} grande />
          <View style={styles.textos}>
            <Text variant="title" weight="bold" numberOfLines={2}>
              {marca.nombre}
            </Text>
            {marca.direccion ? (
              <View style={styles.dato}>
                <MapPin size={14} color={theme.colors.textMuted} />
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {marca.direccion}
                </Text>
              </View>
            ) : null}
            {marca.telefono ? (
              <View style={styles.dato}>
                <Phone size={14} color={theme.colors.textMuted} />
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {marca.telefono}
                </Text>
              </View>
            ) : null}
            {contacto.length === 0 ? (
              <Pressable
                onPress={edicion.abrir}
                accessibilityRole="button"
                hitSlop={theme.spacing.sm}
              >
                <Text variant="caption" weight="bold" tone="primary">
                  Agregar dirección y teléfono
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.grilla}>
          <TarjetaEstadistica
            icono={Users}
            etiqueta="Clientes"
            valor={String(estadisticas.cantidadClientes)}
          />
          <TarjetaEstadistica
            icono={Receipt}
            etiqueta="Vendido"
            valor={formatearMoneda(estadisticas.totalVendido)}
          />
          <TarjetaEstadistica
            icono={HandCoins}
            etiqueta="Cobrado"
            valor={formatearMoneda(estadisticas.totalCobrado)}
            tono="success"
          />
          <TarjetaEstadistica
            icono={Wallet}
            etiqueta="Le deben"
            valor={formatearMoneda(estadisticas.deudaPendiente)}
            tono={estadisticas.deudaPendiente > 0 ? 'warning' : 'default'}
          />
        </View>

        <SeccionLogo
          nombre={marca.nombre}
          logoUrl={marca.logoUrl}
          puedeSubir={logo.puedeSubir}
          eligiendo={logo.eligiendo}
          aviso={logo.aviso}
          onElegir={logo.elegir}
          onSacar={logo.pedirSacar}
        />

        {/* Los dos colores con que sale el PDF, y como se ve hoy. */}
        <SeccionColores
          nombreMarca={marca.nombre}
          colorPrimario={marca.colorPrimario}
          colorSecundario={marca.colorSecundario}
          onCambiar={colores.abrir}
        />
        <EditarColores nombreMarca={marca.nombre} edicion={colores} />

        <View style={styles.seccion}>
          <View style={styles.encabezado}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Dueños
            </Text>
            <Text variant="caption" tone="muted">
              {marca.duenos.length}
            </Text>
          </View>
          <Text variant="caption" tone="muted">
            Todos iguales: ven lo mismo, cargan en las mismas facturas y cualquiera suma o saca.
          </Text>

          <View style={styles.lista}>
            {marca.duenos.map((dueno, indice) => (
              <View key={dueno.id} style={indice > 0 ? styles.separador : undefined}>
                <FilaDueno
                  dueno={dueno}
                  esYo={dueno.id === ficha.miId}
                  // El unico dueno no se saca: la marca no queda sin duenos.
                  onSacar={ficha.unicoDueno ? undefined : sacar.pedirConfirmacion}
                />
              </View>
            ))}
          </View>

          {/* Sumar: entra al instante, si ya tiene cuenta con su DNI y no tiene marca. */}
          <View style={styles.sumar}>
            <CampoDni
              control={sumar.form.control}
              name="dni"
              label="Sumar un dueño por su DNI"
              helperText="Tiene que haberse registrado y cargado su DNI, sin crear una marca propia."
              onSubmitEditing={sumar.enviar}
            />
            <Button
              label="Sumar dueño"
              variant="secondary"
              onPress={sumar.enviar}
              loading={sumar.sumando}
              fullWidth
              leftIcon={<UserPlus size={16} color={theme.colors.primary} />}
            />
            {sumar.sumado ? (
              <Text variant="caption" tone="success" accessibilityLiveRegion="polite">
                {sumar.sumado}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Irse vive abajo y separado: no se deshace sin que otro te vuelva a sumar. */}
        <View style={styles.zonaIrse}>
          {ficha.unicoDueno ? (
            <Text variant="caption" tone="muted" center>
              Sos el único dueño: para irte, primero sumá a alguien.
            </Text>
          ) : (
            <>
              <Pressable
                onPress={irme.pedirConfirmacion}
                accessibilityRole="button"
                accessibilityLabel="Irme de la marca"
                style={({ pressed }) => [styles.botonIrse, pressed && styles.presionado]}
              >
                <LogOut size={18} color={theme.colors.error} />
                <Text weight="bold" tone="error">
                  Irme de la marca
                </Text>
              </Pressable>
              <Text variant="caption" tone="muted" center>
                Lo que cargaste queda en la marca. Vos quedás sin marca.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sacar a otro: se confirma con el nombre a la vista. */}
      <Modal
        visible={sacar.dueno !== null}
        onClose={sacar.cancelar}
        titulo={`¿Sacar a ${sacar.dueno?.nombre ?? ''}?`}
        descripcion="Deja de ver la marca en el momento. Lo que cargó queda, con su nombre."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={sacar.cancelar} />
            <Button
              label="Sacar"
              variant="danger"
              loading={sacar.sacando}
              onPress={sacar.confirmar}
            />
          </>
        }
      >
        {sacar.error ? (
          <Text variant="caption" tone="error">
            {sacar.error}
          </Text>
        ) : null}
      </Modal>

      {/* Irse: confirmacion fuerte, con lo que pasa dicho en claro. */}
      <Modal
        visible={irme.confirmando}
        onClose={irme.cancelar}
        titulo={`¿Irte de ${marca.nombre}?`}
        descripcion="No te llevás nada: los clientes, tickets y pagos que cargaste quedan en la marca. Vas a quedar sin marca, y para volver otro dueño te tiene que sumar."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={irme.cancelar} />
            <Button
              label="Irme"
              variant="danger"
              loading={irme.saliendo}
              onPress={irme.confirmar}
            />
          </>
        }
      >
        {irme.error ? (
          <Text variant="caption" tone="error">
            {irme.error}
          </Text>
        ) : null}
      </Modal>

      {/* Logo: la imagen elegida se ve antes de pisar la que hay. */}
      <Modal
        visible={logo.vistaPrevia !== null}
        onClose={logo.cancelar}
        titulo={marca.logoUrl ? '¿Cambiar el logo?' : '¿Usar este logo?'}
        descripcion="Sale en las facturas y en los mails que les mandás a tus clientes."
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              disabled={logo.fase !== 'quieto'}
              onPress={logo.cancelar}
            />
            <Button
              label="Guardar logo"
              loading={logo.fase !== 'quieto'}
              onPress={logo.confirmar}
            />
          </>
        }
      >
        {logo.vistaPrevia ? (
          <VistaPreviaLogo
            uri={logo.vistaPrevia.uri}
            fase={logo.fase}
            progreso={logo.progreso}
            error={logo.error}
          />
        ) : null}
      </Modal>

      <Modal
        visible={logo.confirmandoSacar}
        onClose={logo.cancelarSacar}
        titulo="¿Sacar el logo?"
        descripcion="Las facturas y los mails van a salir solo con el nombre de la marca. Lo podés volver a subir cuando quieras."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={logo.cancelarSacar} />
            <Button
              label="Sacar"
              variant="danger"
              loading={logo.sacando}
              onPress={logo.confirmarSacar}
            />
          </>
        }
      >
        {logo.errorSacar ? (
          <Text variant="caption" tone="error">
            {logo.errorSacar}
          </Text>
        ) : null}
      </Modal>

      {/* Editar los datos: los mismos tres campos del alta. */}
      <Modal
        visible={edicion.abierto}
        onClose={edicion.cerrar}
        titulo="Datos de la marca"
        descripcion="Salen en las facturas que les mandás a tus clientes."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={edicion.cerrar} />
            <Button label="Guardar" loading={edicion.guardando} onPress={edicion.enviar} />
          </>
        }
      >
        <View style={styles.formulario}>
          <CampoControlado
            control={edicion.form.control}
            name="nombre"
            label="Nombre"
            required
            autoCapitalize="words"
            maxLength={LARGO_MAXIMO_MARCA.nombre}
            leftSlot={<Store size={18} color={theme.colors.textMuted} strokeWidth={1.9} />}
          />
          <CampoControlado
            control={edicion.form.control}
            name="direccion"
            label="Dirección"
            placeholder="Vacío la borra"
            autoCapitalize="sentences"
            maxLength={LARGO_MAXIMO_MARCA.direccion}
            leftSlot={<MapPin size={18} color={theme.colors.textMuted} strokeWidth={1.9} />}
          />
          <BotonUbicacion
            onPress={ubicacion.usar}
            buscando={ubicacion.buscando}
            aviso={ubicacion.aviso}
            onAbrirAjustes={ubicacion.abrirAjustes}
          />
          <CampoControlado
            control={edicion.form.control}
            name="telefono"
            label="Teléfono"
            placeholder="Vacío lo borra"
            keyboardType="phone-pad"
            maxLength={LARGO_MAXIMO_MARCA.telefono}
            leftSlot={<Phone size={18} color={theme.colors.textMuted} strokeWidth={1.9} />}
          />
          {edicion.error ? (
            <Text variant="caption" tone="error">
              {edicion.error}
            </Text>
          ) : null}
        </View>
      </Modal>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    textos: { flex: 1, gap: theme.spacing.xs },
    dato: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
    grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    seccion: { gap: theme.spacing.sm },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    lista: {
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    separador: { borderTopWidth: 1, borderTopColor: theme.colors.border },
    sumar: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
    zonaIrse: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    botonIrse: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      minHeight: 48,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    presionado: { opacity: 0.6 },
    formulario: { gap: theme.spacing.md },
  });
