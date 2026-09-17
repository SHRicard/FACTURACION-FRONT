import { useCallback, useState } from 'react';

import type { ImagenElegida } from '@/services/imagenes';
import { interpretarError } from '@/shared/utils';

import { useSacarLogoMutation } from '../api/marcasApi';
import type { Marca } from '../types';

import { useElegirLogo, useSubirLogo } from './useSubirLogo';

/**
 * El logo en Mi marca: uno solo, que cualquier dueño cambia o saca.
 *
 * Antes de subir se muestra la imagen elegida, para no pisar el logo con la
 * foto equivocada.
 */
export function useLogoMarca(marca: Marca | null) {
  const { elegir: abrirGaleria, eligiendo, aviso } = useElegirLogo();
  const { subir, fase, progreso } = useSubirLogo();
  const [sacar, { isLoading: sacando }] = useSacarLogoMutation();

  const [vistaPrevia, setVistaPrevia] = useState<ImagenElegida | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoSacar, setConfirmandoSacar] = useState(false);
  const [errorSacar, setErrorSacar] = useState<string | null>(null);

  const elegir = useCallback(async () => {
    const imagen = await abrirGaleria();
    if (imagen) {
      setError(null);
      setVistaPrevia(imagen);
    }
  }, [abrirGaleria]);

  /** Descartar la imagen elegida. A mitad de la subida no se puede. */
  const cancelar = useCallback(() => {
    if (fase === 'quieto') setVistaPrevia(null);
  }, [fase]);

  const confirmar = useCallback(async () => {
    if (!vistaPrevia) return;
    setError(null);
    const fallo = await subir(vistaPrevia);
    if (fallo) setError(fallo);
    else setVistaPrevia(null);
  }, [vistaPrevia, subir]);

  const pedirSacar = useCallback(() => {
    setErrorSacar(null);
    setConfirmandoSacar(true);
  }, []);

  const cancelarSacar = useCallback(() => setConfirmandoSacar(false), []);

  const confirmarSacar = useCallback(async () => {
    try {
      await sacar().unwrap();
      setConfirmandoSacar(false);
    } catch (fallo) {
      setErrorSacar(interpretarError(fallo)?.mensaje ?? 'No pudimos sacar el logo.');
    }
  }, [sacar]);

  return {
    /** Sin Cloudinary en el server, pedir la firma daria 503: no se ofrece. */
    puedeSubir: marca?.puedeSubirLogo ?? false,
    elegir,
    eligiendo,
    /** Lo que paso al elegir (formato, build viejo). Va en la seccion, no en el modal. */
    aviso,
    vistaPrevia,
    cancelar,
    confirmar,
    fase,
    /** De 0 a 1, mientras sube a Cloudinary. */
    progreso,
    error,
    confirmandoSacar,
    pedirSacar,
    cancelarSacar,
    confirmarSacar,
    sacando,
    errorSacar,
  };
}
