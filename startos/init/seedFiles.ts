import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

// Internal secret consumed by setupMain (POSTGRES_PASSWORD / DATABASE_URL) —
// generated once on fresh install. Enshu has no admin account to bootstrap;
// users register their own accounts through the web UI.
export const seedFiles = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return

  await storeJson.merge(effects, {
    pgPassword: utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 }),
  })
})
