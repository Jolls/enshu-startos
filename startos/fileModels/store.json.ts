import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z
  .object({
    // Internal PostgreSQL password. Generated once on install (init/seedFiles.ts);
    // no .catch() default on purpose — it must be a real random value, never a
    // static fallback that every install would otherwise share.
    pgPassword: z.string().optional().catch(undefined),
  })
  .strip()

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
