import type { MMKV } from 'react-native-mmkv';

import { secureStorage, storage, storageDisponible } from './mmkv';

/**
 * Unica puerta de acceso al storage local. Los componentes y features usan
 * SIEMPRE este servicio, nunca la instancia de MMKV directo.
 *
 * API de MMKV v4: `remove(key)` (en v3 era `delete(key)`) y los getters
 * devuelven `undefined` cuando la clave no existe.
 *
 * Sobre `storageDisponible`: en nativo es siempre true. En web es false durante
 * el render estatico (corre en Node, no hay `localStorage`), asi que las lecturas
 * devuelven null y las escrituras no hacen nada en vez de tirar. En el cliente
 * vuelve a ser true y el storage funciona normal. Es un guard explicito a proposito:
 * no envolvemos todo en try/catch para no tapar errores reales en nativo.
 */
function createStorageService(instance: MMKV) {
  return {
    /** Guarda cualquier valor serializable como JSON. */
    set<T>(key: string, value: T): void {
      if (!storageDisponible) return;
      instance.set(key, JSON.stringify(value));
    },

    /** Lee un valor JSON. Devuelve null si no existe o si el JSON esta corrupto. */
    get<T>(key: string): T | null {
      if (!storageDisponible) return null;
      const raw = instance.getString(key);
      if (raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        instance.remove(key);
        return null;
      }
    },

    /** Guarda un string tal cual, sin serializar. */
    setString(key: string, value: string): void {
      if (!storageDisponible) return;
      instance.set(key, value);
    },

    /** Lee un string guardado con `setString`. */
    getString(key: string): string | null {
      if (!storageDisponible) return null;
      return instance.getString(key) ?? null;
    },

    has(key: string): boolean {
      if (!storageDisponible) return false;
      return instance.contains(key);
    },

    remove(key: string): void {
      if (!storageDisponible) return;
      instance.remove(key);
    },

    clearAll(): void {
      if (!storageDisponible) return;
      instance.clearAll();
    },
  };
}

/** Storage general: preferencias, flags de UI. */
export const storageService = createStorageService(storage);

/** Storage encriptado (solo en nativo): credenciales, token de auth. */
export const secureStorageService = createStorageService(secureStorage);
