/**
 * Destino de un rol o un paso pendiente que esta versión no conoce (K8). Va
 * fuera de `/admin` y sin guard: tiene que poder abrirse sin importar en qué
 * estado esté la sesión.
 */
export { ActualizarAppScreen as default } from '@/features/actualizacion/screens';
