import { useRouter } from 'expo-router';
import { RefreshCw, Server } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { BarraProporcion } from '@/features/metricas/components';
import { useRefrescar } from '@/shared/hooks';
import { BotonIcono, Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { contar, formatearCantidad } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { Dato, FilaServicio, Seccion, TarjetaDatos } from '../../components';
import { formatearFechaHora, formatearMegas, haceCuanto, textoDuracion } from '../../formato';
import { useSistema } from '../../hooks';

/** Para que sirve cada servicio: lo que deja de andar si esta apagado. */
const SERVICIOS: Record<string, { nombre: string; descripcion: string }> = {
  email: { nombre: 'Email (SMTP)', descripcion: 'Recuperar contraseña y facturas por mail' },
  cloudinary: { nombre: 'Cloudinary', descripcion: 'Logos de las marcas' },
  google: { nombre: 'Google', descripcion: 'Iniciar sesión con Google' },
};

/**
 * El estado tecnico de la plataforma. Solo lectura: server, base, servicios y
 * que versiones de la app se estan usando. Nunca muestra secretos: de cada
 * servicio el backend dice solo si esta configurado.
 *
 * Las versiones van en barras (y no en torta): se leen mejor en un telefono, y
 * las bloqueadas van en rojo para decidir cuando subir la minima sin dejar a
 * mucha gente afuera.
 */
export function SistemaMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const sistema = useSistema();
  const refresco = useRefrescar(sistema.refrescar);

  const volver = () => router.back();
  const botonRefrescar = (
    <BotonIcono
      accessibilityLabel="Refrescar"
      onPress={sistema.refrescar}
      disabled={sistema.actualizando}
    >
      {sistema.actualizando && !refresco.refrescando ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <RefreshCw size={22} color={theme.colors.primary} strokeWidth={1.9} />
      )}
    </BotonIcono>
  );

  if (sistema.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Sistema" onVolver={volver} labelVolver="Más">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!sistema.sistema) {
    return (
      <Pantalla titulo="Sistema" onVolver={volver} labelVolver="Más">
        <EstadoVacio
          icono={<Server size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo="No pudimos traer el estado"
          descripcion={sistema.error ?? undefined}
          accion={<Button label="Reintentar" variant="secondary" onPress={sistema.reintentar} />}
        />
      </Pantalla>
    );
  }

  const { servidor, mongo, servicios, app } = sistema.sistema;
  const usuariosConVersion = app.versionesEnUso.reduce((suma, v) => suma + v.usuarios, 0);
  const bloqueados = app.versionesEnUso
    .filter((v) => v.bloqueada)
    .reduce((suma, v) => suma + v.usuarios, 0);
  const mongoConectado = mongo.estado === 'conectado';

  return (
    <Pantalla
      titulo="Sistema"
      descripcion={`Actualizado ${haceCuanto(sistema.sistema.generadoEl) ?? ''}`}
      onVolver={volver}
      labelVolver="Más"
      accion={botonRefrescar}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <Seccion titulo="Servicios">
          <View style={styles.tarjeta}>
            <FilaServicio
              nombre="Base de datos"
              descripcion={`${mongo.base} · ${mongo.estado}`}
              configurado={mongoConectado}
            />
            {Object.entries(servicios).map(([clave, configurado]) => (
              <FilaServicio
                key={clave}
                nombre={SERVICIOS[clave]?.nombre ?? clave}
                descripcion={SERVICIOS[clave]?.descripcion ?? 'Servicio externo'}
                configurado={configurado}
              />
            ))}
          </View>
        </Seccion>

        <Seccion
          titulo="Versiones de la app"
          descripcion="De quienes entraron en los últimos 30 días."
        >
          {app.versionesEnUso.length > 0 ? (
            app.versionesEnUso.map((version) => (
              <BarraProporcion
                key={version.version}
                etiqueta={
                  version.version === 'desconocida' ? 'Desconocida (web)' : `v${version.version}`
                }
                valor={contar(version.usuarios, 'cuenta', 'cuentas')}
                detalle={version.bloqueada ? 'Bloqueada: ya reciben "actualizá la app"' : undefined}
                proporcion={usuariosConVersion > 0 ? version.usuarios / usuariosConVersion : 0}
                tono={version.bloqueada ? 'error' : 'primary'}
              />
            ))
          ) : (
            <Text variant="caption" tone="muted">
              Nadie entró en los últimos 30 días.
            </Text>
          )}
          {bloqueados > 0 ? (
            <Text variant="caption" tone="error">
              {contar(bloqueados, 'cuenta usa', 'cuentas usan')} una versión por debajo de la
              mínima.
            </Text>
          ) : null}
          <TarjetaDatos>
            <Dato etiqueta="Versión mínima" valor={app.minima ?? 'Sin mínima'} mono />
            <Dato etiqueta="Última publicada" valor={app.ultima ?? 'Sin dato'} mono />
            <Dato
              etiqueta="Documentos legales vigentes"
              valor={app.versionDocumentosLegales ?? 'Sin dato'}
              mono
            />
          </TarjetaDatos>
        </Seccion>

        <Seccion titulo="Servidor">
          <TarjetaDatos>
            <Dato etiqueta="Entorno" valor={servidor.entorno} />
            <Dato etiqueta="Node" valor={servidor.node} mono />
            <Dato
              etiqueta="Encendido hace"
              valor={`${textoDuracion(servidor.uptimeSegundos)} · desde ${formatearFechaHora(servidor.iniciadoEl) ?? '—'}`}
            />
            <Dato
              etiqueta="Memoria"
              valor={`${formatearMegas(servidor.memoria.rssMb)} en uso · heap ${formatearMegas(servidor.memoria.heapUsadoMb)} de ${formatearMegas(servidor.memoria.heapTotalMb)}`}
            />
          </TarjetaDatos>
        </Seccion>

        <Seccion titulo="Base de datos">
          <TarjetaDatos>
            <Dato
              etiqueta="Estado"
              valor={mongo.estado}
              tono={mongoConectado ? 'success' : 'error'}
            />
            {mongo.tamano ? (
              <Dato
                etiqueta="Tamaño"
                valor={`Datos ${formatearMegas(mongo.tamano.datosMb)} · almacenamiento ${formatearMegas(mongo.tamano.almacenamientoMb)} · índices ${formatearMegas(mongo.tamano.indicesMb)}`}
              />
            ) : (
              <Dato etiqueta="Tamaño" valor="El plan no lo informa" />
            )}
            {mongo.colecciones.map((coleccion) => (
              <Dato
                key={coleccion.nombre}
                etiqueta={coleccion.nombre}
                valor={`${formatearCantidad(coleccion.documentos)} documentos · ${formatearMegas(coleccion.tamanoMb)}`}
              />
            ))}
          </TarjetaDatos>
        </Seccion>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    tarjeta: {
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
