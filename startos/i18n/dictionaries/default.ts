export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Enshu!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,
  'Waiting for PostgreSQL to be ready': 4,
  'PostgreSQL is ready': 5,
  // interfaces.ts
  'The Enshu web reviewer and admin UI': 6,
  // actions/setPrimaryUrl.ts
  'Set Primary URL': 7,
  'Choose which of your Enshu addresses is used for the CSRF origin check (see the ORIGIN env var in .env.example).': 8,
  "Enshu compares each state-changing request's Origin header against this address. Requests arriving at a different address than the one selected here will be rejected with a 403.": 9,
  URL: 10,
  // init/taskSetPrimaryUrl.ts
  'Primary URL is no longer available. Select a new one.': 11,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
