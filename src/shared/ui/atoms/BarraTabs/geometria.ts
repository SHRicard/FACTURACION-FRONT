import type { EstiloTabs } from '@/theme';

/**
 * Cuanto espacio se come la barra desde el piso de la pantalla, area segura
 * incluida. Es el alto que hay que reservarle al navegador.
 *
 * Lo usan el layout (para reservarlo) y la hoja del tour (para apoyarse justo
 * encima), asi los dos leen el mismo numero.
 */
export const espacioDeBarra = (estilo: EstiloTabs, insetInferior: number): number =>
  estilo.margenSuperior + estilo.alto + estilo.margenInferior + insetInferior;
