import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import {
  aplicarDetalles,
  formatearMoneda,
  interpretarError,
  nuevaClaveIdempotencia,
  quedoEnDuda,
  volverDelFormulario,
} from '@/shared/utils';

import {
  useCrearTicketMutation,
  useEditarTicketMutation,
  useTicketDetalleQuery,
} from '../api/ticketsApi';
import { irALaFactura } from '../navegar';
import { excedenteDePagos } from '../saldo';
import { itemFormSchema, LIMITES_TICKET, subtotalDe, ticketFormSchema } from '../schemas';
import type { FacturaEnCurso, ItemForm, ItemNuevo, Ticket, TicketForm } from '../types';

import { useSalidaConBorrador } from './useSalidaConBorrador';

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
  /**
   * El ticket ya se habia cargado con la misma clave (un reintento con mala
   * señal): no se volvio a cargar, quedo el que ya estaba.
   */
  repetido: boolean;
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

/**
 * Si el back rechazo la clave, reusarla no sirve de nada: el proximo intento
 * va con una nueva. Ante cualquier otro error (sin red, tope de tiempo,
 * respuesta rara) se reusa, que es lo que evita el ticket duplicado.
 */
const CODIGOS_CLAVE_QUEMADA = ['IDEMPOTENCIA_CONFLICTO', 'IDEMPOTENCIA_CLAVE_INVALIDA'];

interface OpcionesGuardar {
  clienteId: string;
  /** Sin id es un alta; con id, una correccion. */
  ticketId?: string;
  /**
   * La ficha del cliente, o null si no llego. Trae la factura activa, la que
   * dice si el ticket todavia se puede tocar, si se elige el vencimiento y
   * cuanto dejo el cliente a cuenta.
   */
  cliente: { facturaAbierta?: FacturaEnCurso | null } | null;
  /** Se entro desde la factura: "Ver la factura" vuelve en vez de apilarla. */
  desdeFactura: boolean;
}

/**
 * El formulario de un ticket, para cargarlo y para corregirlo.
 *
 * Es el mismo hook para los dos casos porque los campos, las validaciones y la
 * respuesta son identicos: lo unico que cambia es el endpoint. Los renglones
 * son una lista que crece, no un formulario fijo — el administrador esta parado
 * con el cliente enfrente y cada toque cuenta.
 */
export function useGuardarTicket({ clienteId, ticketId, cliente, desdeFactura }: OpcionesGuardar) {
  const router = useRouter();
  const [crear, estadoCrear] = useCrearTicketMutation();
  const [editar, estadoEditar] = useEditarTicketMutation();

  const consulta = useTicketDetalleQuery(ticketId ?? '', { skip: !ticketId });
  const ticket = consulta.data;

  /** Lo que se muestra despues de guardar, cuando hay algo que decir. */
  const [resultado, setResultado] = useState<ResultadoTicket | null>(null);

  /**
   * Clave de idempotencia del alta (K1). Se crea en el primer envio y se REUSA
   * en cada reintento: si el primero llego y la respuesta no, el segundo
   * devuelve el mismo ticket en vez de cargarlo dos veces.
   */
  const clave = useRef<string | null>(null);

  const facturaEnCurso = cliente?.facturaAbierta ?? null;

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

  // Pregunta antes de tirar lo cargado al salir con la flecha o el gesto (U5).
  const salida = useSalidaConBorrador(form.formState.isDirty);
  const { permitirSalida } = salida;

  /*
   * El vencimiento se acuerda con el primer ticket de la factura, o con una
   * compra fiada sobre una factura que quedo en $0 (K15): el back lo dice con
   * `eligeVencimiento` (sin el dato, la regla vieja: sin tickets todavia). La
   * ficha trae la factura en curso, asi que no hace falta otra request.
   *
   * Sobre una factura en $0 que ya tiene tickets, la fecha solo se aplica si
   * este ticket deja algo fiado: es la misma regla del back (tickets.ts:254).
   */
  const reeligeVencimiento = facturaEnCurso
    ? (facturaEnCurso.eligeVencimiento ?? facturaEnCurso.cantidadTickets === 0)
    : false;
  const eligeVencimiento =
    !ticketId &&
    cliente !== null &&
    (!facturaEnCurso ||
      (reeligeVencimiento && (facturaEnCurso.cantidadTickets === 0 || quedaDebiendo > 0)));
  /** La factura a la que se suma este ticket, con su fecha ya fijada. */
  const facturaQueSigue =
    !ticketId && facturaEnCurso && !reeligeVencimiento ? facturaEnCurso : null;

  /*
   * Corrigiendo, cuanto quedaria en negativo la factura con el faltante nuevo
   * (K2). No hay saldo a favor: si lo pagado a cuenta supera lo fiado, el back
   * lo rechaza, asi que se avisa antes. Los totales de la ficha pueden estar
   * viejos; el 400 SALDO_NEGATIVO del back sigue siendo la fuente de verdad.
   */
  const excedenteSaldo =
    ticketId && ticket && facturaEnCurso
      ? excedenteDePagos(facturaEnCurso, { sale: ticket.faltante, entra: quedaDebiendo })
      : 0;

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
    !ticket || (!ticket.anulado && facturaEnCurso !== null && ticket.factura === facturaEnCurso.id);

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

  const guardar = async (datos: TicketForm) => {
    // Corrigiendo: si con el faltante nuevo lo pagado a cuenta supera lo
    // fiado, no se manda. El error va en 'pagado', que es lo que se toca para
    // arreglarlo (o se anula el pago desde la factura).
    if (ticketId && ticket && facturaEnCurso) {
      const totalNuevo = datos.items.reduce(
        (suma, item) => suma + subtotalDe(item.cantidad, item.precioUnitario),
        0,
      );
      const faltanteNuevo = Math.max(0, totalNuevo - aNumero(datos.pagado));
      const excedente = excedenteDePagos(facturaEnCurso, {
        sale: ticket.faltante,
        entra: faltanteNuevo,
      });
      if (excedente > 0) {
        form.setError('pagado', {
          type: 'saldo',
          message: `El cliente ya dejó ${formatearMoneda(facturaEnCurso.totalPagos)} a cuenta y la factura quedaría en −${formatearMoneda(excedente)}. Primero anulá el pago desde la factura.`,
        });
        return;
      }
    }

    const cuerpo = {
      items: datos.items.map(aBody),
      // En la correccion el `pagado` viaja SIEMPRE, incluso en cero: omitirlo
      // conserva el anterior, y si el ticket se achico, ese anterior ya no
      // entra y el backend responde 400.
      ...(ticketId || datos.pagado ? { pagado: aNumero(datos.pagado) } : {}),
      // La fecha acordada solo viaja cuando se puede elegir, y solo si se
      // eligio una.
      ...(eligeVencimiento && datos.venceEl ? { venceEl: datos.venceEl } : {}),
    };

    try {
      const respuesta = ticketId
        ? await editar({ id: ticketId, clienteId, ticket: cuerpo }).unwrap()
        : await crear({
            clienteId,
            ticket: cuerpo,
            claveIdempotencia: (clave.current ??= nuevaClaveIdempotencia()),
          }).unwrap();
      // Guardado: el proximo ticket es otro pedido y lleva otra clave.
      clave.current = null;

      // Sin nada que contar no se interrumpe: se vuelve derecho a donde se
      // vino, que ya tiene el saldo nuevo porque la mutacion invalido sus tags.
      if (!respuesta.warning && !respuesta.repetido) {
        permitirSalida();
        volverDelFormulario(router, clienteId);
        return;
      }

      setResultado({
        faltante: respuesta.ticket.faltante,
        saldo: respuesta.factura.saldo,
        warning: respuesta.warning,
        repetido: respuesta.repetido,
      });
    } catch (fallo) {
      // El error queda en el estado de la mutacion y el cartel de arriba lo
      // muestra desde ahi. Lo que el back marca por campo (`detalles.campos`:
      // 'items.1.precioUnitario', 'pagado') baja ademas al input que
      // corresponde (K11, K16).
      const detalle = interpretarError(fallo);
      aplicarDetalles(form, detalle);
      // Un 409 de clave ya invalido la ficha y las facturas (invalidatesTags
      // corre igual con el error manejado); el proximo intento va con otra.
      if (detalle?.codigo && CODIGOS_CLAVE_QUEMADA.includes(detalle.codigo)) {
        clave.current = null;
      }
      setResultado(null);
    }
  };

  // `handleSubmit` corre recien al tocar Guardar, no durante el render:
  // `guardar` toca la ref de la clave y react-hooks/refs no deja pasarla a
  // nada que se ejecute mientras se dibuja.
  const enviar = () => form.handleSubmit(guardar)();

  /** Cierra el aviso posterior al guardado y sigue viaje. */
  const cerrarResultado = useCallback(() => {
    setResultado(null);
    permitirSalida();
    volverDelFormulario(router, clienteId);
  }, [permitirSalida, router, clienteId]);

  const errorGuardado = interpretarError(ticketId ? estadoEditar.error : estadoCrear.error);

  /** A la factura, para anular el pago que no deja achicar el ticket (K2). */
  const idFactura = facturaEnCurso?.id ?? ticket?.factura;
  const verLaFactura = useCallback(() => {
    if (idFactura) irALaFactura(router, idFactura, desdeFactura);
  }, [idFactura, router, desdeFactura]);

  /*
   * El cartel general. Sin respuesta en el alta no se sabe si se guardo, pero
   * reintentar con la misma clave no duplica: se dice eso y no "fallo". El
   * mensaje del back queda como red de seguridad aunque haya bajado a los
   * campos, porque los errores de 'items' raiz no se dibujan en ningun input.
   */
  let error: string | null = null;
  if (errorGuardado) {
    error =
      !ticketId && quedoEnDuda(errorGuardado)
        ? 'No sabemos si se guardó. Tocá Guardar de nuevo: no se va a duplicar.'
        : errorGuardado.mensaje;
  }

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
    /**
     * El boton de sumar renglon se habilita recien con todo lo de arriba
     * cargado, y hasta el tope de renglones del back (K16).
     */
    puedeAgregar: renglonesCompletos && renglones.fields.length < LIMITES_TICKET.renglones,
    quitar,
    /** Solo con mas de uno se puede borrar. */
    puedeQuitar: renglones.fields.length > 1,
    total,
    dejaAhora,
    quedaDebiendo,
    pagarTodo,
    enviar,
    guardando: estadoCrear.isLoading || estadoEditar.isLoading,
    error,
    resultado,
    cerrarResultado,
    /** La factura activa del cliente, o null si no tiene o si la ficha no llego. */
    facturaEnCurso,
    /** Se muestra el campo de la fecha acordada (K15). */
    eligeVencimiento,
    /** Se suma a una factura con la fecha ya fijada: para el "vence el …". */
    facturaQueSigue,
    /** La correccion dejaria la factura en negativo: va con "Ver la factura". */
    saldoNegativo: excedenteSaldo > 0 || errorGuardado?.codigo === 'SALDO_NEGATIVO',
    verLaFactura,
    /** "¿Descartar el ticket?" al salir con algo cargado sin guardar. */
    salida: {
      preguntando: salida.preguntando,
      descartar: salida.descartar,
      seguir: salida.seguir,
    },
    /** Para las salidas que cierran el formulario (anular): no preguntan. */
    permitirSalida,
  };
}
