import type { z } from 'zod';

import type { versionAppSchema } from './schemas';

/** La versión mínima y la última publicada, tal como las devuelve /app/version. */
export type VersionApp = z.infer<typeof versionAppSchema>;
