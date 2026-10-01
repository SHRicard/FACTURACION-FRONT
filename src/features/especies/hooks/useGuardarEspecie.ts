import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useCrearEspecieMutation, useEditarEspecieMutation } from '../api/especiesApi';
import { cantidadDelTexto, especieFormSchema } from '../schemas';
import type { CambiosEspecie, Especie, EspecieForm } from '../types';

// La cantidad arranca vacia y no en '0': vacio es "sin cantidad", y con un 0
// precargado toda especie nueva naceria con cantidad 0.
const VACIO: EspecieForm = { nombre: '', descripcion: '', cantidad: '' };

const aFormulario = (especie: Especie): EspecieForm => ({
  nombre: especie.nombre,
  descripcion: especie.descripcion ?? '',
  cantidad: especie.cantidad !== undefined ? String(especie.cantidad) : '',
});

/**
 * Solo lo que cambio. El PUT es parcial, asi que mandar el nombre sin tocarlo
 * arriesga un 409 contra si mismo.
 *
 * La descripcion vacia SI viaja, como string vacio: es la unica forma de
 * expresar "borra la que habia". Omitirla significaria "dejala como esta". La
 * cantidad, igual pero con `null`.
 *
 * La cantidad se compara como numero y no como texto: escribir "0100" donde
 * habia 100 no es un cambio.
 */
function soloCambios(original: EspecieForm, actual: EspecieForm): CambiosEspecie {
  const cambios: CambiosEspecie = {};
  if (actual.nombre !== original.nombre) cambios.nombre = actual.nombre;
  if (actual.descripcion !== original.descripcion) cambios.descripcion = actual.descripcion;
  const cantidad = cantidadDelTexto(actual.cantidad);
  if (cantidad !== cantidadDelTexto(original.cantidad)) cambios.cantidad = cantidad;
  return cambios;
}

/**
 * El modal de alta y edicion de una especie.
 *
 * Es el mismo hook para los dos casos porque los campos y las validaciones son
 * identicos: lo unico que cambia es el endpoint. Maneja tambien si el modal
 * esta abierto, porque abrirlo y resetear el formulario son la misma accion.
 */
export function useGuardarEspecie() {
  const [crear, estadoCrear] = useCrearEspecieMutation();
  const [editar, estadoEditar] = useEditarEspecieMutation();

  /** La especie que se esta editando, o null si es un alta. */
  const [editando, setEditando] = useState<Especie | null>(null);
  const [abierto, setAbierto] = useState(false);

  const form = useForm<EspecieForm>({
    resolver: zodResolver(especieFormSchema),
    defaultValues: VACIO,
    mode: 'onBlur',
  });

  const { reset } = form;

  /**
   * `nombreSugerido` es para los atajos del estado vacio: la primera especie de
   * un negocio deberia ser un toque, no una decision con la hoja en blanco.
   */
  const abrirAlta = useCallback(
    (nombreSugerido?: string) => {
      setEditando(null);
      reset({ ...VACIO, nombre: nombreSugerido ?? '' });
      setAbierto(true);
    },
    [reset],
  );

  const abrirEdicion = useCallback(
    (especie: Especie) => {
      setEditando(especie);
      reset(aFormulario(especie));
      setAbierto(true);
    },
    [reset],
  );

  const cerrar = useCallback(() => setAbierto(false), []);

  const enviar = form.handleSubmit(async (datos) => {
    try {
      if (editando) {
        const cambios = soloCambios(aFormulario(editando), datos);
        // Nada que mandar: un PUT vacio seria una request al pedo.
        if (Object.keys(cambios).length > 0) {
          await editar({ id: editando.id, cambios }).unwrap();
        }
      } else {
        const cantidad = cantidadDelTexto(datos.cantidad);
        await crear({
          nombre: datos.nombre,
          // En el alta los opcionales vacios no viajan: que los omita el body es
          // mas honesto que mandar un string vacio o un null.
          ...(datos.descripcion ? { descripcion: datos.descripcion } : {}),
          ...(cantidad !== null ? { cantidad } : {}),
        }).unwrap();
      }
      setAbierto(false);
    } catch (fallo) {
      const error = interpretarError(fallo);
      aplicarDetalles(form, error);

      // El 409 es "ya tenes una especie con ese nombre": va bajo el campo
      // nombre, no en el cartel de arriba, que es donde nadie lo relaciona con
      // lo que tiene que corregir.
      if (error?.status === 409) {
        form.setError('nombre', {
          type: 'server',
          message: 'Ya tenés una especie con ese nombre.',
        });
      }
    }
  });

  const error = interpretarError(editando ? estadoEditar.error : estadoCrear.error);

  return {
    form,
    abierto,
    esEdicion: editando !== null,
    abrirAlta,
    abrirEdicion,
    cerrar,
    enviar,
    guardando: estadoCrear.isLoading || estadoEditar.isLoading,
    /**
     * El 400 con campos y el 409 ya se muestran bajo su campo: repetirlos
     * arriba hace que la persona lea el mismo texto dos veces.
     */
    error: error && !error.campos && error.status !== 409 ? error.mensaje : null,
  };
}
