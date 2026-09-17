import type { z } from 'zod';

import type { cuentaEliminadaSchema } from './schemas';

export type CuentaEliminada = z.infer<typeof cuentaEliminadaSchema>;
