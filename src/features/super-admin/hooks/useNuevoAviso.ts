import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { aplicarDetalles, contar, interpretarError } from '@/shared/utils';

import {
  useAlcanceAvisosQuery,
  useCrearAvisoMutation,
  useEnviarPruebaAvisoMutation,
} from '../api/avisosApi';
import { problemaDeCredenciales } from '../formato';
import { nuevoAvisoFormSchema } from '../schemas';
import type { NuevoAvisoForm } from '../types';

const VACIO: NuevoAvisoForm = { titulo: '', mensaje: '', tipo: 'aviso' };

/** Mismo titulo y mensaje hace menos de 10 minutos: un doble clic. */
const CODIGO_REPETIDO = 'AVISO_REPETIDO';
/** El super_admin no tiene ningun telefono registrado para la prueba. */
const CODIGO_SIN_DISPOSITIVOS = 'SIN_DISPOSITIVOS';

/** Lo que dejo la ultima prueba, para el cartel debajo de los botones. */
type ResultadoMostrado = { texto: string; tono: 'success' | 'error' };

/**
 * Redactar un aviso: formulario, alcance ("le llega a N telefonos"), enviar
 * una prueba a los telefonos propios y enviar a todos con confirmacion.
 *
 * Mandar a todos no se puede deshacer: la notificacion llega al instante. Por
 * eso siempre pasa por el dialogo con el alcance.
 */
export function useNuevoAviso() {
  const router = useRouter();
  const alcance = useAlcanceAvisosQuery();
  const [probar, estadoPrueba] = useEnviarPruebaAvisoMutation();
  const [crear, estadoCrear] = useCrearAvisoMutation();
  const [confirmando, setConfirmando] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState<ResultadoMostrado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<NuevoAvisoForm>({
    resolver: zodResolver(nuevoAvisoFormSchema),
    defaultValues: VACIO,
    mode: 'onBlur',
  });

  const [titulo, mensaje, tipo] = useWatch({
    control: form.control,
    name: ['titulo', 'mensaje', 'tipo'],
  });

  /** Los errores del back: por campo bajo su input; el resto, arriba. */
  const mostrarFallo = useCallback(
    (fallo: unknown, porDefecto: string) => {
      const detalle = interpretarError(fallo);
      const bajoCampos = aplicarDetalles(form, detalle);
      if (!bajoCampos) setError(detalle?.mensaje ?? porDefecto);
    },
    [form],
  );

  const enviarPrueba = form.handleSubmit(async (datos) => {
    setError(null);
    setResultadoPrueba(null);
    try {
      const resultado = await probar(datos).unwrap();
      const credenciales = problemaDeCredenciales(resultado.errores);
      setResultadoPrueba(
        credenciales
          ? { texto: credenciales, tono: 'error' }
          : resultado.enviados > 0
            ? {
                texto: `Prueba enviada a ${contar(resultado.enviados, 'teléfono tuyo', 'teléfonos tuyos')}. Revisá cómo quedó.`,
                tono: 'success',
              }
            : {
                texto: `Expo rechazó la prueba en ${contar(resultado.rechazados, 'teléfono', 'teléfonos')}.`,
                tono: 'error',
              },
      );
    } catch (fallo) {
      if (interpretarError(fallo)?.codigo === CODIGO_SIN_DISPOSITIVOS) {
        setResultadoPrueba({
          texto:
            'No tenés ningún teléfono registrado. Abrí la app en tu teléfono con esta cuenta y aceptá las notificaciones.',
          tono: 'error',
        });
        return;
      }
      mostrarFallo(fallo, 'No pudimos enviar la prueba.');
    }
  });

  /** Valida y abre la confirmacion. El envio real va en `confirmarEnvio`. */
  const pedirConfirmacion = form.handleSubmit(() => {
    setError(null);
    void alcance.refetch();
    setConfirmando(true);
  });

  const confirmarEnvio = form.handleSubmit(async (datos) => {
    try {
      const aviso = await crear(datos).unwrap();
      setConfirmando(false);
      // `replace`: volver al formulario invitaria a mandarlo dos veces.
      router.replace(`/super-admin/mas/avisos/${aviso.id}`);
    } catch (fallo) {
      setConfirmando(false);
      const detalle = interpretarError(fallo);
      if (detalle?.codigo === CODIGO_REPETIDO) {
        const previo = detalle.datos?.['aviso'];
        const idPrevio =
          typeof previo === 'string'
            ? previo
            : typeof previo === 'object' && previo !== null && '_id' in previo
              ? String((previo as { _id: unknown })._id)
              : null;
        if (idPrevio) {
          router.replace(`/super-admin/mas/avisos/${idPrevio}`);
          return;
        }
        setError('Ya mandaste este aviso hace un momento.');
        return;
      }
      mostrarFallo(fallo, 'No pudimos enviar el aviso.');
    }
  });

  return {
    form,
    titulo,
    mensaje,
    tipo,
    elegirTipo: (nuevo: NuevoAvisoForm['tipo']) => form.setValue('tipo', nuevo),
    alcance: alcance.data ?? null,
    cargandoAlcance: alcance.isFetching,
    enviarPrueba,
    probando: estadoPrueba.isLoading,
    resultadoPrueba,
    pedirConfirmacion,
    confirmando,
    cancelarConfirmacion: useCallback(() => {
      if (!estadoCrear.isLoading) setConfirmando(false);
    }, [estadoCrear.isLoading]),
    confirmarEnvio,
    enviando: estadoCrear.isLoading,
    error,
  };
}
