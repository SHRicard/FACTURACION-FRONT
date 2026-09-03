import { Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/shared/hooks';
import { Badge, Button, Container, Input, InputField, Modal, Text } from '@/shared/ui/atoms';
import type { BadgeTone, ButtonSize, ButtonVariant } from '@/shared/ui/atoms';
import { useTheme, useThemeMode, type Theme } from '@/theme';

import { Muestra } from '../components/Muestra';
import { Seccion } from '../components/Seccion';

const VARIANTES_BOTON: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const TAMANOS_BOTON: ButtonSize[] = ['sm', 'md', 'lg'];
const TONOS_BADGE: BadgeTone[] = ['neutral', 'primary', 'success', 'error', 'warning'];

/**
 * Catalogo vivo del design system.
 *
 * Miralo ANTES de crear un componente nuevo: si lo que necesitas ya esta aca,
 * no lo vuelvas a inventar. Todo lo que se ve sale de los tokens del theme, asi
 * que cambiar a modo oscuro reestiliza la pantalla entera sola.
 */
export function DesignSystemScreen() {
  const theme = useTheme();
  const { colorScheme, toggleMode } = useThemeMode();
  const { breakpoint, ancho } = useBreakpoint();
  const styles = createStyles(theme);

  const [texto, setTexto] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Container ancho="contenido" style={styles.contenido}>
          <View style={styles.titulo}>
            <Text variant="heading" weight="bold" accessibilityRole="header">
              Design System
            </Text>
            <Text variant="caption" tone="muted">
              Todos los tokens y atoms de la app. Modo actual: {colorScheme}.
            </Text>
            <Button
              label={`Ver en modo ${colorScheme === 'dark' ? 'claro' : 'oscuro'}`}
              variant="secondary"
              size="sm"
              onPress={toggleMode}
            />
          </View>

          {/* ─────────── TOKENS ─────────── */}

          <Seccion titulo="Colores" descripcion="Tokens semanticos. Nunca uses primitivos.">
            {Object.entries(theme.colors).map(([nombre, valor]) => (
              <View key={nombre} style={styles.filaColor}>
                <View style={[styles.chip, { backgroundColor: valor }]} />
                <View style={styles.flex}>
                  <Text variant="body" weight="medium">
                    {nombre}
                  </Text>
                  <Text variant="caption" tone="muted" style={styles.mono}>
                    {valor}
                  </Text>
                </View>
              </View>
            ))}
          </Seccion>

          <Seccion titulo="Espaciado" descripcion="Escala base 4/8. Nunca numeros sueltos.">
            {Object.entries(theme.spacing).map(([nombre, valor]) => (
              <View key={nombre} style={styles.filaToken}>
                <Text variant="caption" tone="muted" style={styles.etiquetaToken}>
                  {nombre} · {valor}
                </Text>
                <View style={[styles.barra, { width: valor }]} />
              </View>
            ))}
          </Seccion>

          <Seccion titulo="Radios">
            {Object.entries(theme.radius).map(([nombre, valor]) => (
              <View key={nombre} style={styles.filaToken}>
                <Text variant="caption" tone="muted" style={styles.etiquetaToken}>
                  {nombre} · {valor}
                </Text>
                <View style={[styles.cajaRadio, { borderRadius: valor }]} />
              </View>
            ))}
          </Seccion>

          <Seccion
            titulo="Tipografia"
            descripcion="Poppins para titulos, Inter para texto y datos. Cada peso es un archivo distinto."
          >
            <Muestra codigo='variant="heading" → Poppins Bold'>
              <Text variant="heading" weight="bold">
                Poppins Bold
              </Text>
            </Muestra>
            <Muestra codigo='variant="title" → Poppins SemiBold'>
              <Text variant="title">Poppins SemiBold</Text>
            </Muestra>
            <Muestra codigo='variant="body" → Inter Regular'>
              <Text variant="body">Inter Regular — el texto corriente de la app.</Text>
            </Muestra>
            <Muestra codigo='variant="body" weight="medium" → Inter Medium'>
              <Text variant="body" weight="medium">
                Inter Medium — para destacar sin gritar.
              </Text>
            </Muestra>
            <Muestra codigo='variant="body" weight="bold" → Inter Bold'>
              <Text variant="body" weight="bold">
                Inter Bold
              </Text>
            </Muestra>
            <Muestra codigo="Inter tiene cifras tabulares: los montos alinean">
              <View>
                <Text variant="body">$ 1.234.567,89</Text>
                <Text variant="body">$&nbsp;&nbsp;&nbsp;&nbsp;98.400,00</Text>
                <Text variant="body">$ 1.002.930,50</Text>
              </View>
            </Muestra>
          </Seccion>

          {/* ─────────── ATOMS ─────────── */}

          <Seccion titulo="Text" descripcion="Unico lugar donde se define tamano, peso y color.">
            <Muestra codigo='<Text variant="heading" weight="bold" />'>
              <Text variant="heading" weight="bold">
                Heading
              </Text>
            </Muestra>
            <Muestra codigo='<Text variant="title" weight="bold" />'>
              <Text variant="title" weight="bold">
                Title
              </Text>
            </Muestra>
            <Muestra codigo='<Text variant="body" />'>
              <Text variant="body">Body — el texto por defecto de la app.</Text>
            </Muestra>
            <Muestra codigo='<Text variant="caption" tone="muted" />'>
              <Text variant="caption" tone="muted">
                Caption — para ayudas y metadatos.
              </Text>
            </Muestra>
            <Muestra codigo='tone="primary" | "error" | "success" | "warning"'>
              <View style={styles.filaTonos}>
                <Text tone="primary">primary</Text>
                <Text tone="error">error</Text>
                <Text tone="success">success</Text>
                <Text tone="warning">warning</Text>
              </View>
            </Muestra>
          </Seccion>

          <Seccion
            titulo="Button"
            descripcion="4 variantes x 3 tamanos, con estados de carga y bloqueo."
          >
            {VARIANTES_BOTON.map((variante) => (
              <Muestra key={variante} codigo={`<Button variant="${variante}" />`}>
                <Button label={variante} variant={variante} onPress={() => {}} />
              </Muestra>
            ))}

            {TAMANOS_BOTON.map((tamano) => (
              <Muestra key={tamano} codigo={`<Button size="${tamano}" />`}>
                <Button label={`size ${tamano}`} size={tamano} onPress={() => {}} />
              </Muestra>
            ))}

            <Muestra codigo="<Button loading />">
              <Button label="Cargando" loading onPress={() => {}} />
            </Muestra>
            <Muestra codigo="<Button disabled />">
              <Button label="Deshabilitado" disabled onPress={() => {}} />
            </Muestra>
            <Muestra codigo="<Button leftIcon={<Plus />} fullWidth />">
              <Button
                label="Con icono"
                fullWidth
                leftIcon={<Plus size={18} color={theme.colors.onPrimary} />}
                onPress={() => {}}
              />
            </Muestra>
            <Muestra codigo='<Button variant="danger" leftIcon={<Trash2 />} />'>
              <Button
                label="Eliminar"
                variant="danger"
                leftIcon={<Trash2 size={18} color={theme.colors.onPrimary} />}
                onPress={() => {}}
              />
            </Muestra>
          </Seccion>

          <Seccion
            titulo="Input"
            descripcion="Campo crudo. No muestra label ni error: de eso se ocupa InputField."
          >
            <Muestra codigo="<Input placeholder />">
              <Input placeholder="Escribi algo..." value={texto} onChangeText={setTexto} />
            </Muestra>
            <Muestra codigo="<Input hasError />">
              <Input placeholder="Con error" hasError />
            </Muestra>
            <Muestra codigo="<Input disabled />">
              <Input placeholder="Deshabilitado" disabled />
            </Muestra>
          </Seccion>

          <Seccion
            titulo="InputField"
            descripcion="Lo que se usa en los formularios: label + campo + error/ayuda."
          >
            <Muestra codigo="<InputField label required />">
              <InputField label="Email" required placeholder="tu@email.com" />
            </Muestra>
            <Muestra codigo="<InputField helperText />">
              <InputField
                label="Nombre"
                placeholder="Tu nombre"
                helperText="Como aparece en tus facturas."
              />
            </Muestra>
            <Muestra codigo="<InputField error />">
              <InputField
                label="Email"
                placeholder="tu@email.com"
                error="Ingresa un email valido"
              />
            </Muestra>
            <Muestra codigo="<InputField secureTextEntry />">
              <InputField label="Contrasena" placeholder="Tocá el ojo" secureTextEntry />
            </Muestra>
          </Seccion>

          <Seccion titulo="Badge">
            <View style={styles.filaBadges}>
              {TONOS_BADGE.map((tono) => (
                <Badge key={tono} label={tono} tone={tono} />
              ))}
            </View>
          </Seccion>

          <Seccion
            titulo="Modal"
            descripcion="Dialogo centrado. Cierra con la X, tocando el fondo o con el boton atras."
          >
            <Muestra codigo="<Modal visible onClose titulo acciones />">
              <Button label="Abrir modal" onPress={() => setModalAbierto(true)} />
            </Muestra>
          </Seccion>

          <Seccion
            titulo="Responsive"
            descripcion="La app reacciona al ANCHO DE VENTANA, nunca a la plataforma. Redimensiona el navegador o rota el telefono y mira como cambia."
          >
            <Muestra codigo="const { breakpoint, ancho } = useBreakpoint()">
              <View style={styles.filaBadges}>
                <Badge label={`breakpoint: ${breakpoint}`} tone="primary" />
                <Badge label={`${Math.round(ancho)} px`} tone="neutral" />
              </View>
            </Muestra>

            {Object.entries(theme.layout.breakpoints).map(([nombre, minimo]) => (
              <Muestra key={nombre} codigo={`${nombre} → desde ${minimo}px`}>
                <Badge label={nombre} tone={nombre === breakpoint ? 'success' : 'neutral'} />
              </Muestra>
            ))}

            <Muestra codigo='<Container ancho="formulario" | "contenido" | "ancho" />'>
              <View style={styles.filaToken}>
                {Object.entries(theme.layout.maxWidth)
                  .filter(([nombre]) => nombre !== 'completo')
                  .map(([nombre, valor]) => (
                    <View key={nombre} style={styles.filaToken}>
                      <Text variant="caption" tone="muted" style={styles.etiquetaToken}>
                        {nombre} · max {valor}px
                      </Text>
                      <View
                        style={[
                          styles.barra,
                          { width: Math.min(valor / 4, 240), backgroundColor: theme.colors.border },
                        ]}
                      />
                    </View>
                  ))}
              </View>
            </Muestra>
          </Seccion>
        </Container>
      </ScrollView>

      <Modal
        visible={modalAbierto}
        onClose={() => setModalAbierto(false)}
        titulo="Eliminar factura"
        descripcion="Esta accion no se puede deshacer."
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={() => setModalAbierto(false)} />
            <Button label="Eliminar" variant="danger" onPress={() => setModalAbierto(false)} />
          </>
        }
      >
        <Text variant="body" tone="muted">
          El contenido del modal es libre: podes meter texto, un formulario o lo que necesites.
        </Text>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingVertical: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    contenido: { gap: theme.spacing.xl },
    titulo: { gap: theme.spacing.sm, alignItems: 'flex-start' },
    flex: { flex: 1 },
    mono: { fontFamily: 'monospace' },

    filaColor: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    chip: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    filaToken: { gap: theme.spacing.xs },
    etiquetaToken: { fontFamily: 'monospace' },
    barra: { height: 12, borderRadius: theme.radius.sm, backgroundColor: theme.colors.primary },
    cajaRadio: {
      width: 56,
      height: 40,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },

    filaTonos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    filaBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  });
