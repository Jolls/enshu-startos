import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'enshu',
  title: 'Enshu',
  // Matches upstream-project/LICENSE (GNU AGPLv3).
  license: 'AGPL-3.0-or-later',
  // TODO: confirm/create this repo before publishing — following the Jolls/<name>-startos
  // convention used by this author's other packages (navidrome-startos, arx-startos), but
  // https://github.com/Jolls/enshu-startos did not exist as of packaging time.
  packageRepo: 'https://github.com/Jolls/enshu-startos',
  upstreamRepo: 'https://github.com/Jolls/enshu',
  // Upstream ships no separate marketing site; point at the project repo.
  marketingUrl: 'https://github.com/Jolls/enshu',
  donationUrl: null,
  description: { short, long },
  // 'main' holds the PostgreSQL data directory, the content-addressed media blob
  // store (MEDIA_ROOT), and this package's own store.json (generated password),
  // all under separate subpaths (see startos/main.ts).
  volumes: ['main'],
  images: {
    // Built from the upstream-project/ git submodule (pinned to v0.1.25) via the
    // custom Dockerfile in this package's root — see UPDATING.md. Upstream
    // publishes no prebuilt image, and its own Dockerfile omits the `goose`
    // migration tool this package's oneshot needs, so this Dockerfile adds a
    // second build target and a non-distroless final stage rather than reusing
    // upstream-project/Dockerfile directly.
    enshu: {
      source: { dockerBuild: {} },
      arch: ['x86_64', 'aarch64'],
    },
    // Confirmed on Docker Hub 2026-08-17: postgres:18.6 ships amd64 and arm64.
    postgres: {
      source: { dockerTag: 'postgres:18.6' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {},
})
