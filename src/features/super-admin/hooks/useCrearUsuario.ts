import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useCrearUsuarioAdminMutation } from '../api/superAdminApi';
import { crearUsuarioFormSchema } from '../schemas';
import type { CrearUsuarioForm, DatosCrearUsuario } from '../types';

const VACIO: CrearUsuarioForm = {
  nombre: '',
  email: '',
  password: '',
  rol: 'administrador',
  dni: '',
};

/** El DNI viaja solo si se escribio: vacio, el backend no lo pide. */
function aBody({ dni, ...resto }: CrearUsuarioForm): DatosCrearUsuario {
  return dni.trim() ? { ...resto, dni: dni.trim() } : resto;
}

/**
 * Alta de una cuenta desde el panel. Nace SIN terminos aceptados: la persona
 * los acepta al entrar por primera vez, como cualquier otra.
 */
export function useCrearUsuario() {
  const router = useRouter();
  const [crear, { isLoading, error }] = useCrearUsuarioAdminMutation();

  const form = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioFormSchema),
    defaultValues: VACIO,
    mode: 'onBlur',
  });

  const enviar = form.handleSubmit(async (datos) => {
    try {
      const creado = await crear(aBody(datos)).unwrap();
      // `replace` y no `push`: volver al alta despues de crear invitaria a
      // crearla dos veces.
      router.replace(`/super-admin/usuarios/${creado.id}`);
    } catch (fallo) {
      // El 409 del email o del DNI repetido trae `detalles.campos`: va bajo
      // su campo.
      aplicarDetalles(form, interpretarError(fallo));
    }
  });

  const detalle = interpretarError(error);
  const rol = useWatch({ control: form.control, name: 'rol' });

  return {
    form,
    enviar,
    cargando: isLoading,
    rol,
    elegirRol: (rol: CrearUsuarioForm['rol']) => form.setValue('rol', rol),
    /** Lo que ya se mostro bajo un campo no se repite arriba. */
    error: detalle && !detalle.campos ? detalle.mensaje : null,
  };
}
