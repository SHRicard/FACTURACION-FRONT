import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/ui/atoms';
import { formatearFecha } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import type { DocumentoLegal } from '../types';

interface CuerpoDocumentoProps {
  documento: DocumentoLegal;
  /** El titulo ya lo dibuja el encabezado de la pantalla: no se repite. */
  mostrarTitulo?: boolean;
}

/**
 * El texto de un documento legal: sus secciones, la version y el contacto.
 *
 * Lo comparten la pantalla del documento y la de aceptacion, que muestran lo
 * mismo con distinto marco alrededor. Es presentacion pura: recibe el documento
 * ya traido y no sabe de donde salio.
 */
export function CuerpoDocumento({ documento, mostrarTitulo = false }: CuerpoDocumentoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const actualizado = formatearFecha(documento.actualizadoEl) ?? documento.version;

  return (
    <View style={styles.cuerpo}>
      <View style={styles.encabezado}>
        {mostrarTitulo ? (
          <Text variant="title" weight="bold" accessibilityRole="header">
            {documento.titulo}
          </Text>
        ) : null}
        {/*
          La version es la fecha del texto y es la que queda registrada al
          aceptar: se muestra para que se pueda decir "acepte esta".
        */}
        <Text variant="caption" tone="muted">
          Versión {documento.version} · Actualizado el {actualizado}
        </Text>
      </View>

      {documento.secciones.map((seccion) => (
        <View key={seccion.titulo} style={styles.seccion}>
          <Text variant="body" weight="bold" accessibilityRole="header">
            {seccion.titulo}
          </Text>
          <Text variant="body" tone="muted">
            {seccion.contenido}
          </Text>
        </View>
      ))}

      {documento.contacto ? (
        <View style={styles.contacto}>
          <Text variant="caption" tone="muted">
            Dudas o reclamos: {documento.contacto}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cuerpo: { gap: theme.spacing.lg },
    encabezado: { gap: theme.spacing.xs },
    seccion: { gap: theme.spacing.xs },
    contacto: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
  });
