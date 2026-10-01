import { useLocalSearchParams, useRouter } from 'expo-router';
import { MessageCircle, Receipt, ScrollText, Trophy } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { useRefrescar, useWhatsApp } from '@/shared/hooks';
import {
  Badge,
  Button,
  EstadoVacio,
  Pantalla,
  Text,
  type BadgeTone,
  type TextTone,
} from '@/shared/ui/atoms';
import { formatearFechaCorta, formatearMoneda, tonoCumplimiento } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import {
  BarraProporcion,
  CifraDestacada,
  DatoChico,
  GraficoBarras,
  type PuntoGrafico,
} from '../../components';
import {
  contar,
  diaYMes,
  formatearPorcentaje,
  mesCorto,
  textoDias,
  textoMesDeCumplimiento,
} from '../../formato';
import { limiteSugerido, usePerfilCliente } from '../../hooks';

/** El color del numero grande, con el mismo significado que tendria el chip. */
const TONO_TEXTO: Record<BadgeTone, TextTone> = {
  neutral: 'muted',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/**
 * El perfil de un cliente: por que es un buen cliente y cuanto vale.
 *
 * Se abre desde Mejores clientes. Responde tres cosas: que tan confiable es
 * (cumplimiento, racha, puesto), cuanto deja (comprado, cuanto pesa en las
 * ventas) y que compra. Y propone lo unico accionable: subirle el limite.
 */
export function PerfilClienteMovil() {
  const params = useLocalSearchParams<{ id: string; volver?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const consulta = usePerfilCliente(params.id);
  const refresco = useRefrescar(consulta.refrescar);
  const whatsapp = useWhatsApp();

  const labelVolver = params.volver ?? 'Métricas';
  const volver = () => router.back();

  /** El historial vive en este mismo stack: "atras" vuelve al perfil. */
  const irAlHistorial = () =>
    router.push({
      pathname: '/admin/cuenta/metricas/cliente/[id]',
      params: { id: params.id, volver: 'Perfil' },
    });

  /*
   * Editar y cargar un ticket viven en el tab de Clientes. `withAnchor` deja su
   * lista debajo: sin eso el tab queda con una pantalla suelta.
   */
  const irASubirLimite = () =>
    router.push(`/admin/clientes/${params.id}/editar`, { withAnchor: true });
  const irACargarTicket = () =>
    router.push(`/admin/clientes/${params.id}/ticket`, { withAnchor: true });

  const { perfil, mesElegido } = consulta;

  const puntos: PuntoGrafico[] = useMemo(
    () =>
      (perfil?.cumplimiento.porMes ?? []).map((mes) => ({
        clave: mes.mes,
        etiqueta: mesCorto(mes.mes),
        // Un mes sin facturas se dibuja en cero; el detalle dice que no hubo.
        valor: mes.cumplimientoPromedio ?? 0,
        descripcion: textoMesDeCumplimiento(mes),
      })),
    [perfil],
  );

  if (consulta.cargando && !refresco.refrescando) {
    return (
      <Pantalla titulo="Perfil" onVolver={volver} labelVolver={labelVolver}>
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Pantalla>
    );
  }

  if (!perfil) {
    return (
      <Pantalla titulo="Perfil" onVolver={volver} labelVolver={labelVolver}>
        <EstadoVacio
          icono={<Trophy size={theme.typography.size.heading} color={theme.colors.textMuted} />}
          titulo={
            consulta.sinServicio
              ? 'El perfil todavía no está disponible'
              : consulta.noExiste
                ? 'Este cliente no existe'
                : 'No pudimos traer el perfil'
          }
          descripcion={
            consulta.sinServicio
              ? 'Falta habilitarlo del lado del servidor. Mientras tanto, el historial tiene todo lo que compró y pagó.'
              : consulta.noExiste
                ? 'Puede que lo hayan dado de baja, o que el link esté mal.'
                : (consulta.error ?? 'Probá de nuevo en un rato.')
          }
          accion={
            consulta.sinServicio ? (
              <Button label="Ver historial completo" variant="secondary" onPress={irAlHistorial} />
            ) : consulta.noExiste ? (
              <Button label="Volver" variant="secondary" onPress={volver} />
            ) : (
              <Button label="Reintentar" variant="secondary" onPress={consulta.reintentar} />
            )
          }
        />
      </Pantalla>
    );
  }

  const { cliente, cumplimiento, ranking, valor, especies } = perfil;
  const sinHistorial = cumplimiento.evaluadas === 0 || cumplimiento.promedio === null;
  const sugerido = limiteSugerido(
    cliente.limiteCredito,
    { promedio: cumplimiento.promedio, evaluadas: cumplimiento.evaluadas },
    valor.ticketPromedio,
  );
  // Las barras van contra la especie que mas le vendio: la primera se ve llena.
  const maximo = Math.max(1, ...especies.map((e) => e.unidades));
  const telefono = cliente.telefono;

  return (
    <Pantalla
      titulo={cliente.nombre}
      descripcion={`Perfil · DNI ${cliente.dni}`}
      onVolver={volver}
      labelVolver={labelVolver}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={refresco.control}
      >
        {/* Con datos, un error de refresco no tapa nada: va como aviso arriba. */}
        {consulta.error ? (
          <Text variant="caption" tone="error">
            {consulta.error}
          </Text>
        ) : null}

        <CifraDestacada
          etiqueta="Cumplimiento"
          valor={sinHistorial ? '—' : formatearPorcentaje(cumplimiento.promedio)}
          tono={sinHistorial ? 'muted' : TONO_TEXTO[tonoCumplimiento(cumplimiento.promedio)]}
          detalle={
            sinHistorial
              ? 'Todavía no tiene facturas para juzgar'
              : `De ${contar(cumplimiento.evaluadas, 'factura', 'facturas')} · ${cumplimiento.aTiempo} en fecha · ${cumplimiento.tarde} tarde · ${cumplimiento.impagas} impagas`
          }
        >
          <View style={styles.chips}>
            {ranking.posicion === null ? (
              <Badge label="Sin historial" tone="neutral" />
            ) : (
              <Badge
                label={`Puesto ${ranking.posicion} de ${contar(ranking.clientes, 'cliente', 'clientes')}`}
                tone="primary"
              />
            )}
            {cumplimiento.rachaEnFecha > 0 ? (
              <Badge
                label={`${contar(cumplimiento.rachaEnFecha, 'factura seguida', 'facturas seguidas')} en fecha`}
                tone="success"
              />
            ) : null}
            {cumplimiento.diasPromedioDeAtraso === null ? (
              sinHistorial ? null : (
                <Badge label="Nunca pagó tarde" tone="success" />
              )
            ) : (
              <Badge
                label={`Cuando se atrasa, ${textoDias(cumplimiento.diasPromedioDeAtraso)}`}
                tone="warning"
              />
            )}
          </View>
        </CifraDestacada>

        {/* Lo único accionable de la pantalla: premiar al que cumple. */}
        {sugerido ? (
          <View style={styles.sugerencia}>
            <Text variant="body" weight="medium">
              Podés subirle el límite
            </Text>
            <Text variant="caption" tone="muted">
              {`Cumple ${formatearPorcentaje(cumplimiento.promedio)} en ${contar(cumplimiento.evaluadas, 'factura', 'facturas')} y su ticket promedio es ${valor.ticketPromedio === null ? '—' : formatearMoneda(valor.ticketPromedio)}. Hoy tiene ${formatearMoneda(cliente.limiteCredito)}: podrías llevarlo a ${formatearMoneda(sugerido)}.`}
            </Text>
            <Button label="Subir el límite" onPress={irASubirLimite} fullWidth />
          </View>
        ) : null}

        {puntos.length > 0 ? (
          <View style={styles.seccion}>
            <Text variant="title" weight="bold" accessibilityRole="header">
              Cómo viene cumpliendo
            </Text>
            <GraficoBarras
              puntos={puntos}
              tono="success"
              elegida={mesElegido?.mes ?? null}
              onElegir={consulta.elegirMes}
            />
            {mesElegido ? (
              <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">
                {textoMesDeCumplimiento(mesElegido)}
              </Text>
            ) : null}
            <Text variant="caption" tone="muted">
              El mes es el del vencimiento de cada factura, no el del pago.
            </Text>
          </View>
        ) : null}

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Cuánto vale
          </Text>
          <View style={styles.datos}>
            <DatoChico
              etiqueta="Te compró"
              valor={formatearMoneda(valor.comprado)}
              detalle={[
                contar(valor.tickets, 'ticket', 'tickets'),
                valor.ticketPromedio === null
                  ? null
                  : `promedio ${formatearMoneda(valor.ticketPromedio)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            <DatoChico
              etiqueta="De tus ventas"
              valor={formatearPorcentaje(valor.porcentajeDeLasVentas)}
              detalle="De todo lo que vendiste"
            />
            <DatoChico
              etiqueta="Se llevó fiado"
              valor={formatearMoneda(valor.fiado)}
              detalle={`${formatearPorcentaje(valor.porcentajeFiado)} de lo que compró`}
            />
            <DatoChico
              etiqueta="Hoy debe"
              valor={formatearMoneda(valor.saldo)}
              tono={valor.saldo > 0 ? 'default' : 'success'}
              detalle={valor.saldo > 0 ? 'En su factura en curso' : 'Está al día'}
            />
            <DatoChico
              etiqueta="Vuelve cada"
              valor={valor.diasEntreCompras === null ? '—' : textoDias(valor.diasEntreCompras)}
              detalle={
                valor.ultimaCompra
                  ? `Última compra ${diaYMes(valor.ultimaCompra.fecha) ?? ''}`
                  : 'Todavía no compró'
              }
            />
            <DatoChico
              etiqueta="Cliente desde"
              valor={formatearFechaCorta(valor.primeraCompra ?? cliente.createdAt) ?? '—'}
              detalle={
                valor.ultimoPago
                  ? `Último pago ${diaYMes(valor.ultimoPago.fecha) ?? ''}`
                  : 'Nunca pagó a cuenta'
              }
            />
          </View>
        </View>

        <View style={styles.seccion}>
          <Text variant="title" weight="bold" accessibilityRole="header">
            Qué compra
          </Text>
          <Text variant="caption" tone="muted">
            Sirve para avisarle cuando llega mercadería de lo que se lleva.
          </Text>
          {especies.length > 0 ? (
            especies.map((especie) => (
              <BarraProporcion
                key={especie.especie.id ?? especie.especie.nombre}
                etiqueta={especie.especie.nombre}
                valor={contar(especie.unidades, 'u.', 'u.')}
                detalle={`${formatearMoneda(especie.monto)} · ${formatearPorcentaje(especie.porcentajeUnidades)} de lo que compró`}
                proporcion={especie.unidades / maximo}
                tono={especie.especie.id ? 'primary' : 'neutral'}
              />
            ))
          ) : (
            <Text variant="body" tone="muted">
              Todavía no se le cargó ninguna compra.
            </Text>
          )}
        </View>

        <View style={styles.acciones}>
          {whatsapp.puedeAbrir(telefono) ? (
            <Button
              label="Escribirle por WhatsApp"
              variant="secondary"
              onPress={() => void whatsapp.abrir(telefono)}
              leftIcon={<MessageCircle size={16} color={theme.colors.primary} />}
              fullWidth
            />
          ) : null}
          <Button
            label="Cargar ticket"
            variant="secondary"
            onPress={irACargarTicket}
            leftIcon={<Receipt size={16} color={theme.colors.primary} />}
            fullWidth
          />
          <Button
            label="Ver historial completo"
            variant="ghost"
            onPress={irAlHistorial}
            leftIcon={<ScrollText size={16} color={theme.colors.primary} />}
            fullWidth
          />
          {whatsapp.error ? (
            <Text variant="caption" tone="error">
              {whatsapp.error}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    sugerencia: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    seccion: { gap: theme.spacing.sm },
    datos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    acciones: { gap: theme.spacing.sm, paddingTop: theme.spacing.sm },
  });
