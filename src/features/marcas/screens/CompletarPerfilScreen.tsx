import { AuthLayout, PuertaBienvenida } from '@/features/auth/components';
import { useSesion } from '@/features/auth/hooks';
import { Button } from '@/shared/ui/atoms';

import { CampoDni } from '../components';
import { useCompletarPerfil } from '../hooks';

/**
 * Bienvenida, paso 1: el DNI.
 *
 * Sin DNI no se puede crear una marca ni sumarse a una: es con lo que un socio
 * te encuentra. Se carga una sola vez, por eso se avisa ANTES de guardar.
 *
 * No se bifurca movil/escritorio a proposito, igual que el login: es un
 * formulario centrado y un cartel de "en construccion" dejaria la cuenta
 * trabada en una ventana ancha.
 */
export function CompletarPerfilScreen() {
  const { usuario, cerrarSesion } = useSesion();
  const perfil = useCompletarPerfil();

  const primerNombre = usuario?.nombre.trim().split(/\s+/)[0];

  return (
    <PuertaBienvenida paso="perfil">
      <AuthLayout
        titulo="Completá tu perfil"
        subtitulo={`${primerNombre ? `Hola, ${primerNombre}. ` : ''}Tu DNI identifica tu cuenta: con él tu socio te puede sumar a su marca.`}
        error={perfil.error}
        footer={
          // Por si entro con la cuenta equivocada: sin esto no hay salida.
          <Button label="Salir y entrar con otra cuenta" variant="ghost" onPress={cerrarSesion} />
        }
      >
        <CampoDni
          control={perfil.form.control}
          name="dni"
          helperText="No se puede cambiar después: revisalo bien antes de seguir."
          onSubmitEditing={perfil.enviar}
        />
        <Button
          label="Continuar"
          onPress={perfil.enviar}
          loading={perfil.cargando}
          size="lg"
          fullWidth
        />
      </AuthLayout>
    </PuertaBienvenida>
  );
}
