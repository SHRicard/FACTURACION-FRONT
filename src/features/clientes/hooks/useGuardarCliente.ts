import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { aplicarDetalles, interpretarError } from '@/shared/utils';

import { useCrearClienteMutation, useEditarClienteMutation } from '../api/clientesApi';
import { clienteFormSchema } from '../schemas';
import type { ClienteDetalle, ClienteForm, DatosCliente } from '../types';

/** Ventana de pago por defecto, la misma que usa el backend cuando no se manda. */
const VENTANA_POR_DEFECTO = { desdeDia: 1, hastaDia: 10 };

const VACIO: ClienteForm = {
  nombre: '',
  dni: '',
  telefono: '',
  email: '',
  direccion: '',
  limiteCredito: '',
  ...VENTANA_POR_DEFECTO,
};

/** Los datos del cliente, con la forma que espera el formulario. */
function aFormulario(cliente: ClienteDetalle): ClienteForm {
  return {
    nombre: cliente.nombre,
    dni: cliente.dni,
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
    direccion: cliente.direccion ?? '',
    // 0 significa "sin limite": se muestra vacio, no como un cero escrito.
    limiteCredito: cliente.limiteCredito ? String(cliente.limiteCredito) : '',
    desdeDia: cliente.ventanaPago.desdeDia,
    hastaDia: cliente.ventanaPago.hastaDia,
  };
}

/**
 * Del formulario al body de la API.
 *
 * `conVacios` cambia que pasa con los opcionales en blanco:
 * - Alta (`false`): no viajan, asi el backend aplica sus defaults.
 * - Edicion (`true`): viajan como `''`. Es la unica forma de expresar "borra el
 *   telefono que habia": omitir el campo en un PUT parcial significa "dejalo
 *   como esta", asi que sin esto vaciar un campo no haria nada.
 */
function aBody(datos: ClienteForm, conVacios: boolean): DatosCliente {
  const cuerpo: DatosCliente = {
    nombre: datos.nombre,
    dni: datos.dni,
    limiteCredito: datos.limiteCredito === '' ? 0 : Number(datos.limiteCredito),
    ventanaPago: { desdeDia: datos.desdeDia, hastaDia: datos.hastaDia },
  };

  if (datos.telefono || conVacios) cuerpo.telefono = datos.telefono;
  if (datos.email || conVacios) cuerpo.email = datos.email;
  if (datos.direccion || conVacios) cuerpo.direccion = datos.direccion;

  return cuerpo;
}

/** Solo lo que cambio respecto de como estaba. El PUT es parcial. */
function soloCambios(original: ClienteForm, actual: ClienteForm): Partial<DatosCliente> {
  const cuerpo = aBody(actual, true);
  const previo = aBody(original, true);
  const cambios: Partial<DatosCliente> = {};

  for (const clave of Object.keys(cuerpo) as (keyof DatosCliente)[]) {
    // JSON.stringify alcanza: los valores son strings, numeros y la ventana,
    // que es un objeto de dos numeros.
    if (JSON.stringify(cuerpo[clave]) !== JSON.stringify(previo[clave])) {
      Object.assign(cambios, { [clave]: cuerpo[clave] });
    }
  }

  return cambios;
}

interface OpcionesGuardar {
  /**
   * El id de la ruta: con id es una edición aunque el cliente no haya llegado.
   * Sin id es un alta.
   */
  clienteId?: string;
  /** Los datos actuales del cliente, cuando es una edicion y ya llegaron. */
  cliente?: ClienteDetalle | null;
}

/**
 * Formulario de alta y edicion de un cliente.
 *
 * Es el mismo hook para los dos casos porque los campos, las validaciones y los
 * errores son identicos: lo unico que cambia es el endpoint y a donde se va
 * despues de guardar.
 */
export function useGuardarCliente({ clienteId, cliente }: OpcionesGuardar = {}) {
  const router = useRouter();
  const [crear, estadoCrear] = useCrearClienteMutation();
  const [editar, estadoEditar] = useEditarClienteMutation();

  // Sale del id y no de los datos: una ficha caida no convierte la edicion en
  // un alta (que crearia al cliente de nuevo).
  const esEdicion = Boolean(clienteId);

  const form = useForm<ClienteForm>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: cliente ? aFormulario(cliente) : VACIO,
    mode: 'onBlur',
  });

  const { reset } = form;

  // El detalle llega despues del primer render (es una request), asi que los
  // valores por defecto se cargan cuando aparecen. Sin esto, el formulario de
  // edicion se dibuja vacio y pisa los datos del cliente al guardar.
  useEffect(() => {
    if (cliente) reset(aFormulario(cliente));
  }, [cliente, reset]);

  const enviar = form.handleSubmit(async (datos) => {
    try {
      if (esEdicion) {
        // Sin los datos no hay contra que comparar: la pantalla ya corta antes.
        if (!cliente) return;
        const cambios = soloCambios(aFormulario(cliente), datos);
        // Nada que mandar: un PUT vacio seria una request al pedo.
        if (Object.keys(cambios).length > 0) {
          await editar({ id: cliente.id, cambios }).unwrap();
        }
        router.back();
        return;
      }

      const creado = await crear(aBody(datos, false)).unwrap();
      // `replace` y no `push`: volver al formulario de alta despues de crear al
      // cliente invitaria a crearlo dos veces.
      router.replace(`/admin/clientes/${creado.id}`);
    } catch (fallo) {
      const error = interpretarError(fallo);
      aplicarDetalles(form, error);

      // El 409 es "ese DNI ya existe": va bajo el campo DNI y no en el cartel
      // de arriba, que es donde nadie lo relaciona con lo que tiene que corregir.
      if (error?.status === 409) {
        form.setError('dni', { type: 'server', message: error.mensaje });
      }
    }
  });

  const error = interpretarError(esEdicion ? estadoEditar.error : estadoCrear.error);

  return {
    form,
    enviar,
    esEdicion,
    cargando: estadoCrear.isLoading || estadoEditar.isLoading,
    /**
     * El 400 con campos y el 409 ya se muestran bajo su campo: repetirlos
     * arriba hace que la persona lea el mismo texto dos veces.
     */
    error: error && !error.campos && error.status !== 409 ? error.mensaje : null,
  };
}
