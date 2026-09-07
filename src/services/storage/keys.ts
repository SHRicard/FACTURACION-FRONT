/** Claves del storage general. */
export const StorageKeys = {
  THEME_MODE: 'theme_mode',
  PAR_TIPOGRAFICO: 'par_tipografico',
  /** Cual de los tres estilos de barra de tabs eligio el cliente. */
  ESTILO_TABS: 'estilo_tabs',
  /** Cual de los tres estilos de cabecera de detalle eligio el cliente. */
  ESTILO_CABECERA: 'estilo_cabecera',
  /** Donde dejo el usuario el boton flotante del design system. Solo en __DEV__. */
  POSICION_BOTON_DS: 'posicion_boton_ds',
  /** En que paso del tour de bienvenida quedo, y si ya lo termino. */
  ONBOARDING: 'onboarding',
} as const;

/** Claves del storage encriptado. */
export const SecureStorageKeys = {
  AUTH_TOKEN: 'auth_token',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
export type SecureStorageKey = (typeof SecureStorageKeys)[keyof typeof SecureStorageKeys];
