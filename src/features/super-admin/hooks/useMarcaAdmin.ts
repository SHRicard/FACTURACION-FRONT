import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import {
  useDetalleMarcaAdminQuery,
  useRecalcularMarcaMutation,
  useSacarDuenoAdminMutation,
  useSumarDuenoAdminMutation,
} from '../api/superAdminApi';
import { sumarDuenoFormSchema } from '../schemas';
import type { DuenoAdmin } from '../types';

/**
 * La ficha de una marca: datos, duenos, estadisticas y uso. Mas las acciones
 * de soporte: recalcular sus numeros y sumar o sacar duenos.
 *
 * Sumar y sacar siguen las mismas reglas que cuando lo hace un dueno: la marca
 * nunca queda sin duenos, y el DNI tiene que ser de una cuenta de administrador
 * sin marca. Los errores del backend van dentro del dialogo.
 */
export function useMarcaAdmin(id: string | undefined) {
  const consulta = useDetalleMarcaAdminQuery(id ?? '', { skip: !id });
  const { refetch } = consulta;

  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const detalleError = interpretarError(consulta.error);
  const [aviso, setAviso] = useState<string | null>(null);

  // ─── Recalcular ───
  const [recalcular, estadoRecalculo] = useRecalcularMarcaMutation();
  const recalcularEstadisticas = useCallback(async () => {
    if (!id) return;
    setAviso(null);
    try {
      await recalcular(id).unwrap();
      setAviso('Estadísticas recalculadas.');
    } catch (fallo) {
      setAviso(interpretarError(fallo)?.mensaje ?? 'No pudimos recalcular.');
    }
  }, [id, recalcular]);

  // ─── Sumar dueno ───
  const [sumando, setSumando] = useState(false);
  const [dni, setDni] = useState('');
  const [errorSumar, setErrorSumar] = useState<string | null>(null);
  const [sumar, estadoSumar] = useSumarDuenoAdminMutation();

  const pedirSumar = useCallback(() => {
    setDni('');
    setErrorSumar(null);
    setAviso(null);
    setSumando(true);
  }, []);

  const confirmarSumar = useCallback(async () => {
    if (!id) return;
    const leido = sumarDuenoFormSchema.safeParse({ dni });
    if (!leido.success) {
      setErrorSumar(leido.error.issues[0]?.message ?? 'Revisá el DNI.');
      return;
    }
    setErrorSumar(null);
    try {
      await sumar({ id, dni: leido.data.dni }).unwrap();
      setSumando(false);
      setAviso('Dueño sumado.');
    } catch (fallo) {
      const error = interpretarError(fallo);
      setErrorSumar(error?.campos?.dni ?? error?.mensaje ?? 'No pudimos sumarlo.');
    }
  }, [id, dni, sumar]);

  // ─── Sacar dueno ───
  const [aSacar, setASacar] = useState<DuenoAdmin | null>(null);
  const [errorSacar, setErrorSacar] = useState<string | null>(null);
  const [sacar, estadoSacar] = useSacarDuenoAdminMutation();

  const pedirSacar = useCallback((dueno: DuenoAdmin) => {
    setErrorSacar(null);
    setAviso(null);
    setASacar(dueno);
  }, []);

  const confirmarSacar = useCallback(async () => {
    if (!id || !aSacar) return;
    setErrorSacar(null);
    try {
      await sacar({ id, usuarioId: aSacar.id }).unwrap();
      setAviso(`${aSacar.nombre} ya no es dueño de esta marca.`);
      setASacar(null);
    } catch (fallo) {
      setErrorSacar(interpretarError(fallo)?.mensaje ?? 'No pudimos sacarlo.');
    }
  }, [id, aSacar, sacar]);

  return {
    detalle: consulta.data ?? null,
    cargando: consulta.isLoading,
    error: detalleError?.mensaje ?? null,
    noExiste: detalleError?.status === 404,
    refrescar,
    reintentar: refrescar,
    aviso,
    descartarAviso: useCallback(() => setAviso(null), []),
    recalculando: estadoRecalculo.isLoading,
    recalcular: recalcularEstadisticas,
    sumar: {
      abierto: sumando,
      pedir: pedirSumar,
      cancelar: useCallback(() => {
        if (!estadoSumar.isLoading) setSumando(false);
      }, [estadoSumar.isLoading]),
      confirmar: confirmarSumar,
      dni,
      setDni,
      enviando: estadoSumar.isLoading,
      error: errorSumar,
    },
    sacar: {
      dueno: aSacar,
      pedir: pedirSacar,
      cancelar: useCallback(() => {
        if (!estadoSacar.isLoading) setASacar(null);
      }, [estadoSacar.isLoading]),
      confirmar: confirmarSacar,
      enviando: estadoSacar.isLoading,
      error: errorSacar,
    },
  };
}
