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
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
