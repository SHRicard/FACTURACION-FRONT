import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { interpretarError, volverDelFormulario } from '@/shared/utils';

import {
  useCrearTicketMutation,
  useEditarTicketMutation,
  useTicketDetalleQuery,
} from '../api/ticketsApi';
import { itemFormSchema, subtotalDe, ticketFormSchema } from '../schemas';
import type { ItemForm, ItemNuevo, Ticket, TicketForm } from '../types';

/** Un renglon en blanco. La cantidad arranca en 1: es lo que mas se repite. */
const itemVacio = (especie = ''): ItemForm => ({
  nombre: '',
  talle: '',
  especie,
  cantidad: '1',
  precioUnitario: '',
});

/** El ticket que vino de la API, con la forma que espera el formulario. */
function aFormulario(ticket: Ticket): TicketForm {
  return {
    items: ticket.items.map((item) => ({
      nombre: item.nombre,
      talle: item.talle ?? '',
      especie: item.especie,
      cantidad: String(item.cantidad),
      precioUnitario: String(item.precioUnitario),
    })),
    pagado: ticket.pagado ? String(ticket.pagado) : '',
    // La fecha no se corrige desde el ticket: se reprograma desde la factura.
    venceEl: '',
  };
}

/** Lo que hay que contarle a la persona despues de guardar. */
export interface ResultadoTicket {
  /** Lo que quedo debiendo por este ticket. */
  faltante: number;
  /** El saldo de la factura, ya recalculado. */
  saldo: number;
  /** Aviso de limite de credito, o null. El ticket se guardo igual. */
  warning: string | null;
}

const aNumero = (valor: string) => Number(valor) || 0;

/** Del formulario al body. Los opcionales en blanco no viajan. */
function aBody(item: ItemForm): ItemNuevo {
  const cuerpo: ItemNuevo = {
    nombre: item.nombre,
    especie: item.especie,
    cantidad: aNumero(item.cantidad),
    precioUnitario: aNumero(item.precioUnitario),
  };
  if (item.talle) cuerpo.talle = item.talle;
  return cuerpo;
}

interface OpcionesGuardar {
  clienteId: string;
  /** Sin id es un alta; con id, una correccion. */
  ticketId?: string;
  /**
   * Id de la factura activa del cliente, la que la ficha tiene en pantalla.
   * Sirve para saber si este ticket todavia se puede tocar.
   */
  facturaAbiertaId?: string | null;
}

/**
 * El formulario de un ticket, para cargarlo y para corregirlo.
 *
 * Es el mismo hook para los dos casos porque los campos, las validaciones y la
 * respuesta son identicos: lo unico que cambia es el endpoint. Los renglones
 * son una lista que crece, no un formulario fijo — el administrador esta parado
 * con el cliente enfrente y cada toque cuenta.
 */
export function useGuardarTicket({ clienteId, ticketId, facturaAbiertaId }: OpcionesGuardar) {
  const router = useRouter();
  const [crear, estadoCrear] = useCrearTicketMutation();
  const [editar, estadoEditar] = useEditarTicketMutation();

  const consulta = useTicketDetalleQuery(ticketId ?? '', { skip: !ticketId });
  const ticket = consulta.data;

  /** Lo que se muestra despues de guardar, cuando hay algo que decir. */
  const [resultado, setResultado] = useState<ResultadoTicket | null>(null);

  const form = useForm<TicketForm>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: { items: [itemVacio()], pagado: '', venceEl: '' },
    mode: 'onBlur',
  });

  const { control, setValue, reset, getValues } = form;
  const renglones = useFieldArray({ control, name: 'items' });

  // El ticket llega despues del primer render (es una request), asi que los
  // valores se cargan cuando aparecen. Sin esto, la correccion se dibuja vacia
  // y pisaria el ticket entero al guardar.
  useEffect(() => {
    if (ticket) reset(aFormulario(ticket));
  }, [ticket, reset]);

  // `useWatch` y no `watch`: solo re-renderiza lo que depende de los numeros,
  // que se recalculan en cada tecla del precio.
  const items = useWatch({ control, name: 'items' });
  const pagado = useWatch({ control, name: 'pagado' });

  const total = (items ?? []).reduce(
    (suma, item) => suma + subtotalDe(item?.cantidad ?? '', item?.precioUnitario ?? ''),
    0,
  );
  const dejaAhora = aNumero(pagado ?? '');
  const quedaDebiendo = Math.max(0, total - dejaAhora);

  /**
   * Si se puede sumar otro renglon.
   *
   * Solo con los que ya estan completos: si no, tocar "agregar otro" apila
   * tarjetas vacias y el error recien aparece al guardar, cuando ya hay cuatro
   * a medio llenar y no se sabe cual falta.
   *
   * Se pregunta con el MISMO schema que valida al enviar, asi no hay dos
   * definiciones de "renglon completo" que se puedan ir separando.
   */
  const renglonesCompletos =
    (items ?? []).length > 0 &&
    (items ?? []).every((item) => itemFormSchema.safeParse(item).success);

  /**
   * Un ticket se toca mientras su factura sigue abierta; despues queda
   * congelado, porque ya tiene numero y el cliente vio ese resumen.
   *
   * Se deduce comparando con la factura abierta del cliente: si el ticket no
   * esta en ella, su factura ya se cerro.
   */
  const sePuedeTocar =
    !ticket ||
    (!ticket.anulado && Boolean(facturaAbiertaId) && ticket.factura === facturaAbiertaId);

  /**
   * El renglon nuevo hereda la especie del anterior: lo mas comun es llevarse
   * dos cosas parecidas, y asi ese campo ya viene resuelto.
   */
  const agregar = useCallback(() => {
    const ultimo = renglones.fields.length - 1;
    const especie = ultimo >= 0 ? getValues(`items.${ultimo}.especie`) : '';
    renglones.append(itemVacio(especie));
  }, [renglones, getValues]);

  /** El ultimo renglon no se borra: un ticket sin items no existe. */
  const quitar = useCallback(
    (indice: number) => {
      if (renglones.fields.length > 1) renglones.remove(indice);
    },
    [renglones],
  );

  /** "Pago todo": iguala lo que deja al total. */
  const pagarTodo = useCallback(() => {
    setValue('pagado', String(total), { shouldValidate: true });
  }, [setValue, total]);

  const enviar = form.handleSubmit(async (datos) => {
    const cuerpo = {
      items: datos.items.map(aBody),
      // En la correccion el `pagado` viaja SIEMPRE, incluso en cero: omitirlo
      // conserva el anterior, y si el ticket se achico, ese anterior ya no
      // entra y el backend responde 400.
      ...(ticketId || datos.pagado ? { pagado: aNumero(datos.pagado) } : {}),
      // La fecha acordada solo viaja en el alta, y solo si se eligio una.
      ...(!ticketId && datos.venceEl ? { venceEl: datos.venceEl } : {}),
    };

    try {
      const respuesta = ticketId
        ? await editar({ id: ticketId, clienteId, ticket: cuerpo }).unwrap()
        : await crear({ clienteId, ticket: cuerpo }).unwrap();

      // Sin nada que contar no se interrumpe: se vuelve derecho a donde se
      // vino, que ya tiene el saldo nuevo porque la mutacion invalido sus tags.
      if (!respuesta.warning) {
        volverDelFormulario(router, clienteId);
        return;
      }

      setResultado({
        faltante: respuesta.ticket.faltante,
        saldo: respuesta.factura.saldo,
        warning: respuesta.warning,
      });
    } catch {
      // El error queda en el estado de la mutacion y se muestra desde ahi: los
      // mensajes del backend vienen redactados y numerando el renglon ("El item
      // 2 necesita un nombre"), asi que van tal cual en el cartel de arriba. El
      // catch existe para que la promesa no quede sin atender.
      setResultado(null);
    }
  });

  /** Cierra el aviso posterior al guardado y sigue viaje. */
  const cerrarResultado = useCallback(() => {
    setResultado(null);
    volverDelFormulario(router, clienteId);
  }, [router, clienteId]);

  const errorGuardado = interpretarError(ticketId ? estadoEditar.error : estadoCrear.error);

  return {
    form,
    ticket,
    esEdicion: Boolean(ticketId),
    /** Trayendo el ticket que se va a corregir. */
    cargando: consulta.isLoading,
    /** No existe, o es de otro negocio. */
    noExiste: interpretarError(consulta.error)?.status === 404,
    errorCarga: interpretarError(consulta.error)?.mensaje ?? null,
    sePuedeTocar,
    renglones: renglones.fields,
    agregar,
    /** El boton de sumar renglon se habilita recien con todo lo de arriba cargado. */
    puedeAgregar: renglonesCompletos,
    quitar,
    /** Solo con mas de uno se puede borrar. */
    puedeQuitar: renglones.fields.length > 1,
    total,
    dejaAhora,
    quedaDebiendo,
    pagarTodo,
    enviar,
    guardando: estadoCrear.isLoading || estadoEditar.isLoading,
    error: errorGuardado?.mensaje ?? null,
    resultado,
    cerrarResultado,
  };
}
