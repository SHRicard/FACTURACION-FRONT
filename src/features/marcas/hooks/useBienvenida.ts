import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useLazyUsuarioActualQuery } from '@/features/auth/api/authApi';
import { pendienteActualizado, sesionRestaurada } from '@/features/auth/store/authSlice';
import { baseApi } from '@/services/api';
import type { ImagenElegida } from '@/services/imagenes';
import { interpretarError } from '@/shared/utils';
import { useAppDispatch } from '@/store';

import { useCompletarPerfilMutation, useCrearMarcaMutation } from '../api/marcasApi';
import { COMBINACION_INICIAL, normalizarColor } from '../paleta';
import { marcaFormSchema, perfilFormSchema } from '../schemas';
import type { ColoresEnEdicion, MarcaForm, PerfilForm } from '../types';

import { useElegirLogo, useSubirLogo } from './useSubirLogo';

/*
 * Ninguno de estos hooks navega: cambian el `pendiente` de la sesion y la
 * puerta de la bienvenida redirige sola (al paso siguiente o a la app). Asi hay
 * UN lugar que decide a donde se va, y no un `router.replace` por pantalla que
 * se puede ir desincronizando.
 */

/**
 * Al entrar a la app con marca nueva, la cache de RTK Query puede tener los 403
 * de antes ("crea tu marca"). Se tira entera para que cada pantalla pida lo suyo
 * de cero, ya con la marca.
 */
function useEntrarConMarca() {
  const dispatch = useAppDispatch();

  return useCallback(() => {
    dispatch(pendienteActualizado(null));
    dispatch(baseApi.util.resetApiState());
  }, [dispatch]);
}

/** Paso 1: cargar el DNI. Se hace UNA vez y no se cambia despues. */
export function useCompletarPerfil() {
  const dispatch = useAppDispatch();
  const [completar, { isLoading, error }] = useCompletarPerfilMutation();

  const form = useForm<PerfilForm>({
    resolver: zodResolver(perfilFormSchema),
    defaultValues: { dni: '' },
    mode: 'onSubmit',
  });

  const enviar = form.handleSubmit(async ({ dni }) => {
    try {
      const respuesta = await completar(dni).unwrap();
      dispatch(sesionRestaurada(respuesta));
    } catch (fallo) {
      // 400 (DNI mal escrito) y 409 (ya lo tiene otra cuenta) son del campo:
      // van debajo del DNI, no en el cartel de arriba.
      const detalle = interpretarError(fallo);
      if (detalle?.status === 400 || detalle?.status === 409) {
        form.setError('dni', { type: 'server', message: detalle.mensaje });
      }
    }
  });

  const detalle = interpretarError(error);

  return {
    form,
    enviar,
    cargando: isLoading,
    error: detalle && detalle.status !== 400 && detalle.status !== 409 ? detalle.mensaje : null,
  };
}

/** La marca se creo, pero el logo no quedo guardado. */
interface LogoFallido {
  mensaje: string;
  /** False si el server no tiene Cloudinary: reintentar no serviria. */
  reintentable: boolean;
}

/** Los campos del alta que el backend puede nombrar en `detalles.campo`. */
const CAMPOS_DEL_ALTA = [
  'nombre',
  'direccion',
  'telefono',
  'colorPrimario',
  'colorSecundario',
] as const;

type CampoDelAlta = (typeof CAMPOS_DEL_ALTA)[number];

const esCampoDelAlta = (campo: unknown): campo is CampoDelAlta =>
  CAMPOS_DEL_ALTA.includes(campo as CampoDelAlta);

/**
 * Paso 2, camino A: crear la marca propia, con su logo y sus colores.
 *
 * El logo se elige en el formulario pero se sube DESPUES de crear la marca:
 * sus rutas cuelgan de `/marcas/mia` y antes no hay marca. Es opcional: sin
 * logo se avisa que lo va a necesitar para las facturas y se deja seguir.
 *
 * Los colores arrancan con un par ya elegido (no el violeta de la app), asi
 * nadie queda con los colores de la app por no tocar el selector.
 */
export function useCrearMarca() {
  const entrar = useEntrarConMarca();
  const [crear, { isLoading: creando, error }] = useCrearMarcaMutation();
  const { elegir: abrirGaleria, eligiendo, aviso: avisoLogo } = useElegirLogo();
  const { subir, fase, progreso } = useSubirLogo();

  const [logo, setLogo] = useState<ImagenElegida | null>(null);
  /** Los datos ya validados, esperando que confirme seguir sin logo. */
  const [sinLogoPorConfirmar, setSinLogoPorConfirmar] = useState<MarcaForm | null>(null);
  /**
   * Desde aca la marca YA existe: volver a crearla daria 409 ("Ya tenes una
   * marca"). Queda reintentar el logo o seguir sin el.
   */
  const [logoFallido, setLogoFallido] = useState<LogoFallido | null>(null);

  const form = useForm<MarcaForm>({
    resolver: zodResolver(marcaFormSchema),
    defaultValues: {
      nombre: '',
      direccion: '',
      telefono: '',
      colorPrimario: COMBINACION_INICIAL.primario,
      colorSecundario: COMBINACION_INICIAL.secundario,
    },
    mode: 'onBlur',
  });

  // `useWatch` y no `form.watch`: el compilador de React no puede memoizar `watch`.
  const [nombre, colorPrimario, colorSecundario] = useWatch({
    control: form.control,
    name: ['nombre', 'colorPrimario', 'colorSecundario'],
  });

  const subirLogoYEntrar = useCallback(
    async (imagen: ImagenElegida) => {
      setLogoFallido(null);
      const fallo = await subir(imagen);
      if (fallo) setLogoFallido({ mensaje: fallo, reintentable: true });
      else entrar();
    },
    [subir, entrar],
  );

  const crearMarca = useCallback(
    async (datos: MarcaForm) => {
      try {
        const marca = await crear({
          ...datos,
          colorPrimario: normalizarColor(datos.colorPrimario),
          colorSecundario: normalizarColor(datos.colorSecundario),
        }).unwrap();
        if (!logo) {
          entrar();
          return;
        }
        // Recien con la marca creada se sabe si el server puede guardar logos.
        if (!marca.puedeSubirLogo) {
          setLogoFallido({
            mensaje:
              'Tu marca quedó creada, pero ahora no se pueden guardar logos. Subilo más tarde desde Mi marca.',
            reintentable: false,
          });
          return;
        }
        await subirLogoYEntrar(logo);
      } catch (fallo) {
        const detalle = interpretarError(fallo);
        // Un campo muy largo, vacio o un color que no es hex: el backend dice
        // cual en `detalles.campo`, y va debajo de ese campo.
        const campo = detalle?.detalles?.['campo'];
        if (detalle?.status === 400 && esCampoDelAlta(campo)) {
          form.setError(campo, { type: 'server', message: detalle.mensaje });
        }
      }
    },
    [crear, logo, entrar, subirLogoYEntrar, form],
  );

  const enviar = form.handleSubmit(async (datos) => {
    if (!logo) {
      setSinLogoPorConfirmar(datos);
      return;
    }
    await crearMarca(datos);
  });

  const elegirLogo = useCallback(async () => {
    const imagen = await abrirGaleria();
    if (imagen) setLogo(imagen);
  }, [abrirGaleria]);

  const seguirSinLogo = useCallback(async () => {
    const datos = sinLogoPorConfirmar;
    setSinLogoPorConfirmar(null);
    if (datos) await crearMarca(datos);
  }, [sinLogoPorConfirmar, crearMarca]);

  /** Desde el aviso de "sin logo": lo cierra y abre la galeria. */
  const elegirDesdeAviso = useCallback(async () => {
    setSinLogoPorConfirmar(null);
    await elegirLogo();
  }, [elegirLogo]);

  const reintentarLogo = useCallback(async () => {
    if (logo) await subirLogoYEntrar(logo);
  }, [logo, subirLogoYEntrar]);

  /** Para "usar mi ubicacion": escribe la direccion como si la hubieran tipeado. */
  const ponerDireccion = useCallback(
    (direccion: string) =>
      form.setValue('direccion', direccion, { shouldValidate: true, shouldDirty: true }),
    [form],
  );

  const cambiarColores = useCallback(
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

  const colores: ColoresEnEdicion = {
    primario: colorPrimario,
    secundario: colorSecundario,
    cambiar: cambiarColores,
    errores: {
      primario: form.formState.errors.colorPrimario?.message,
      secundario: form.formState.errors.colorSecundario?.message,
    },
    previa: {
      primario: normalizarColor(colorPrimario),
      secundario: normalizarColor(colorSecundario),
    },
  };

  const detalle = interpretarError(error);

  return {
    form,
    enviar,
    ponerDireccion,
    /** Lo que va escrito en el nombre: la vista previa de los colores lo muestra. */
    nombre,
    colores,
    cargando: creando || fase !== 'quieto',
    error: detalle && !esCampoDelAlta(detalle.detalles?.['campo']) ? detalle.mensaje : null,
    logo: {
      uri: logo?.uri ?? null,
      elegir: elegirLogo,
      quitar: () => setLogo(null),
      eligiendo,
      aviso: avisoLogo,
      fase,
      progreso,
    },
    sinLogo: {
      visible: sinLogoPorConfirmar !== null,
      seguir: seguirSinLogo,
      elegir: elegirDesdeAviso,
      cancelar: () => setSinLogoPorConfirmar(null),
    },
    logoFallido: logoFallido
      ? { ...logoFallido, reintentar: reintentarLogo, seguirSinLogo: entrar }
      : null,
  };
}

/**
 * Paso 2, camino B: esperar a que un socio lo sume con su DNI. "Ya me sumo"
 * vuelve a pedir `/auth/me`: si ya no le falta la marca, entra.
 */
export function useEsperarSocio() {
  const dispatch = useAppDispatch();
  const entrar = useEntrarConMarca();
  const [pedirUsuario, { isFetching }] = useLazyUsuarioActualQuery();
  const [aviso, setAviso] = useState<string | null>(null);

  const comprobar = useCallback(async () => {
    setAviso(null);
    try {
      const actual = await pedirUsuario().unwrap();
      if (actual.pendiente === null) {
        entrar();
        dispatch(sesionRestaurada(actual));
        return;
      }
      dispatch(sesionRestaurada(actual));
      setAviso('Todavía no te sumó. Pasale tu DNI y probá de nuevo en un rato.');
    } catch (fallo) {
      setAviso(interpretarError(fallo)?.mensaje ?? 'No pudimos comprobarlo. Probá de nuevo.');
    }
  }, [pedirUsuario, dispatch, entrar]);

  return { comprobar, comprobando: isFetching, aviso };
}
