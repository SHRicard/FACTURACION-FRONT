import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useEditarMarcaAdminMutation } from '../api/superAdminApi';
import { editarMarcaFormSchema } from '../schemas';
import type { DatosEditarMarca, DetalleMarca, EditarMarcaForm } from '../types';

const VACIO: EditarMarcaForm = {
  nombre: '',
  direccion: '',
  telefono: '',
  colorPrimario: '',
  colorSecundario: '',
};

function aFormulario({ marca }: DetalleMarca): EditarMarcaForm {
  return {
    nombre: marca.nombre,
    direccion: marca.direccion ?? '',
    telefono: marca.telefono ?? '',
    colorPrimario: marca.colorPrimario ?? '',
    colorSecundario: marca.colorSecundario ?? '',
  };
}

/**
 * Mismas reglas que `PUT /marcas/mia`: se manda el formulario COMO QUEDO.
 * Direccion o telefono vacios se borran; un color vacio viaja como `null`,
 * que lo saca.
 */
function aBody(datos: EditarMarcaForm): DatosEditarMarca {
  return {
    nombre: datos.nombre.trim(),
    direccion: datos.direccion.trim(),
    telefono: datos.telefono.trim(),
    colorPrimario: datos.colorPrimario.trim() ? datos.colorPrimario.trim().toUpperCase() : null,
    colorSecundario: datos.colorSecundario.trim()
      ? datos.colorSecundario.trim().toUpperCase()
      : null,
  };
}

/** Edicion de textos y colores de una marca. El logo no: lo sube el dueno. */
export function useEditarMarca(detalle: DetalleMarca | null) {
  const router = useRouter();
  const [editar, { isLoading, error }] = useEditarMarcaAdminMutation();

  const form = useForm<EditarMarcaForm>({
    resolver: zodResolver(editarMarcaFormSchema),
    defaultValues: detalle ? aFormulario(detalle) : VACIO,
    mode: 'onBlur',
  });

  const { reset } = form;

  useEffect(() => {
    if (detalle) reset(aFormulario(detalle));
  }, [detalle, reset]);

  const enviar = form.handleSubmit(async (datos) => {
    if (!detalle) return;
    try {
      await editar({ id: detalle.marca.id, datos: aBody(datos) }).unwrap();
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
    error: detalleError && !detalleError.campos ? detalleError.mensaje : null,
  };
}
