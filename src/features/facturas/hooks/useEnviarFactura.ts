import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Linking } from 'react-native';

import { API_BASE_URL } from '@/config';
import { useMiMarcaQuery } from '@/features/marcas/api/marcasApi';
import { headersDeApp, headersDeSesion } from '@/services/api';
import { compartirArchivo } from '@/services/archivos';
import { aplicarDetalles, interpretarError } from '@/shared/utils';

import {
  useDarDeBajaEnlacesMutation,
  useEnlaceFacturaMutation,
  useEnviarFacturaPorMailMutation,
} from '../api/facturasApi';
import { nombreArchivoFactura } from '../archivo';
import { mailFacturaFormSchema } from '../schemas';
import type { FacturaDetalle, MailFacturaForm } from '../types';

export interface AvisoEnvio {
  texto: string;
  tono: 'success' | 'warning' | 'error';
}

/** La descarga del PDF no pasa por RTK Query: el error llega como codigo HTTP pelado. */
function mensajeDeDescarga(status: number | null): string {
  switch (status) {
    case null:
      return 'No pudimos conectarnos con el servidor. Revisá tu conexión.';
    case 401:
      return 'Tu sesión venció. Salí y volvé a entrar.';
    case 404:
      return 'Esa factura ya no existe.';
    case 429:
      return 'Demasiados intentos. Esperá un rato y probá de nuevo.';
    default:
      return 'No pudimos armar la factura. Probá de nuevo.';
  }
}

/**
 * Mandarle la factura al cliente, con la marca:
 *   - "Generar factura": el PDF, por el menu de compartir del telefono;
 *   - el link por WhatsApp, con el mensaje ya escrito;
 *   - por mail, con el PDF adjunto.
 *
 * Regla del negocio: sin logo no se genera la factura. Se exige solo si el
 * server puede guardar logos (`puedeSubirLogo`): si no, nadie podria cumplirla.
 */
export function useEnviarFactura(detalle: FacturaDetalle | undefined) {
  const { data: marca } = useMiMarcaQuery();
  const [pedirEnlace, { isLoading: armandoEnlace }] = useEnlaceFacturaMutation();
  const [mandarMail, { isLoading: enviandoMail }] = useEnviarFacturaPorMailMutation();
  const [darDeBaja, { isLoading: dandoDeBaja }] = useDarDeBajaEnlacesMutation();

  const [generando, setGenerando] = useState(false);
  const [aviso, setAviso] = useState<AvisoEnvio | null>(null);
  const [pidiendoLogo, setPidiendoLogo] = useState(false);
  /** El link de WhatsApp en espera: el cliente no tiene un celular que sirva. */
  const [enlaceSinCelular, setEnlaceSinCelular] = useState<string | null>(null);
  const [mailAbierto, setMailAbierto] = useState(false);
  const [errorMail, setErrorMail] = useState<string | null>(null);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  const form = useForm<MailFacturaForm>({
    resolver: zodResolver(mailFacturaFormSchema),
    defaultValues: { email: '', mensaje: '' },
    mode: 'onSubmit',
  });

  const faltaLogo = Boolean(marca && !marca.logoUrl && marca.puedeSubirLogo);
  const facturaId = detalle?.factura.id;

  /** Corre la accion si la marca tiene logo; si no, pide subirlo. */
  const conLogo = useCallback(
    (accion: () => void) => {
      setAviso(null);
      if (faltaLogo) {
        setPidiendoLogo(true);
        return;
      }
      accion();
    },
    [faltaLogo],
  );

  const generarPdf = useCallback(async () => {
    if (!detalle) return;
    setGenerando(true);
    try {
      const resultado = await compartirArchivo({
        url: `${API_BASE_URL}/facturas/${encodeURIComponent(detalle.factura.id)}/pdf`,
        // `X-App-Version` en TODA request: con ella el panel sabe qué versión usa
        // cada cuenta (docs/SUPER_ADMIN.md, 9.1).
        headers: { ...headersDeApp(), ...headersDeSesion() },
        nombre: nombreArchivoFactura(detalle),
        mimeType: 'application/pdf',
        uti: 'com.adobe.pdf',
        tituloMenu: 'Mandar la factura',
      });
      if (resultado.tipo === 'fallo') {
        setAviso({ texto: mensajeDeDescarga(resultado.status), tono: 'error' });
      } else if (resultado.tipo === 'noDisponible') {
        setAviso({
          texto:
            'Esta versión de la app todavía no puede compartir archivos. Actualizala, o mandala por WhatsApp o mail.',
          tono: 'warning',
        });
      }
    } finally {
      setGenerando(false);
    }
  }, [detalle]);

  const abrirWhatsApp = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setAviso({ texto: 'No pudimos abrir WhatsApp. Fijate que esté instalado.', tono: 'error' });
    }
  }, []);

  const linkPorWhatsApp = useCallback(async () => {
    if (!facturaId) return;
    try {
      const enlace = await pedirEnlace(facturaId).unwrap();
      if (enlace.telefonoWhatsApp === null) {
        setEnlaceSinCelular(enlace.urlWhatsApp);
        return;
      }
      await abrirWhatsApp(enlace.urlWhatsApp);
    } catch (fallo) {
      setAviso({
        texto: interpretarError(fallo)?.mensaje ?? 'No pudimos armar el link.',
        tono: 'error',
      });
    }
  }, [facturaId, pedirEnlace, abrirWhatsApp]);

  const seguirSinCelular = useCallback(async () => {
    const url = enlaceSinCelular;
    setEnlaceSinCelular(null);
    if (url) await abrirWhatsApp(url);
  }, [enlaceSinCelular, abrirWhatsApp]);

  const abrirMail = useCallback(() => {
    // Arranca con el email del cliente: casi siempre se manda ahi.
    form.reset({ email: detalle?.cliente.email ?? '', mensaje: '' });
    setErrorMail(null);
    setMailAbierto(true);
  }, [form, detalle]);

  const enviarMail = form.handleSubmit(async ({ email, mensaje }) => {
    if (!facturaId) return;
    setErrorMail(null);
    try {
      const envio = await mandarMail({
        id: facturaId,
        email: email || undefined,
        mensaje: mensaje || undefined,
      }).unwrap();
      setMailAbierto(false);
      setAviso({ texto: `Listo: se la mandamos a ${envio.para}.`, tono: 'success' });
    } catch (fallo) {
      const error = interpretarError(fallo);
      // Sin email, mal escrito o un mensaje de mas: va debajo de su campo
      // (`detalles.campos.email` o `.mensaje`), no en el cartel.
      if (!aplicarDetalles(form, error)) {
        setErrorMail(error?.mensaje ?? 'No pudimos mandarla.');
      }
    }
  });

  const confirmarBaja = useCallback(async () => {
    if (!facturaId) return;
    try {
      const respuesta = await darDeBaja(facturaId).unwrap();
      setAviso({ texto: respuesta.mensaje, tono: 'success' });
    } catch (fallo) {
      setAviso({
        texto: interpretarError(fallo)?.mensaje ?? 'No pudimos dar de baja los links.',
        tono: 'error',
      });
    } finally {
      setConfirmandoBaja(false);
    }
  }, [facturaId, darDeBaja]);

  return {
    generar: () => conLogo(() => void generarPdf()),
    generando,
    porWhatsApp: () => conLogo(() => void linkPorWhatsApp()),
    armandoEnlace,
    porMail: () => conLogo(abrirMail),
    /** Hay algo en curso: los otros botones esperan. */
    ocupado: generando || armandoEnlace || enviandoMail || dandoDeBaja,
    aviso,
    pidiendoLogo,
    cerrarPedidoLogo: () => setPidiendoLogo(false),
    sinCelular: enlaceSinCelular !== null,
    seguirSinCelular,
    cancelarSinCelular: () => setEnlaceSinCelular(null),
    mail: {
      abierto: mailAbierto,
      form,
      enviar: enviarMail,
      cerrar: () => setMailAbierto(false),
      enviando: enviandoMail,
      error: errorMail,
      /** El que tiene cargado el cliente, o null. */
      emailCliente: detalle?.cliente.email ?? null,
    },
    baja: {
      confirmando: confirmandoBaja,
      pedir: () => {
        setAviso(null);
        setConfirmandoBaja(true);
      },
      cancelar: () => setConfirmandoBaja(false),
      confirmar: confirmarBaja,
      dandoDeBaja,
    },
  };
}
