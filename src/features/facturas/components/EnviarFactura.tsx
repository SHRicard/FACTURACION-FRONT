import { FileText, Link2Off, Mail, MessageCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, CampoControlado, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import type { useEnviarFactura } from '../hooks/useEnviarFactura';
import { LARGO_MAXIMO_MENSAJE_MAIL } from '../schemas';

interface EnviarFacturaProps {
  envio: ReturnType<typeof useEnviarFactura>;
  /** Lleva a Mi marca, a subir el logo que falta. */
  onSubirLogo: () => void;
}

/**
 * Mandarle la factura al cliente. Lo principal es "Generar factura": arma el
 * PDF con la marca y abre el menu de compartir nativo (WhatsApp, Gmail, Drive).
 * Abajo, los dos atajos que no pasan por un archivo: el link por WhatsApp y el
 * mail que manda el servidor.
 */
export function EnviarFactura({ envio, onSubirLogo }: EnviarFacturaProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.seccion}>
        <Text variant="title" weight="bold" accessibilityRole="header">
          Mandar la factura
        </Text>
        <Text variant="caption" tone="muted">
          Sale con el nombre y el logo de tu marca, y con el saldo al día.
        </Text>

        <Button
          label="Generar factura"
          onPress={envio.generar}
          loading={envio.generando}
          disabled={envio.ocupado && !envio.generando}
          size="lg"
          fullWidth
          leftIcon={<FileText size={18} color={theme.colors.onPrimary} />}
        />
        <Text variant="caption" tone="muted" center>
          Arma el PDF y abre el menú de compartir del celular.
        </Text>

        <View style={styles.fila}>
          <Button
            label="WhatsApp"
            variant="secondary"
            onPress={envio.porWhatsApp}
            loading={envio.armandoEnlace}
            disabled={envio.ocupado && !envio.armandoEnlace}
            leftIcon={<MessageCircle size={16} color={theme.colors.primary} />}
            accessibilityLabel="Mandar el link por WhatsApp"
            style={styles.flexible}
          />
          <Button
            label="Mail"
            variant="secondary"
            onPress={envio.porMail}
            disabled={envio.ocupado}
            leftIcon={<Mail size={16} color={theme.colors.primary} />}
            accessibilityLabel="Mandar por mail"
            style={styles.flexible}
          />
        </View>

        {envio.aviso ? (
          <Text variant="caption" tone={envio.aviso.tono} accessibilityLiveRegion="polite">
            {envio.aviso.texto}
          </Text>
        ) : null}

        {/* Secundario a proposito: es para cuando se mando a quien no era. */}
        <Pressable
          onPress={envio.baja.pedir}
          accessibilityRole="button"
          hitSlop={theme.spacing.xs}
          style={({ pressed }) => [styles.baja, pressed && styles.presionado]}
        >
          <Link2Off size={14} color={theme.colors.textMuted} />
          <Text variant="caption" weight="bold" tone="muted">
            Dar de baja los links mandados
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={envio.pidiendoLogo}
        onClose={envio.cerrarPedidoLogo}
        titulo="Falta el logo de tu marca"
        descripcion="Para generar la factura necesitás el logo: es lo primero que ve tu cliente. Subilo desde Mi marca y volvé."
        acciones={
          <>
            <Button label="Ahora no" variant="ghost" onPress={envio.cerrarPedidoLogo} />
            <Button
              label="Subir logo"
              onPress={() => {
                envio.cerrarPedidoLogo();
                onSubirLogo();
              }}
            />
          </>
        }
      />

      <Modal
        visible={envio.sinCelular}
        onClose={envio.cancelarSinCelular}
        titulo="No tenemos su celular"
        descripcion="El cliente no tiene un celular cargado que sirva para WhatsApp. Se abre con el mensaje escrito y elegís el contacto a mano."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={envio.cancelarSinCelular} />
            <Button label="Abrir WhatsApp" onPress={envio.seguirSinCelular} />
          </>
        }
      />

      <Modal
        visible={envio.mail.abierto}
        onClose={envio.mail.cerrar}
        titulo="Mandar por mail"
        descripcion="Le llega con el PDF adjunto. Si te responde, el mail te llega a vos."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={envio.mail.cerrar} />
            <Button label="Enviar" loading={envio.mail.enviando} onPress={envio.mail.enviar} />
          </>
        }
      >
        <View style={styles.formulario}>
          <CampoControlado
            control={envio.mail.form.control}
            name="email"
            label="Email"
            placeholder="rosa@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            helperText={
              envio.mail.emailCliente
                ? 'Es el del cliente. Si lo cambiás acá, no se guarda en su ficha.'
                : 'El cliente no tiene email cargado: escribí a dónde mandarla.'
            }
          />
          <CampoControlado
            control={envio.mail.form.control}
            name="mensaje"
            label="Mensaje (opcional)"
            placeholder="Cualquier cosa avisame"
            autoCapitalize="sentences"
            multiline
            maxLength={LARGO_MAXIMO_MENSAJE_MAIL}
          />
          {envio.mail.error ? (
            <Text variant="caption" tone="error">
              {envio.mail.error}
            </Text>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={envio.baja.confirmando}
        onClose={envio.baja.cancelar}
        titulo="¿Dar de baja los links?"
        descripcion="Los links de esta factura que ya mandaste dejan de abrir en el momento. Los que generes después andan normal."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={envio.baja.cancelar} />
            <Button
              label="Dar de baja"
              variant="danger"
              loading={envio.baja.dandoDeBaja}
              onPress={envio.baja.confirmar}
            />
          </>
        }
      />
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    seccion: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    fila: { flexDirection: 'row', gap: theme.spacing.sm },
    flexible: { flex: 1 },
    baja: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      minHeight: 32,
    },
    presionado: { opacity: 0.5 },
    formulario: { gap: theme.spacing.md },
  });
