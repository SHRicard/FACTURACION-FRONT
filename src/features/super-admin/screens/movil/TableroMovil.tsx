import { useRouter } from 'expo-router';
import { Bug, ChartColumn, Hourglass, Store, TrendingUp, Users, Wallet } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, StyleSheet, View, type DimensionValue } from 'react-native';

import { TarjetaResumen } from '@/features/dashboard/components';
import { AvatarIniciales } from '@/features/marcas/components';
import { SelectorOpciones } from '@/features/metricas/components';
import { useBreakpoint, useRefrescar } from '@/shared/hooks';
import { Button, EstadoVacio, Pantalla, Text } from '@/shared/ui/atoms';
import { contar, formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { GraficoCrecimiento, Seccion } from '../../components';
import { haceCuanto } from '../../formato';
import { RANGOS_CRECIMIENTO, useTablero } from '../../hooks';

/**
 * Tablero: lo primero que ve el super_admin. Cuantas cuentas y marcas hay,
 * cuanta plata se mueve en la plataforma, si la app esta tirando errores y
 * quien se quedo trabado en el onboarding.
 *
 * Arriba los numeros, en el medio el crecimiento y abajo los ultimos
 * registros. Todo sale de `/admin/resumen`, salvo el grafico.
 */
export function TableroMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const { elegir } = useBreakpoint();
  const tablero = useTablero();
  const refresco = useRefrescar(tablero.refrescar);

  const anchoTarjeta = elegir<DimensionValue>({ sm: '100%', md: '48%', lg: '32%' });
  const tamanoIcono = theme.typography.size.body;
  const { resumen } = tablero;

  const irAUsuario = (id: string) =>
    router.push(`/super-admin/usuarios/${id}`, { withAnchor: true });
  const irAMarca = (id: string) => router.push(`/super-admin/marcas/${id}`, { withAnchor: true });

  if (tablero.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Tablero" descripcion="Toda la plataforma.">
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!resumen) {
    return (
      <Pantalla titulo="Tablero" descripcion="Toda la plataforma.">
        <EstadoVacio
          icono={
            <ChartColumn size={theme.typography.size.heading} color={theme.colors.textMuted} />
          }
          titulo="No pudimos traer el tablero"
          descripcion={tablero.error ?? 'Probá de nuevo en un rato.'}
          accion={<Button label="Reintentar" variant="secondary" onPress={tablero.reintentar} />}
        />
      </Pantalla>
    );
  }

  const { usuarios, marcas, negocio, errores, recientes } = resumen;
  const trabados = usuarios.pendientes.perfil + usuarios.pendientes.marca;

  return (
    <Pantalla titulo="Tablero" descripcion={`Actualizado ${haceCuanto(resumen.generadoEl) ?? ''}`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        <View style={styles.grilla}>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Cuentas de negocio"
              valor={String(usuarios.administradores)}
              detalle={`+${usuarios.nuevos.ultimos7d} esta semana · ${usuarios.activos.ultimos7d} activas`}
              icono={<Users size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Marcas"
              valor={String(marcas.total)}
              detalle={`${marcas.activas30d} activas · ${marcas.inactivas30d} dormidas`}
              icono={<Store size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Vendido (30 días)"
              valor={formatearMoneda(negocio.ultimos30d.vendido)}
              detalle={`${contar(negocio.ultimos30d.tickets, 'ticket', 'tickets')} · cobrado ${formatearMoneda(negocio.ultimos30d.cobrado)}`}
              icono={<TrendingUp size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Deuda en la calle"
              valor={formatearMoneda(negocio.historico.deudaPendiente)}
              detalle={contar(negocio.facturasVencidas, 'factura vencida', 'facturas vencidas')}
              icono={<Wallet size={tamanoIcono} color={theme.colors.textMuted} />}
            />
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Errores (24 h)"
              valor={String(errores.ultimas24h)}
              detalle={`${contar(errores.fatales7d, 'fatal', 'fatales')} en la semana · ${contar(errores.distintos7d, 'distinto', 'distintos')}`}
              tono={errores.fatales7d > 0 ? 'error' : 'default'}
              icono={
                <Bug
                  size={tamanoIcono}
                  color={errores.fatales7d > 0 ? theme.colors.error : theme.colors.textMuted}
                />
              }
            >
              <Button
                label="Ver errores"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/super-admin/errores')}
              />
            </TarjetaResumen>
          </View>
          <View style={{ width: anchoTarjeta }}>
            <TarjetaResumen
              etiqueta="Onboarding trabado"
              valor={String(trabados)}
              detalle="Se registraron y no arrancaron"
              tono={trabados > 0 ? 'warning' : 'default'}
              icono={<Hourglass size={tamanoIcono} color={theme.colors.textMuted} />}
            >
              <Text variant="caption" tone="muted">
                {usuarios.pendientes.perfil} sin DNI · {usuarios.pendientes.marca} sin marca ·{' '}
                {usuarios.pendientes.terminos} sin aceptar términos
              </Text>
            </TarjetaResumen>
          </View>
        </View>

        <Seccion
          titulo="Crecimiento"
          descripcion="Contado por fecha de carga: mide el uso de la plataforma."
        >
          <SelectorOpciones
            opciones={RANGOS_CRECIMIENTO}
            activa={tablero.rango}
            onCambiar={tablero.setRango}
            etiqueta="Rango del gráfico"
          />
          {tablero.crecimiento ? (
            <GraficoCrecimiento crecimiento={tablero.crecimiento} />
          ) : tablero.cargandoCrecimiento ? (
            <View style={styles.grafico}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <Text variant="caption" tone="error">
              {tablero.errorCrecimiento ?? 'No pudimos traer el gráfico.'}
            </Text>
          )}
        </Seccion>

        <Seccion titulo="En números" descripcion="Suma de todas las marcas, desde siempre.">
          <Text variant="body">
            Vendido {formatearMoneda(negocio.historico.vendido)} · cobrado{' '}
            {formatearMoneda(negocio.historico.cobrado)}
          </Text>
          <Text variant="caption" tone="muted">
            {contar(negocio.clientes, 'cliente', 'clientes')} ·{' '}
            {contar(negocio.facturasConDeuda, 'factura con deuda', 'facturas con deuda')} ·{' '}
            {contar(usuarios.suspendidos, 'cuenta suspendida', 'cuentas suspendidas')} ·{' '}
            {contar(usuarios.superAdmins, 'super admin', 'super admins')}
          </Text>
        </Seccion>

        {recientes.usuarios.length > 0 ? (
          <Seccion titulo="Últimas cuentas">
            {recientes.usuarios.map((usuario) => (
              <View key={usuario.id} style={styles.reciente}>
                <AvatarIniciales nombre={usuario.nombre} imagen={usuario.avatar ?? undefined} />
                <View style={styles.textos}>
                  <Text
                    variant="body"
                    weight="medium"
                    tone="primary"
                    numberOfLines={1}
                    onPress={() => irAUsuario(usuario.id)}
                    accessibilityRole="link"
                  >
                    {usuario.nombre}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {[usuario.email, usuario.marca?.nombre].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text variant="caption" tone="muted">
                  {haceCuanto(usuario.createdAt)}
                </Text>
              </View>
            ))}
          </Seccion>
        ) : null}

        {recientes.marcas.length > 0 ? (
          <Seccion titulo="Últimas marcas">
            {recientes.marcas.map((marca) => (
              <View key={marca.id} style={styles.reciente}>
                <AvatarIniciales nombre={marca.nombre} imagen={marca.logoUrl ?? undefined} />
                <View style={styles.textos}>
                  <Text
                    variant="body"
                    weight="medium"
                    tone="primary"
                    numberOfLines={1}
                    onPress={() => irAMarca(marca.id)}
                    accessibilityRole="link"
                  >
                    {marca.nombre}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {contar(marca.estadisticas.cantidadClientes, 'cliente', 'clientes')} · vendió{' '}
                    {formatearMoneda(marca.estadisticas.totalVendido)}
                  </Text>
                </View>
                <Text variant="caption" tone="muted">
                  {haceCuanto(marca.createdAt)}
                </Text>
              </View>
            ))}
          </Seccion>
        ) : null}
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.lg, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    grafico: { minHeight: theme.spacing.xxl * 2, alignItems: 'center', justifyContent: 'center' },
    reciente: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    textos: { flex: 1, gap: 2 },
  });
