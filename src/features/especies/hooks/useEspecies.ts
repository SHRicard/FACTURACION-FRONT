import { useCallback, useState } from 'react';

import { interpretarError } from '@/shared/utils';

import {
  useEditarEspecieMutation,
  useEliminarEspecieMutation,
  useListarEspeciesQuery,
} from '../api/especiesApi';
import type { Especie, UsosEspecie } from '../types';

/**
 * A partir de cuantas especies se avisa que la lista se esta yendo de las
 * manos. Son CATEGORIAS, no productos: si terminan siendo sesenta, las metricas
 * dejan de agrupar nada y el sentido de la pantalla se pierde.
 */
export const ESPECIES_DEMASIADAS = 20;

/**
 * En que paso esta el borrado.
 *
 * Es una maquinita de dos pasos porque el 400 del backend no es un error para
 * mostrar y olvidar: es una segunda pregunta. Primero "¿la borro?", y si esta
 * en uso, "¿la desactivo en su lugar?".
 */
export type BorradoPendiente =
  | { paso: 'confirmar'; especie: Especie }
  | { paso: 'enUso'; especie: Especie; mensaje: string; usos: UsosEspecie };

/**
 * Los dos conteos del 400, o cero si el backend no los mando. Son datos de
 * `detalles` (K11), no mensajes de campo: llegan como numeros.
 */
function usosDelError(datos: Record<string, unknown> | null): UsosEspecie {
  const leer = (clave: string) => {
    const valor = datos?.[clave];
    return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0;
  };
  return { tickets: leer('tickets'), productos: leer('productos') };
}

/**
 * El listado de especies y todo lo que se le puede hacer desde la fila:
 * prender/apagar y borrar.
 *
 * La pantalla no sabe de endpoints ni de codigos de estado: recibe la lista, el
 * paso en el que esta el borrado y las funciones para avanzarlo.
 */
export function useEspecies() {
  const consulta = useListarEspeciesQuery();
  const [editar] = useEditarEspecieMutation();
  const [eliminar, estadoEliminar] = useEliminarEspecieMutation();

  const [pendiente, setPendiente] = useState<BorradoPendiente | null>(null);
  /** Errores de las acciones de la fila. La consulta tiene el suyo aparte. */
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const { refetch } = consulta;

  /** Para el gesto de tirar para abajo. Devuelve la promesa a proposito. */
  const refrescar = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * El interruptor de la fila. Desactivar no borra nada: los tickets viejos la
   * siguen nombrando y las metricas de ese periodo quedan intactas. Lo unico
   * que cambia es que deja de ofrecerse al cargar un ticket nuevo.
   */
  const alternarActivo = useCallback(
    async (especie: Especie) => {
      setErrorAccion(null);
      try {
        await editar({ id: especie.id, cambios: { activo: !especie.activo } }).unwrap();
      } catch (fallo) {
        setErrorAccion(interpretarError(fallo)?.mensaje ?? 'No pudimos guardar el cambio.');
      }
    },
    [editar],
  );

  const pedirBorrado = useCallback((especie: Especie) => {
    setErrorAccion(null);
    setPendiente({ paso: 'confirmar', especie });
  }, []);

  const cancelarBorrado = useCallback(() => setPendiente(null), []);

  /**
   * Avanza el paso en el que este: borra, y si el backend frena porque la
   * especie esta en uso, pasa a ofrecer la desactivacion.
   */
  const confirmarBorrado = useCallback(async () => {
    if (!pendiente) return;
    const { especie } = pendiente;

    if (pendiente.paso === 'enUso') {
      try {
        await editar({ id: especie.id, cambios: { activo: false } }).unwrap();
        setPendiente(null);
      } catch (fallo) {
        setErrorAccion(interpretarError(fallo)?.mensaje ?? 'No pudimos desactivarla.');
        setPendiente(null);
      }
      return;
    }

    try {
      await eliminar(especie.id).unwrap();
      setPendiente(null);
    } catch (fallo) {
      const error = interpretarError(fallo);

      // 400 = esta en uso. El mensaje del backend ya viene redactado y con el
      // numero adentro, asi que se muestra tal cual.
      if (error?.status === 400) {
        setPendiente({
          paso: 'enUso',
          especie,
          mensaje: error.mensaje,
          usos: usosDelError(error.datos),
        });
        return;
      }

      setErrorAccion(error?.mensaje ?? 'No pudimos borrarla.');
      setPendiente(null);
    }
  }, [pendiente, editar, eliminar]);

  const especies = consulta.data ?? [];

  return {
    especies,
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    errorAccion,
    /** Para el aviso: la lista dejo de ser un puñado de categorias. */
    listaLarga: especies.length >= ESPECIES_DEMASIADAS,
    /** El paso del borrado, o null si no hay ninguno en curso. */
    pendiente,
    borrando: estadoEliminar.isLoading,
    alternarActivo,
    pedirBorrado,
    cancelarBorrado,
    confirmarBorrado,
    refrescar,
    reintentar: refrescar,
  };
}
