import { useCallback, useEffect, useState } from 'react';

/**
 * Cuanto se espera despues de la ultima tecla antes de buscar. Sin esto sale
 * una request por letra: escribir "Gonzalez" dispararia ocho.
 */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * El texto del buscador y el que realmente viaja a la API, que va un ratito
 * atras. Lo usan los tres listados del panel.
 */
export function useBusquedaDiferida() {
  const [buscar, setBuscar] = useState('');
  const [aplicado, setAplicado] = useState('');

  useEffect(() => {
    const temporizador = setTimeout(() => setAplicado(buscar), ESPERA_BUSQUEDA_MS);
    // Cada tecla cancela el timer anterior: solo sobrevive la ultima.
    return () => clearTimeout(temporizador);
  }, [buscar]);

  /** Vacia los dos a la vez: "limpiar filtros" no espera el debounce. */
  const limpiar = useCallback(() => {
    setBuscar('');
    setAplicado('');
  }, []);

  return { buscar, setBuscar, aplicado, limpiar };
}
