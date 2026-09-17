import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useSesion } from '@/features/auth/hooks';
import { pendienteActualizado } from '@/features/auth/store/authSlice';
import { baseApi } from '@/services/api';
import { interpretarError } from '@/shared/utils';
import { useAppDispatch } from '@/store';

import {
  useEditarMarcaMutation,
  useIrmeDeMarcaMutation,
  useMiMarcaQuery,
  useSacarDuenoMutation,
  useSumarDuenoMutation,
} from '../api/marcasApi';
import { COLORES_DE_LA_APP, normalizarColor } from '../paleta';
import { coloresMarcaFormSchema, sumarDuenoFormSchema, textosMarcaFormSchema } from '../schemas';
import type {
  ColoresEnEdicion,
  ColoresMarcaForm,
  Dueno,
  Marca,
  SumarDuenoForm,
  TextosMarcaForm,
} from '../types';

/** La marca, sus duenos y lo que mueve. */
export function useMiMarca() {
  const { usuario } = useSesion();
  const consulta = useMiMarcaQuery();
  const marca = consulta.data ?? null;

  const refrescar = useCallback(async () => {
    await consulta.refetch();
  }, [consulta]);

  return {
    marca,
    cargando: consulta.isLoading,
    error: interpretarError(consulta.error)?.mensaje ?? null,
    reintentar: consulta.refetch,
    refrescar,
    /** Para marcar "vos" en la lista y no ofrecer "sacar" sobre uno mismo. */
    miId: usuario?.id ?? null,
    /** El ultimo dueno no puede irse ni ser sacado: la marca no queda sin duenos. */
    unicoDueno: (marca?.duenos.length ?? 0) <= 1,
  };
}

/** Sumar un dueno por DNI: entra al instante. */
export function useSumarDueno() {
  const [sumar, { isLoading }] = useSumarDuenoMutation();
  const [sumado, setSumado] = useState<string | null>(null);

  const form = useForm<SumarDuenoForm>({
    resolver: zodResolver(sumarDuenoFormSchema),
    defaultValues: { dni: '' },
    mode: 'onSubmit',
  });

  const enviar = form.handleSubmit(async ({ dni }) => {
    setSumado(null);
    try {
      const marca = await sumar(dni).unwrap();
      const nuevo = marca.duenos.find((dueno) => dueno.dni === dni);
      setSumado(nuevo ? `${nuevo.nombre} ya es dueño.` : 'Listo: ya es dueño.');
      form.reset({ dni: '' });
    } catch (fallo) {
      // 404 (nadie con ese DNI), 409 (ya es dueno o tiene su marca), 400: los
      // mensajes del backend dicen que hacer, y son del campo.
      form.setError('dni', {
        type: 'server',
        message: interpretarError(fallo)?.mensaje ?? 'No pudimos sumarlo.',
      });
    }
  });

  return { form, enviar, sumando: isLoading, sumado };
}

/** Sacar a otro dueno, con confirmacion. */
export function useSacarDueno() {
  const [sacar, { isLoading }] = useSacarDuenoMutation();
  const [dueno, setDueno] = useState<Dueno | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pedirConfirmacion = useCallback((elegido: Dueno) => {
    setError(null);
    setDueno(elegido);
  }, []);

  const cancelar = useCallback(() => setDueno(null), []);

  const confirmar = useCallback(async () => {
    if (!dueno) return;
    try {
      await sacar(dueno.id).unwrap();
      setDueno(null);
    } catch (fallo) {
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos sacarlo.');
    }
  }, [dueno, sacar]);

  return { dueno, pedirConfirmacion, cancelar, confirmar, sacando: isLoading, error };
}

/**
 * Irse de la marca. No se lleva nada: lo que cargo queda en la marca. Al salir
 * queda sin marca y la puerta del area de administrador lo manda a la
 * bienvenida.
 */
export function useIrmeDeMarca(miId: string | null) {
  const dispatch = useAppDispatch();
  const [irme, { isLoading }] = useIrmeDeMarcaMutation();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = useCallback(async () => {
    if (!miId) return;
    setError(null);
    try {
      const respuesta = await irme(miId).unwrap();
      setConfirmando(false);
      dispatch(pendienteActualizado(respuesta.pendiente ?? 'marca'));
      // Lo que quedo en cache es de la marca que dejo: no se tiene que ver mas.
      dispatch(baseApi.util.resetApiState());
    } catch (fallo) {
      setError(interpretarError(fallo)?.mensaje ?? 'No pudimos sacarte de la marca.');
    }
  }, [miId, irme, dispatch]);

  return {
    confirmando,
    pedirConfirmacion: () => {
      setError(null);
      setConfirmando(true);
    },
    cancelar: () => setConfirmando(false),
    confirmar,
    saliendo: isLoading,
    error,
  };
}

/** Los textos como estan. `PUT /marcas/mia` los reemplaza: tienen que viajar siempre. */
const textosDe = (marca: Marca): TextosMarcaForm => ({
  nombre: marca.nombre,
  direccion: marca.direccion ?? '',
  telefono: marca.telefono ?? '',
});

/**
 * Editar nombre, direccion y telefono. Lo puede hacer cualquier dueno. No
 * manda los colores: asi el backend los deja como estan.
 */
export function useEditarMarca(marca: Marca | null) {
  const [editar, { isLoading, error }] = useEditarMarcaMutation();
  const [abierto, setAbierto] = useState(false);

  const form = useForm<TextosMarcaForm>({
    resolver: zodResolver(textosMarcaFormSchema),
    defaultValues: { nombre: '', direccion: '', telefono: '' },
    mode: 'onBlur',
  });

  const abrir = useCallback(() => {
    if (!marca) return;
    // Se carga al abrir, no al montar: asi siempre arranca con lo ultimo.
    form.reset(textosDe(marca));
    setAbierto(true);
  }, [marca, form]);

  const enviar = form.handleSubmit(async (datos) => {
    try {
      await editar(datos).unwrap();
      setAbierto(false);
    } catch {
      // Queda en `error` y se muestra en el modal.
    }
  });

  /** Para "usar mi ubicacion": escribe la direccion como si la hubieran tipeado. */
  const ponerDireccion = useCallback(
    (direccion: string) =>
      form.setValue('direccion', direccion, { shouldValidate: true, shouldDirty: true }),
    [form],
  );

  return {
    form,
    abierto,
    abrir,
    cerrar: () => setAbierto(false),
    enviar,
    ponerDireccion,
    guardando: isLoading,
    error: interpretarError(error)?.mensaje ?? null,
  };
}

/** Los que tiene la marca; si no eligio, los de la app, que son con los que sale hoy. */
const coloresDe = (marca: Marca): ColoresMarcaForm => ({
  colorPrimario: marca.colorPrimario ?? COLORES_DE_LA_APP.primario,
  colorSecundario: marca.colorSecundario ?? marca.colorPrimario ?? COLORES_DE_LA_APP.secundario,
});

/**
 * Los colores de la factura, desde Mi marca. Guarda solo los colores (los
 * textos viajan como estan) y deja volver a los de la app.
 */
export function useColoresMarca(marca: Marca | null) {
  const [editar, { isLoading, error, reset: limpiarError }] = useEditarMarcaMutation();
  const [abierto, setAbierto] = useState(false);

  const form = useForm<ColoresMarcaForm>({
    resolver: zodResolver(coloresMarcaFormSchema),
    defaultValues: {
      colorPrimario: COLORES_DE_LA_APP.primario,
      colorSecundario: COLORES_DE_LA_APP.secundario,
    },
    mode: 'onSubmit',
  });

  // `useWatch` y no `form.watch`: el compilador de React no puede memoizar `watch`.
  const [primario, secundario] = useWatch({
    control: form.control,
    name: ['colorPrimario', 'colorSecundario'],
  });

  const abrir = useCallback(() => {
    if (!marca) return;
    limpiarError();
    form.reset(coloresDe(marca));
    setAbierto(true);
  }, [marca, form, limpiarError]);

  const cambiar = useCallback(
    (colores: { primario?: string; secundario?: string }) => {
      const opciones = { shouldDirty: true, shouldValidate: form.formState.isSubmitted };
      if (colores.primario !== undefined)
        form.setValue('colorPrimario', colores.primario, opciones);
      if (colores.secundario !== undefined) {
        form.setValue('colorSecundario', colores.secundario, opciones);
      }
    },
    [form],
  );

  const guardar = form.handleSubmit(async ({ colorPrimario, colorSecundario }) => {
    if (!marca) return;
    try {
      await editar({
        ...textosDe(marca),
        colorPrimario: normalizarColor(colorPrimario),
        colorSecundario: normalizarColor(colorSecundario),
      }).unwrap();
      setAbierto(false);
    } catch {
      // Queda en `error` y se muestra en el modal.
    }
  });

  /** `null` en los dos: el PDF vuelve a los violetas de la app. */
  const usarLosDeLaApp = useCallback(async () => {
    if (!marca) return;
    try {
      await editar({ ...textosDe(marca), colorPrimario: null, colorSecundario: null }).unwrap();
      setAbierto(false);
    } catch {
      // Queda en `error` y se muestra en el modal.
    }
  }, [marca, editar]);

  const colores: ColoresEnEdicion = {
    primario,
    secundario,
    cambiar,
    errores: {
      primario: form.formState.errors.colorPrimario?.message,
      secundario: form.formState.errors.colorSecundario?.message,
    },
    previa: { primario: normalizarColor(primario), secundario: normalizarColor(secundario) },
  };

  return {
    abierto,
    abrir,
    cerrar: () => setAbierto(false),
    colores,
    guardar,
    usarLosDeLaApp,
    guardando: isLoading,
    /** Todavia no eligio: la factura sale con los colores de la app. */
    sinColores: !marca?.colorPrimario && !marca?.colorSecundario,
    error: interpretarError(error)?.mensaje ?? null,
  };
}
