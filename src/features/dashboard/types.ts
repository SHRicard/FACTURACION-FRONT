import type { z } from 'zod';

import type { actividadSchema, resumenDashboardSchema } from './schemas';

export type ResumenDashboard = z.infer<typeof resumenDashboardSchema>;
export type Actividad = z.infer<typeof actividadSchema>;
