import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Input, Modal, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

/**
 * Las terminaciones que se ofrecen, de la mas comun a la menos. Cubren casi
 * todos los mails de un cliente de mostrador; el resto entra por "Otro".
 */
export const DOMINIOS_EMAIL = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com.ar',
  'yahoo.com',
  'icloud.com',
  'live.com',
] as const;

/** Marca de "escribo yo la terminacion". No es un dominio. */
const OTRO = 'otro';

interface Partes {
  /** Lo que va antes de la @. */
  usuario: string;
  /** Uno de `DOMINIOS_EMAIL`, u `OTRO`. */
  dominio: string;
  /** La terminacion escrita a mano. Solo cuenta con `OTRO`. */
  propio: string;
}

/** Un dominio escrito, ubicado en la lista o como "Otro". */
function ubicarDominio(dominio: string): Pick<Partes, 'dominio' | 'propio'> {
  const conocido = DOMINIOS_EMAIL.find((opcion) => opcion === dominio.toLowerCase());
  return conocido ? { dominio: conocido, propio: '' } : { dominio: OTRO, propio: dominio };
}

/** `'ana@gmail.com'` -> `{ usuario: 'ana', dominio: 'gmail.com' }`. */
function separar(email: string): Partes {
  const arroba = email.indexOf('@');
  if (arroba === -1) return { usuario: email, dominio: DOMINIOS_EMAIL[0], propio: '' };
  return { usuario: email.slice(0, arroba), ...ubicarDominio(email.slice(arroba + 1)) };
}

/**
 * Las partes, unidas en el mail que se guarda. Sin usuario queda vacio: el
 * email es opcional y un `@gmail.com` solo no es un mail.
 */
function unir({ usuario, dominio, propio }: Partes): string {
  if (!usuario) return '';
  const terminacion = dominio === OTRO ? propio : dominio;
  return terminacion ? `${usuario}@${terminacion}` : usuario;
}

interface CampoEmailProps {
  /** El mail completo: es lo que guarda el formulario y valida el schema. */
  valor: string;
  onCambiar: (email: string) => void;
  onBlur?: () => void;
  error?: string;
}

/**
 * El email en dos partes: lo de antes de la @ se escribe, la terminacion se
 * elige de una lista. Nadie tiene que tipear "@hotmail.com" en el teclado del
 * celular, que es donde se cuelan los "hotmial".
 *
 * Hacia afuera sigue siendo UN campo con el mail entero, asi el schema y el body
 * de la API no se enteran de que en pantalla esta partido.
 */
export function CampoEmail({ valor, onCambiar, onBlur, error }: CampoEmailProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [partes, setPartes] = useState<Partes>(() => separar(valor));
  const [eligiendo, setEligiendo] = useState(false);

  /*
   * El valor puede cambiar desde afuera: en la edicion el cliente llega despues
   * del primer render. Se ajusta durante el render (no en un efecto, que
   * dibujaria una vez con las partes viejas) y solo si no es lo que ya se armo
   * aca, para no pisar la terminacion elegida mientras el usuario esta vacio.
   */
  const [valorPrevio, setValorPrevio] = useState(valor);
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    if (unir(partes) !== valor) setPartes(separar(valor));
  }

  const cambiar = (nuevas: Partes) => {
    setPartes(nuevas);
    onCambiar(unir(nuevas));
  };

  /**
   * Lo de antes de la @. Si se escribe la @ por costumbre, en vez de dejarla
   * se abre la lista de terminaciones; si se pega un mail entero, se reparte
   * solo en las dos partes.
   */
  const escribirUsuario = (texto: string) => {
    const limpio = texto.replace(/\s/g, '');
    const arroba = limpio.indexOf('@');

    if (arroba === -1) {
      cambiar({ ...partes, usuario: limpio });
      return;
    }

    const usuario = limpio.slice(0, arroba);
    const resto = limpio.slice(arroba + 1);
    if (resto) {
      cambiar({ usuario, ...ubicarDominio(resto) });
    } else {
      cambiar({ ...partes, usuario });
      setEligiendo(true);
    }
  };

  const elegir = (dominio: string) => {
    cambiar({ ...partes, dominio, propio: dominio === OTRO ? partes.propio : '' });
    setEligiendo(false);
  };

  const esOtro = partes.dominio === OTRO;
  const completo = unir(partes);

  return (
    <View style={styles.campo}>
      {/* Misma etiqueta que `InputField`: al lado de los otros campos tiene que
          verse igual, rojo incluido cuando hay error. */}
      <Text variant="caption" weight="medium" tone={error ? 'error' : 'muted'}>
        Email
      </Text>

      <View style={styles.fila}>
        <View style={styles.usuario}>
          <Input
            value={partes.usuario}
            onChangeText={escribirUsuario}
            onBlur={onBlur}
            hasError={Boolean(error)}
            placeholder="correo.v2"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            returnKeyType="next"
            accessibilityLabel="Email: lo que va antes de la arroba"
          />
        </View>

        <Pressable
          onPress={() => setEligiendo(true)}
          style={({ pressed }) => [styles.selector, pressed && styles.presionado]}
          accessibilityRole="button"
          accessibilityLabel={`Terminación del email: ${esOtro ? 'otra' : partes.dominio}`}
        >
          <Text variant="body" tone="muted">
            @
          </Text>
          <Text variant="body" numberOfLines={1} style={styles.dominio}>
            {esOtro ? 'otro' : partes.dominio}
          </Text>
          <ChevronDown size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      {esOtro ? (
        <Input
          value={partes.propio}
          onChangeText={(texto) =>
            cambiar({ ...partes, propio: texto.replace(/[\s@]/g, '').toLowerCase() })
          }
          onBlur={onBlur}
          hasError={Boolean(error)}
          placeholder="empresa.com.ar"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          accessibilityLabel="Terminación del email, después de la arroba"
          leftSlot={
            <Text variant="body" tone="muted">
              @
            </Text>
          }
        />
      ) : null}

      {error ? (
        <Text variant="caption" tone="error">
          {error}
        </Text>
      ) : completo ? (
        // El mail armado a la vista: es lo que se guarda, y deja ver un error
        // de tipeo antes de mandarlo.
        <Text variant="caption" tone="muted">
          Queda:{' '}
          <Text variant="caption" weight="bold">
            {completo}
          </Text>
        </Text>
      ) : (
        <Text variant="caption" tone="muted">
          Escribí lo de antes de la @ y elegí la terminación.
        </Text>
      )}

      <Modal
        visible={eligiendo}
        onClose={() => setEligiendo(false)}
        titulo="Terminación del email"
        descripcion="Lo que va después de la @."
      >
        <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
          {[...DOMINIOS_EMAIL, OTRO].map((opcion) => {
            const activa = opcion === partes.dominio;

            return (
              <Pressable
                key={opcion}
                onPress={() => elegir(opcion)}
                style={({ pressed }) => [styles.opcion, pressed && styles.presionado]}
                accessibilityRole="radio"
                accessibilityState={{ selected: activa }}
                accessibilityLabel={opcion === OTRO ? 'Otra, la escribo yo' : opcion}
              >
                <Text variant="body" weight={activa ? 'bold' : 'regular'} style={styles.flex}>
                  {opcion === OTRO ? 'Otra (la escribo yo)' : `@${opcion}`}
                </Text>
                {activa ? <Check size={20} color={theme.colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    campo: { gap: theme.spacing.xs },
    fila: { flexDirection: 'row', gap: theme.spacing.sm },
    usuario: { flex: 1 },
    // Se dibuja como un campo mas, con el mismo alto y fondo que el `Input`.
    selector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      maxWidth: '55%',
      minHeight: 48,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    dominio: { flexShrink: 1 },
    presionado: { opacity: 0.7 },
    // Tope de alto para que el modal no crezca fuera de la pantalla, pero que
    // entren las ocho opciones: con menos, "Otra" quedaba escondida abajo y
    // nadie scrollea un modal para buscarla.
    lista: { maxHeight: 440 },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 44,
      paddingVertical: theme.spacing.sm,
    },
    flex: { flex: 1 },
  });
