import { DocumentoLegalScreen } from '@/features/legal/screens';

/**
 * Los terminos, en su propia URL. Va fuera de `/admin` a proposito: se abre
 * desde el registro, sin sesion, que es justo donde Google los quiere a la vista.
 */
export default function TerminosRoute() {
  return <DocumentoLegalScreen tipo="terminos" />;
}
