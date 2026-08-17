import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z
  .object({
    // Internal PostgreSQL password. Generated once on install (init/seedFiles.ts);
    // no .catch() default on purpose — it must be a real random value, never a
    // static fallback that every install would otherwise share.
    pgPassword: z.string().optional().catch(undefined),
    // Full URL (e.g. https://enshu.mydomain.local) used for the ORIGIN env var,
    // which Enshu's CSRF check compares each state-changing request's Origin
    // header against. Picked from the service's own interfaces
    // (init/taskSetPrimaryUrl.ts, actions/setPrimaryUrl.ts).
    domain: z.string().catch(''),
  })
  .strip()

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
