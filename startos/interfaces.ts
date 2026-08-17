import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiInterfaceId, uiMultiHostId, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const multi = sdk.MultiHost.of(effects, uiMultiHostId)
  const origin = await multi.bindPort(uiPort, {
    protocol: 'http',
    preferredExternalPort: 80,
  })

  const ui = sdk.createInterface(effects, {
    name: i18n('Web Interface'),
    id: uiInterfaceId,
    description: i18n('The Enshu web reviewer and admin UI'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await origin.export([ui])]
})
