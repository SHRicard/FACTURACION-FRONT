import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError, soloDigitos } from '@/shared/utils';

import { useEditarUsuarioAdminMutation } from '../api/superAdminApi';
import { editarUsuarioFormSchema } from '../schemas';
import type { DatosEditarUsuario, DetalleUsuario, EditarUsuarioForm } from '../types';

const VACIO: EditarUsuarioForm = { nombre: '', email: '', dni: '' };

function aFormulario({ usuario }: DetalleUsuario): EditarUsuarioForm {
  return { nombre: usuario.nombre, email: usuario.email, dni: usuario.dni ?? '' };
}

/**
 * Solo lo que cambio: el PUT es parcial. Un DNI que estaba y se borro viaja
 * como `null`, que es "sacale el DNI" (y la cuenta vuelve a "completá tu
 * perfil").
 */
function soloCambios(original: EditarUsuarioForm, actual: EditarUsuarioForm): DatosEditarUsuario {
  const cambios: DatosEditarUsuario = {};
  if (actual.nombre.trim() !== original.nombre) cambios.nombre = actual.nombre.trim();
  if (actual.email.trim() !== original.email) cambios.email = actual.email.trim();
  if (soloDigitos(actual.dni) !== soloDigitos(original.dni)) {
    cambios.dni = actual.dni.trim() === '' ? null : actual.dni.trim();
  }
  return cambios;
}

/**
 * Correccion de nombre, email o DNI de una cuenta: lo que la persona no puede
 * tocar sola (el DNI se carga una sola vez).
 */
export function useEditarUsuario(detalle: DetalleUsuario | null) {
  const router = useRouter();
  const [editar, { isLoading, error }] = useEditarUsuarioAdminMutation();

  const form = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioFormSchema),
    defaultValues: detalle ? aFormulario(detalle) : VACIO,
    mode: 'onBlur',
  });

  const { reset } = form;

  // La ficha llega despues del primer render: sin esto el formulario se dibuja
  // vacio y pisa los datos al guardar.
  useEffect(() => {
    if (detalle) reset(aFormulario(detalle));
  }, [detalle, reset]);

  const enviar = form.handleSubmit(async (datos) => {
    if (!detalle) return;
    const cambios = soloCambios(aFormulario(detalle), datos);
    try {
      // Sin cambios, el backend responde 400: no se manda nada.
      if (Object.keys(cambios).length > 0) {
        await editar({ id: detalle.usuario.id, cambios }).unwrap();
      }
      router.back();
    } catch (fallo) {
      aplicarDetalles(form, interpretarError(fallo));
    }
  });

  const detalleError = interpretarError(error);

  return {
    form,
    enviar,
    cargando: isLoading,
    /** Tiene marca: el backend no deja sacarle el DNI (responde 400). */
    tieneMarca: Boolean(detalle?.marca),
    error: detalleError && !detalleError.campos ? detalleError.mensaje : null,
  };
}
