import { useRouter } from 'expo-router';
import { Send, Smartphone } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { SelectorOpciones } from '@/features/metricas/components';
import type { Opcion } from '@/features/metricas/types';
import { TarjetaAviso } from '@/features/notificaciones/components';
import { PRESENTACION_TIPO, TIPOS_AVISO } from '@/features/notificaciones/tipos';
import { Button, CampoControlado, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { contar } from '@/shared/utils';
import { useTheme, type Theme } from '@/theme';

import { Seccion } from '../../components';
import { useNuevoAviso } from '../../hooks';
import { LARGO_MENSAJE_AVISO, LARGO_TITULO_AVISO } from '../../schemas';
import type { NuevoAvisoForm } from '../../types';

const TIPOS: readonly Opcion<NuevoAvisoForm['tipo']>[] = TIPOS_AVISO.map((tipo) => ({
  clave: tipo,
  etiqueta: PRESENTACION_TIPO[tipo].etiqueta,
}));

/**
 * Redactar un aviso: tipo, titulo y mensaje, con la vista previa de como va a
 * quedar, a cuantos telefonos le llega, la prueba a los telefonos propios y el
 * envio a todos (con confirmacion: no se puede deshacer).
 *
 * Es un formulario: no lleva el gesto de refrescar.
 */
export function NuevoAvisoMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const nuevo = useNuevoAviso();
  const { control } = nuevo.form;

  const alcance = nuevo.alcance
    ? `Le llega a ${contar(nuevo.alcance.dispositivos, 'teléfono', 'teléfonos')}`
    : nuevo.cargandoAlcance
      ? 'Calculando a cuántos teléfonos le llega…'
      : 'No pudimos calcular a cuántos teléfonos le llega.';

  return (
    <Pantalla
      titulo="Nuevo aviso"
      descripcion="Le llega como notificación a todos los que tienen la app."
      onVolver={() => router.back()}
      labelVolver="Avisos"
    >
      <KeyboardAvoidingView
        style={styles.teclado}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {nuevo.error ? (
            <Text variant="body" tone="error" accessibilityRole="alert">
              {nuevo.error}
            </Text>
          ) : null}

          <View style={styles.campo}>
            <Text variant="caption" weight="medium">
              Tipo
            </Text>
            <SelectorOpciones
              opciones={TIPOS}
              activa={nuevo.tipo}
              onCambiar={nuevo.elegirTipo}
              etiqueta="Tipo de aviso"
            />
            {nuevo.tipo === 'version' ? (
              <Text variant="caption" tone="muted">
                Al tocarla abre la tienda para actualizar.
              </Text>
            ) : null}
          </View>

          <CampoControlado
            control={control}
            name="titulo"
            label="Título"
            required
            placeholder="Mantenimiento el domingo"
            maxLength={LARGO_TITULO_AVISO}
            helperText={`${nuevo.titulo.length}/${LARGO_TITULO_AVISO} · corto y concreto`}
            returnKeyType="next"
          />
          <CampoControlado
            control={control}
            name="mensaje"
            label="Mensaje"
            required
            placeholder="Qué pasa, cuándo y qué tiene que hacer la persona."
            maxLength={LARGO_MENSAJE_AVISO}
            helperText={`${nuevo.mensaje.length}/${LARGO_MENSAJE_AVISO} · la notificación muestra ~2 líneas; completo se lee en Avisos`}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <Seccion titulo="Vista previa">
            <TarjetaAviso titulo={nuevo.titulo} mensaje={nuevo.mensaje} tipo={nuevo.tipo} />
            <Text variant="caption" tone="muted">
              {alcance}
            </Text>
          </Seccion>

          {nuevo.resultadoPrueba ? (
            <Text variant="caption" tone={nuevo.resultadoPrueba.tono} accessibilityRole="alert">
              {nuevo.resultadoPrueba.texto}
            </Text>
          ) : null}

          <Button
            label="Enviar prueba a mi teléfono"
            variant="secondary"
            onPress={nuevo.enviarPrueba}
            loading={nuevo.probando}
            leftIcon={<Smartphone size={16} color={theme.colors.primary} />}
            fullWidth
          />
          <Button
            label="Enviar a todos"
            onPress={nuevo.pedirConfirmacion}
            disabled={nuevo.enviando}
            leftIcon={<Send size={16} color={theme.colors.onPrimary} />}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={nuevo.confirmando}
        onClose={nuevo.cancelarConfirmacion}
        cerrarAlTocarFondo={!nuevo.enviando}
        titulo="¿Enviar a todos?"
        descripcion={
          nuevo.alcance
            ? `Se va a mandar a ${contar(nuevo.alcance.dispositivos, 'teléfono', 'teléfonos')} (${contar(nuevo.alcance.cuentas, 'cuenta', 'cuentas')} y ${nuevo.alcance.sinSesion} sin sesión). No se puede deshacer.`
            : 'Se va a mandar a todos los teléfonos con la app. No se puede deshacer.'
        }
        acciones={
          <>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={nuevo.cancelarConfirmacion}
              disabled={nuevo.enviando}
            />
            <Button label="Enviar" onPress={nuevo.confirmarEnvio} loading={nuevo.enviando} />
          </>
        }
      />
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    teclado: { flex: 1 },
    scroll: { gap: theme.spacing.md, paddingBottom: theme.spacing.xl },
    campo: { gap: theme.spacing.xs },
  });
