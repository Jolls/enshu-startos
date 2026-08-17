import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

// Enshu's own HTTP port (cmd/enshu/main.go's ADDR default of :3000).
export const uiPort = 3000

// Host id (the `sdk.MultiHost.of` group) and interface id for the web UI,
// shared between interfaces.ts and the primary-URL action/init watcher.
export const uiMultiHostId = 'ui'
export const uiInterfaceId = 'ui'

// PostgreSQL sidecar: fixed internal port, not exposed via any interface.
export const pgPort = 5432
export const pgUser = 'enshu'
export const pgDatabase = 'enshu'

export function getNonLocalUrls(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, uiMultiHostId, host => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap(b => Object.values(b.interfaces))
          .find(i => i.id === uiInterfaceId)
      return iface ? iface.addressInfo.nonLocal.format() : []
    })
    .const()
}
