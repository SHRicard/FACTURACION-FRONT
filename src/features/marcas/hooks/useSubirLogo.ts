import { useCallback, useState } from 'react';

import { elegirImagen, subirConFirma, type ImagenElegida } from '@/services/imagenes';
import { interpretarError } from '@/shared/utils';

import { useFirmarLogoMutation, useGuardarLogoMutation } from '../api/marcasApi';
import { FORMATOS_LOGO } from '../schemas';

/*
 * Las dos mitades del logo, sueltas: elegir la imagen y subirla. Las usan el
 * alta de la marca (elige ahora, sube cuando la marca ya existe) y Mi marca
 * (elige y sube en el momento).
 */

/** En que anda la subida. */
export type FaseLogo = 'quieto' | 'subiendo' | 'guardando';

const AVISO_ELECCION = {
  formatoInvalido: 'Ese formato no sirve para el logo. Elegí una imagen PNG, JPG o WEBP.',
  noDisponible:
    'Esta versión de la app todavía no puede elegir fotos. Actualizala para subir el logo.',
} as const;

const MENSAJE_SUBIDA = {
  rechazada: 'No pudimos subir la imagen. Probá de nuevo o elegí otra (PNG, JPG o WEBP).',
  sinConexion: 'Se cortó la conexión mientras subía. Probá de nuevo.',
} as const;

/** Abrir la galeria y quedarse con una imagen que sirva de logo. */
export function useElegirLogo() {
  const [eligiendo, setEligiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  /** La imagen elegida, o null si cancelo o no se pudo (y entonces queda el `aviso`). */
  const elegir = useCallback(async (): Promise<ImagenElegida | null> => {
    setAviso(null);
    setEligiendo(true);
    try {
      const resultado = await elegirImagen({ formatos: FORMATOS_LOGO });
      if (resultado.tipo === 'ok') return resultado.imagen;
      if (resultado.tipo !== 'cancelado') setAviso(AVISO_ELECCION[resultado.tipo]);
      return null;
    } catch {
      setAviso('No pudimos abrir tus fotos. Probá de nuevo.');
      return null;
    } finally {
      setEligiendo(false);
    }
  }, []);

  return { elegir, eligiendo, aviso };
}

/**
 * Subir el logo a la marca que ya existe, en los tres pasos de FACTURA_PDF.md:
 * la firma al backend, el archivo directo a Cloudinary y la `version` de vuelta
 * al backend.
 */
export function useSubirLogo() {
  const [firmar] = useFirmarLogoMutation();
  const [guardar] = useGuardarLogoMutation();
  const [fase, setFase] = useState<FaseLogo>('quieto');
  const [progreso, setProgreso] = useState(0);

  /** Null si quedo guardado; si no, el mensaje para mostrar. No tira. */
  const subir = useCallback(
    async (imagen: ImagenElegida): Promise<string | null> => {
      setProgreso(0);
      setFase('subiendo');
      try {
        const firma = await firmar().unwrap();
        const subida = await subirConFirma(firma, imagen, setProgreso);
        if (subida.tipo !== 'ok') return MENSAJE_SUBIDA[subida.tipo];
        setFase('guardando');
        await guardar(subida.version).unwrap();
        return null;
      } catch (fallo) {
        // 429 (muchas firmas), 400 (el logo no llego a Cloudinary): el backend
        // dice que hacer.
        return interpretarError(fallo)?.mensaje ?? 'No pudimos guardar el logo.';
      } finally {
        setFase('quieto');
      }
    },
    [firmar, guardar],
  );

  return {
    subir,
    fase,
    /** De 0 a 1, mientras sube a Cloudinary. */
    progreso,
  };
}
