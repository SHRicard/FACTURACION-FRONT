import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { formatearMoneda } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { BLANCO_PAPEL, paletaFactura, TEXTO_PAPEL } from '../paleta';

interface VistaPreviaColoresProps {
  nombreMarca: string;
  /** Normalizados, o null (sin elegir, o a medio escribir). */
  primario: string | null;
  secundario: string | null;
}

/** Un saldo de ejemplo: la vista previa no muestra datos de nadie. */
const EJEMPLO = { cliente: 'Rosa Pérez', saldo: 66500, cobrado: 0.35 };

/**
 * El bloque de arriba del PDF con estos colores: lo primero que ve el cliente.
 * Usa la misma cuenta que el backend, asi que un amarillo se ve oscurecido en
 * el texto igual que va a salir impreso.
 *
 * El papel es blanco siempre, tambien en modo oscuro: es el PDF, no la app.
 */
export function VistaPreviaColores({ nombreMarca, primario, secundario }: VistaPreviaColoresProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const paleta = paletaFactura({ primario, secundario });

  return (
    <View
      style={styles.papel}
      accessible
      accessibilityLabel="Vista previa: así se ven tus colores en la factura"
    >
      <Text variant="title" weight="bold" numberOfLines={1} style={{ color: paleta.primario }}>
        {nombreMarca.trim() || 'Tu negocio'}
      </Text>

      <View style={[styles.bloque, { backgroundColor: paleta.panel, borderColor: paleta.borde }]}>
        <View style={styles.fila}>
          <Text variant="caption" style={styles.textoPapel} numberOfLines={1}>
            {EJEMPLO.cliente}
          </Text>
          <Text variant="caption" weight="bold" style={{ color: paleta.secundario }}>
            SALDO A PAGAR
          </Text>
        </View>
        <Text
          variant="heading"
          weight="bold"
          family="text"
          style={[styles.monto, { color: paleta.primario }]}
        >
          {formatearMoneda(EJEMPLO.saldo)}
        </Text>
        <View style={[styles.pista, { backgroundColor: paleta.borde }]}>
          <View
            style={[
              styles.relleno,
              { width: `${EJEMPLO.cobrado * 100}%`, backgroundColor: paleta.relleno },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    papel: {
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: BLANCO_PAPEL,
    },
    bloque: {
      gap: theme.spacing.xs,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
    },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    textoPapel: { flexShrink: 1, color: TEXTO_PAPEL },
    monto: { textAlign: 'right' },
    pista: { height: theme.spacing.sm, overflow: 'hidden', borderRadius: theme.radius.full },
    relleno: { height: '100%' },
  });
