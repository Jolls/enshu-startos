import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { pgDatabase, pgPort, pgUser, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Enshu!'))

  // Generated once on install by init/seedFiles.ts.
  const pgPassword = (await storeJson.read(s => s.pgPassword).const(effects)) ?? ''
  // Selected by the user via the "Set Primary URL" action (init/taskSetPrimaryUrl.ts
  // seeds a default on install). Reactive so ORIGIN — and therefore the daemon —
  // updates if the choice changes later.
  const domain = await storeJson.read(s => s.domain).const(effects)

  const databaseUrl = `postgres://${pgUser}:${pgPassword}@127.0.0.1:${pgPort}/${pgDatabase}`

  const postgresSub = sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'postgresql',
      mountpoint: '/var/lib/postgresql',
      readonly: false,
    }),
    'postgres-sub',
  )

  // Enshu's own upstream Dockerfile ships no migration tool, so this package's
  // Dockerfile (root) builds `goose` alongside the `enshu` binary and bakes in
  // upstream-project/migrations at /migrations — see UPDATING.md.
  const enshuSub = sdk.SubContainer.of(
    effects,
    { imageId: 'enshu' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'media',
      mountpoint: '/data/media',
      readonly: false,
    }),
    'enshu-sub',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(['-c', 'listen_addresses=127.0.0.1']),
        env: {
          POSTGRES_USER: pgUser,
          POSTGRES_PASSWORD: pgPassword,
          POSTGRES_DB: pgDatabase,
        },
      },
      ready: {
        display: null, // internal sidecar, not shown to the user
        fn: async () => {
          const result = await postgresSub.exec([
            'pg_isready', '-q', '-h', '127.0.0.1',
            '-d', pgDatabase, '-U', pgUser,
          ])
          if (result.exitCode !== 0) {
            return {
              result: 'loading',
              message: i18n('Waiting for PostgreSQL to be ready'),
            }
          }
          return {
            result: 'success',
            message: i18n('PostgreSQL is ready'),
          }
        },
      },
      requires: [],
    })
    .addOneshot('migrate', {
      subcontainer: enshuSub,
      // Idempotent — goose only applies migrations not yet recorded in its
      // bookkeeping table, so this is safe to run on every start.
      exec: {
        command: ['/usr/local/bin/goose', '-dir', '/migrations', 'postgres', databaseUrl, 'up'],
      },
      requires: ['postgres'],
    })
    .addDaemon('enshu', {
      subcontainer: enshuSub,
      exec: {
        command: ['/usr/local/bin/enshu'],
        env: {
          DATABASE_URL: databaseUrl,
          MEDIA_ROOT: '/data/media',
          ADDR: `:${uiPort}`,
          ORIGIN: domain || '',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['migrate'],
    })
})
