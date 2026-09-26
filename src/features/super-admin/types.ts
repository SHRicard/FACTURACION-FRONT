import type { z } from 'zod';

import type {
  agruparCrecimientoSchema,
  alcanceAvisosSchema,
  avisoAdminSchema,
  detalleAvisoSchema,
  estadoAvisoSchema,
  nuevoAvisoFormSchema,
  paginaAvisosSchema,
  resultadoPruebaSchema,
  crearUsuarioFormSchema,
  crecimientoSchema,
  detalleErrorSchema,
  detalleMarcaSchema,
  detalleUsuarioSchema,
  detallesUnicoDuenoSchema,
  duenoAdminSchema,
  editarMarcaFormSchema,
  editarUsuarioFormSchema,
  errorResueltoSchema,
  estadisticasMarcaSchema,
  estadoSistemaSchema,
  grupoErrorSchema,
  listadoErroresSchema,
  marcaConDuenosSchema,
  marcaEnListadoSchema,
  mensajeSchema,
  ocurrenciaErrorSchema,
  paginaMarcasSchema,
  paginaUsuariosSchema,
  pendienteAdminSchema,
  plataformaSchema,
  recalculoTodasSchema,
  resumenPlataformaSchema,
  rolAdminSchema,
  sumarDuenoFormSchema,
  tramoCrecimientoSchema,
  usuarioEliminadoSchema,
  usuarioEnListadoSchema,
} from './schemas';

// Tipos INFERIDOS de los schemas: una sola fuente de verdad.
export type RolAdmin = z.infer<typeof rolAdminSchema>;
export type PendienteAdmin = z.infer<typeof pendienteAdminSchema>;
export type Plataforma = z.infer<typeof plataformaSchema>;
export type EstadisticasMarca = z.infer<typeof estadisticasMarcaSchema>;

export type ResumenPlataforma = z.infer<typeof resumenPlataformaSchema>;
export type AgruparCrecimiento = z.infer<typeof agruparCrecimientoSchema>;
export type TramoCrecimiento = z.infer<typeof tramoCrecimientoSchema>;
export type Crecimiento = z.infer<typeof crecimientoSchema>;

export type UsuarioEnListado = z.infer<typeof usuarioEnListadoSchema>;
export type PaginaUsuarios = z.infer<typeof paginaUsuariosSchema>;
export type DetalleUsuario = z.infer<typeof detalleUsuarioSchema>;
export type DuenoAdmin = z.infer<typeof duenoAdminSchema>;
export type UsuarioEliminado = z.infer<typeof usuarioEliminadoSchema>;
export type DetallesUnicoDueno = z.infer<typeof detallesUnicoDuenoSchema>;
export type Mensaje = z.infer<typeof mensajeSchema>;
export type CrearUsuarioForm = z.infer<typeof crearUsuarioFormSchema>;
export type EditarUsuarioForm = z.infer<typeof editarUsuarioFormSchema>;

export type MarcaConDuenos = z.infer<typeof marcaConDuenosSchema>;
export type MarcaEnListado = z.infer<typeof marcaEnListadoSchema>;
export type PaginaMarcas = z.infer<typeof paginaMarcasSchema>;
export type DetalleMarca = z.infer<typeof detalleMarcaSchema>;
export type RecalculoTodas = z.infer<typeof recalculoTodasSchema>;
export type EditarMarcaForm = z.infer<typeof editarMarcaFormSchema>;
export type SumarDuenoForm = z.infer<typeof sumarDuenoFormSchema>;

export type GrupoError = z.infer<typeof grupoErrorSchema>;
export type ListadoErrores = z.infer<typeof listadoErroresSchema>;
export type OcurrenciaError = z.infer<typeof ocurrenciaErrorSchema>;
export type DetalleError = z.infer<typeof detalleErrorSchema>;
export type ErrorResuelto = z.infer<typeof errorResueltoSchema>;

export type EstadoSistema = z.infer<typeof estadoSistemaSchema>;

export type EstadoAviso = z.infer<typeof estadoAvisoSchema>;
export type AvisoAdmin = z.infer<typeof avisoAdminSchema>;
export type PaginaAvisos = z.infer<typeof paginaAvisosSchema>;
export type DetalleAviso = z.infer<typeof detalleAvisoSchema>;
export type AlcanceAvisos = z.infer<typeof alcanceAvisosSchema>;
export type ResultadoPrueba = z.infer<typeof resultadoPruebaSchema>;
export type NuevoAvisoForm = z.infer<typeof nuevoAvisoFormSchema>;

// ─────────────────── Lo que se manda ───────────────────

/** El rango del grafico del tablero: lo que viaja a `/admin/crecimiento`. */
export interface FiltrosCrecimiento {
  agrupar: AgruparCrecimiento;
  dias?: number;
  meses?: number;
}

/**
 * Filtros del listado de cuentas. La pagina NO va aca: la maneja la query
 * infinita. `onboarding` es UN paso: el backend no junta varios en una query,
 * asi que "trabados" se ofrece como dos filtros (sin DNI, sin marca).
 */
export interface FiltrosUsuarios {
  buscar?: string;
  rol?: 'super_admin' | 'administrador';
  proveedor?: 'local' | 'google';
  onboarding?: 'terminos' | 'perfil' | 'marca' | 'listo';
  suspendida?: boolean;
  activosDias?: number;
  inactivosDias?: number;
  orden?: 'recientes' | 'antiguos' | 'nombre' | 'ultimoAcceso';
}

export type OrdenMarcas = 'nombre' | 'recientes' | 'vendido' | 'cobrado' | 'deuda' | 'clientes';

export interface FiltrosMarcas {
  buscar?: string;
  orden?: OrdenMarcas;
  actividad?: 'activas' | 'inactivas';
}

export interface FiltrosErrores {
  /** 1 a 30: Mongo borra cada reporte a los 30 dias. */
  dias?: number;
  plataforma?: 'android' | 'ios' | 'web';
  version?: string;
  fatal?: boolean;
  buscar?: string;
  orden?: 'recientes' | 'frecuentes';
}

/** Alta de una cuenta. Sin terminos aceptados: los acepta al entrar. */
export interface DatosCrearUsuario {
  nombre: string;
  email: string;
  password: string;
  rol?: 'administrador' | 'super_admin';
  dni?: string;
}

/** Correccion de datos. Solo cambia lo que viaja; `dni: null` se lo saca. */
export interface DatosEditarUsuario {
  nombre?: string;
  email?: string;
  dni?: string | null;
}

/** Edicion de la marca: el formulario como quedo, igual que `PUT /marcas/mia`. */
export interface DatosEditarMarca {
  nombre: string;
  direccion: string;
  telefono: string;
  colorPrimario: string | null;
  colorSecundario: string | null;
}
