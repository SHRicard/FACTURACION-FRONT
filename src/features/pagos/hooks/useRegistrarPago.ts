import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import {
  aplicarDetalles,
  formatearMoneda,
  interpretarError,
  nuevaClaveIdempotencia,
  quedoEnDuda,
  volverDelFormulario,
} from '@/shared/utils';

import { useRegistrarPagoClienteMutation, useRegistrarPagoFacturaMutation } from '../api/pagosApi';
import { pagoFormSchema } from '../schemas';
import type { PagoForm, PagoNuevo, RespuestaPago } from '../types';

const VACIO: PagoForm = { monto: '', metodoPago: 'efectivo', nota: '' };

/**
 * Si el back rechazo la clave, reusarla no sirve de nada: el proximo intento
 * va con una nueva. Ante cualquier otro error (sin red, tope de tiempo,
 * respuesta rara) se reusa, que es lo que evita el cobro duplicado.
 */
const CODIGOS_CLAVE_QUEMADA = ['IDEMPOTENCIA_CONFLICTO', 'IDEMPOTENCIA_CLAVE_INVALIDA'];

interface OpcionesPago {
  clienteId: string;
  /**
   * Con factura, todo el monto va a esa; sin factura, a la activa del cliente.
   * Terminan en la misma: el cliente tiene una sola factura con deuda.
   */
  facturaId?: string;
  /**
   * Lo que se puede cobrar como maximo: la deuda total del cliente, o el saldo
   * de la factura. Llega con una request, por eso no va dentro del schema.
   */
  deuda: number;
  /**
   * El `estado` de la factura, cuando se paga a una. Solo la abierta recibe
   * pagos: una pagada o anulada no. Sin factura no hay nada que mirar.
   */
  estadoFactura?: string;
}

/**
 * El formulario de un pago, para las dos puertas.
 *
 * Es el mismo hook porque los campos, las reglas y la respuesta son identicos:
 * lo unico que cambia es a que endpoint va la plata.
 */
export function useRegistrarPago({ clienteId, facturaId, deuda, estadoFactura }: OpcionesPago) {
  const router = useRouter();
  const [pagarCliente, estadoPagoCliente] = useRegistrarPagoClienteMutation();
  const [pagarFactura, estadoPagoFactura] = useRegistrarPagoFacturaMutation();

  /**
   * El comprobante del pago recien guardado. Se separa de si el modal esta
   * abierto: al cerrarlo, el comprobante sigue (ver `cerrarComprobante`).
   */
  const [comprobante, setComprobante] = useState<RespuestaPago | null>(null);
  const [comprobanteAbierto, setComprobanteAbierto] = useState(false);

  /**
   * Clave de idempotencia del cobro (K1). Se crea en el primer envio y se
   * REUSA en cada reintento: si el primero llego y la respuesta no, el segundo
   * devuelve el mismo cobro en vez de registrarlo dos veces.
   */
  const clave = useRef<string | null>(null);

  const form = useForm<PagoForm>({
    resolver: zodResolver(pagoFormSchema),
    defaultValues: VACIO,
    mode: 'onChange',
  });

  const { control, setValue, setError } = form;
  const monto = useWatch({ control, name: 'monto' });
  const montoNumero = Number(monto) || 0;

  // Solo la factura en curso recibe pagos: una pagada o anulada no.
  const recibePagos = estadoFactura === undefined || estadoFactura === 'abierta';

  /*
   * Con el comprobante a la vista, la deuda queda congelada en la de antes del
   * pago: el propio pago invalida la ficha y la factura, y sin esto el refetch
   * cambiaria los numeros de la pantalla por debajo del modal.
   */
  const deudaVista = comprobante ? comprobante.entrega.saldoAnterior : deuda;

  /*
   * El tope se chequea aca y no en el schema: la deuda llega despues del primer
   * render. Se muestra en el campo MIENTRAS se escribe, que es cuando sirve, y
   * se vuelve a chequear al enviar. El 400 del backend queda de red.
   */
  const mensajeExcede = `Debe ${formatearMoneda(deudaVista)}: no puede dejar más.`;
  const excede = montoNumero > deudaVista;
  const quedaDebiendo = Math.max(0, deudaVista - montoNumero);

  /**
   * Sin deuda, o con una factura que no recibe pagos, no hay nada que cobrar.
   * Mientras esta el comprobante del pago que la dejo en cero, no se reemplaza
   * la pantalla: el modal quedaria colgando de un arbol que ya no existe.
   */
  const nadaQueCobrar = comprobante === null && (deuda <= 0 || !recibePagos);

  /** "Todo": el pago completo en un toque. */
  const pagarTodo = useCallback(() => {
    setValue('monto', String(deudaVista), { shouldValidate: true });
  }, [setValue, deudaVista]);

  const guardar = async (datos: PagoForm) => {
    const importe = Number(datos.monto);
    if (importe > deuda) {
      setError('monto', {
        type: 'deuda',
        message: `Debe ${formatearMoneda(deuda)}: no puede dejar más.`,
      });
      return;
    }

    const pago: PagoNuevo = {
      monto: importe,
      metodoPago: datos.metodoPago,
      // La nota en blanco no viaja: es opcional.
      ...(datos.nota ? { nota: datos.nota } : {}),
    };

    try {
      const claveIdempotencia = (clave.current ??= nuevaClaveIdempotencia());
      const respuesta = facturaId
        ? await pagarFactura({ facturaId, clienteId, pago, claveIdempotencia }).unwrap()
        : await pagarCliente({ clienteId, pago, claveIdempotencia }).unwrap();
      // Registrado: el proximo cobro es otro pedido y lleva otra clave.
      clave.current = null;
      setComprobante(respuesta);
      setComprobanteAbierto(true);
    } catch (fallo) {
      // El error queda en el estado de la mutacion y el cartel lo muestra desde
      // ahi. Lo que el back marca por campo (`detalles.campos.monto` en un
      // MONTO_MAYOR_A_DEUDA) baja ademas al input (K11).
      const detalle = interpretarError(fallo);
      aplicarDetalles(form, detalle);
      // Un 409 de clave ya invalido la ficha y las facturas (invalidatesTags
      // corre igual con el error manejado); el proximo intento va con otra.
      if (detalle?.codigo && CODIGOS_CLAVE_QUEMADA.includes(detalle.codigo)) {
        clave.current = null;
      }
    }
  };

  // `handleSubmit` corre recien al tocar Registrar, no durante el render:
  // `guardar` toca la ref de la clave y react-hooks/refs no deja pasarla a
  // nada que se ejecute mientras se dibuja.
  const enviar = () => form.handleSubmit(guardar)();

  /**
   * Cierra el comprobante y vuelve a donde se vino, que ya esta al dia.
   *
   * El comprobante NO se limpia: la pantalla no cambia de arbol (ni aparece
   * "No debe nada") durante la animacion de salida.
   */
  const cerrarComprobante = useCallback(() => {
    setComprobanteAbierto(false);
    volverDelFormulario(router, clienteId);
  }, [router, clienteId]);

  const detalle = interpretarError(facturaId ? estadoPagoFactura.error : estadoPagoCliente.error);

  /*
   * El cartel general. Sin respuesta no se sabe si se guardo, pero reintentar
   * con la misma clave no duplica: se dice eso y no "fallo". Lo que bajo a un
   * campo (el monto mayor a la deuda) no se repite arriba.
   */
  let error: string | null = null;
  if (detalle) {
    if (quedoEnDuda(detalle)) {
      error = 'No sabemos si se guardó. Tocá Registrar de nuevo: no se va a duplicar.';
    } else if (!detalle.campos) {
      error = detalle.mensaje;
    }
  }

  return {
    form,
    /** La deuda que se muestra: congelada mientras esta el comprobante. */
    deuda: deudaVista,
    montoNumero,
    excede,
    mensajeExcede,
    quedaDebiendo,
    /** Reemplaza el formulario por "No debe nada" / "no recibe pagos". */
    nadaQueCobrar,
    pagarTodo,
    enviar,
    // Bloqueado mientras va el request: dos toques serian dos pagos.
    guardando: estadoPagoCliente.isLoading || estadoPagoFactura.isLoading,
    error,
    comprobante,
    comprobanteAbierto,
    /** El cobro ya se habia registrado con la misma clave: no se duplico. */
    repetido: comprobante?.repetido ?? false,
    cerrarComprobante,
  };
}
