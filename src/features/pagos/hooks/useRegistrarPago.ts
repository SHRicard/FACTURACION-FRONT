import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { formatearMoneda, interpretarError, volverDelFormulario } from '@/shared/utils';

import { useRegistrarPagoClienteMutation, useRegistrarPagoFacturaMutation } from '../api/pagosApi';
import { pagoFormSchema } from '../schemas';
import type { PagoForm, PagoNuevo, RespuestaPago } from '../types';

const VACIO: PagoForm = { monto: '', metodoPago: 'efectivo', nota: '' };

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
}

/**
 * El formulario de un pago, para las dos puertas.
 *
 * Es el mismo hook porque los campos, las reglas y la respuesta son identicos:
 * lo unico que cambia es a que endpoint va la plata.
 */
export function useRegistrarPago({ clienteId, facturaId, deuda }: OpcionesPago) {
  const router = useRouter();
  const [pagarCliente, estadoCliente] = useRegistrarPagoClienteMutation();
  const [pagarFactura, estadoFactura] = useRegistrarPagoFacturaMutation();

  /** El comprobante que se muestra despues de guardar. */
  const [comprobante, setComprobante] = useState<RespuestaPago | null>(null);

  const form = useForm<PagoForm>({
    resolver: zodResolver(pagoFormSchema),
    defaultValues: VACIO,
    mode: 'onChange',
  });

  const { control, setValue, setError } = form;
  const monto = useWatch({ control, name: 'monto' });
  const montoNumero = Number(monto) || 0;

  /*
   * El tope se chequea aca y no en el schema: la deuda llega despues del primer
   * render. Se muestra en el campo MIENTRAS se escribe, que es cuando sirve, y
   * se vuelve a chequear al enviar. El 400 del backend queda de red.
   */
  const mensajeExcede = `Debe ${formatearMoneda(deuda)}: no puede dejar más.`;
  const excede = montoNumero > deuda;
  const quedaDebiendo = Math.max(0, deuda - montoNumero);

  /** "Todo": el pago completo en un toque. */
  const pagarTodo = useCallback(() => {
    setValue('monto', String(deuda), { shouldValidate: true });
  }, [setValue, deuda]);

  const enviar = form.handleSubmit(async (datos) => {
    const importe = Number(datos.monto);
    if (importe > deuda) {
      setError('monto', { type: 'deuda', message: mensajeExcede });
      return;
    }

    const pago: PagoNuevo = {
      monto: importe,
      metodoPago: datos.metodoPago,
      // La nota en blanco no viaja: es opcional.
      ...(datos.nota ? { nota: datos.nota } : {}),
    };

    try {
      const respuesta = facturaId
        ? await pagarFactura({ facturaId, clienteId, pago }).unwrap()
        : await pagarCliente({ clienteId, pago }).unwrap();
      setComprobante(respuesta);
    } catch {
      // El error queda en el estado de la mutacion y se muestra desde ahi: los
      // mensajes del backend vienen redactados ("Esta dejando mas de lo que
      // debe. La deuda es de $51000"). El catch es para no dejar la promesa
      // sin atender.
    }
  });

  /** Cierra el comprobante y vuelve a donde se vino, que ya esta al dia. */
  const cerrarComprobante = useCallback(() => {
    setComprobante(null);
    volverDelFormulario(router, clienteId);
  }, [router, clienteId]);

  const error = interpretarError(facturaId ? estadoFactura.error : estadoCliente.error);

  return {
    form,
    montoNumero,
    excede,
    mensajeExcede,
    quedaDebiendo,
    pagarTodo,
    enviar,
    // Bloqueado mientras va el request: dos toques serian dos pagos.
    guardando: estadoCliente.isLoading || estadoFactura.isLoading,
    error: error?.mensaje ?? null,
    comprobante,
    cerrarComprobante,
  };
}
