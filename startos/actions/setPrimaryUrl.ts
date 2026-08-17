import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getNonLocalUrls } from '../utils'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const urls = await getNonLocalUrls(effects)

    return {
      name: i18n('URL'),
      values: urls.reduce(
        (obj, url) => ({ ...obj, [url]: url }),
        {} as Record<string, string>,
      ),
      default: '',
    }
  }),
})

export const setPrimaryUrl = sdk.Action.withInput(
  // id
  'set-primary-url',

  // metadata
  async () => ({
    name: i18n('Set Primary URL'),
    description: i18n(
      'Choose which of your Enshu addresses is used for the CSRF origin check (see the ORIGIN env var in .env.example).',
    ),
    warning: i18n(
      "Enshu compares each state-changing request's Origin header against this address. Requests arriving at a different address than the one selected here will be rejected with a 403.",
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // pre-fill the input form with the current value
  async ({ effects }) => ({
    url: (await storeJson.read(s => s.domain).once()) || undefined,
  }),

  // the execution function
  async ({ effects, input }) => storeJson.merge(effects, { domain: input.url }),
)
