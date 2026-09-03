/** Claves del storage general. */
export const StorageKeys = {
  THEME_MODE: 'theme_mode',
} as const;

/** Claves del storage encriptado. */
export const SecureStorageKeys = {
  AUTH_TOKEN: 'auth_token',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
export type SecureStorageKey = (typeof SecureStorageKeys)[keyof typeof SecureStorageKeys];
