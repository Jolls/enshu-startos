<p align="center">
  <img src="icon.svg" alt="Enshu Logo" width="21%">
</p>

# Enshu on StartOS

> Everything not listed in this document should behave the same as upstream Enshu.
> If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[Enshu](https://github.com/Jolls/enshu) is a self-hostable, multiuser, Anki-compatible
spaced-repetition server. Upstream ships no prebuilt image and no built-in migration
runner or admin bootstrap — this package builds the binary from source, adds a
PostgreSQL sidecar, and runs schema migrations automatically on every start.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two images, built for `x86_64` and `aarch64`.

- **`enshu`** — built by this package's own root `Dockerfile`, not upstream's. Upstream's
  `Dockerfile` (in the `upstream-project/` git submodule, pinned to a tagged release — see
  `UPDATING.md`) compiles only the `enshu` binary into a shell-less distroless final stage.
  This package's Dockerfile instead compiles `enshu` **and** `goose` (the migration tool
  upstream's own CI installs separately, per `.github/workflows/ci.yml` in the submodule)
  into a `debian:bookworm-slim` final stage, and copies in the submodule's `migrations/`
  directory at `/migrations`. Entrypoint is `/usr/local/bin/enshu`; `goose` lives at
  `/usr/local/bin/goose`.
- **`postgres`** — the stock `postgres` image, unmodified.

Subcontainers, all defined in `startos/main.ts`:

- `postgres-sub` (image `postgres`) — runs the `postgres` daemon.
- `enshu-sub` (image `enshu`) — runs both the `migrate` oneshot and the `enshu` daemon; the
  subcontainer is shared between them since they use the same image.

## Volume and Data Layout

One volume, `main`, with three subpaths:

- `main/postgresql` → mounted at `/var/lib/postgresql` in `postgres-sub` — the PostgreSQL
  data directory.
- `main/media` → mounted at `/data/media` in `enshu-sub` — Enshu's content-addressed media
  blob store (`MEDIA_ROOT`), holding imported note/card media (images, audio) referenced by
  the database.
- `main/store.json` — this package's own file, not upstream's. Holds the generated
  PostgreSQL password.

There is no embedded database — the data of record lives in PostgreSQL, in the volume above.

## File Models

- **`store.json`** (`startos/fileModels/store.json.ts`) — JSON, holds one key:
  - `pgPassword` — generated once on install (`startos/init/seedFiles.ts`), never re-asserted
    afterward. There is no action to rotate it; recovering from a suspected leak means
    restoring the volume or reinstalling.

Enshu itself owns no configuration file on disk — its only inputs are the four environment
variables set in `startos/main.ts` (`DATABASE_URL`, `MEDIA_ROOT`, `ADDR`, `ORIGIN`), all
re-asserted on every daemon start. `ORIGIN` is read fresh from the service's own interfaces
each start (`utils.ts`'s `getNonLocalUrls`, via `sdk.host.getOwn`) rather than stored — every
non-local address the service is currently reachable at (LAN IP, `.local`, a configured
domain, Tor, ...), comma-separated. Upstream v0.1.26 added support for a comma-separated
`ORIGIN` (Jolls/enshu#111/#112) specifically so a CSRF check doesn't have to pick one address;
before that fix this package made the user choose a single primary URL via a
now-removed `Set Primary URL` action, since every other address would 403 on state-changing
requests.

## Dependencies

None. PostgreSQL runs as a bundled sidecar (`postgres-sub`), not a StartOS dependency.

## Network Access and Interfaces

One interface, `ui` (`startos/interfaces.ts`), type `ui`, protocol `http`, bound to port
`3000` (Enshu's fixed listen port — `ADDR` is hardcoded to `:3000` in `startos/main.ts`, not
user-configurable). Serves both the web reviewer and any HTML admin/classroom views Enshu
adds. PostgreSQL is not exposed on any interface; `enshu-sub` reaches it at
`127.0.0.1:5432`.

## Installation and First-Run Flow

On install, `startos/init/seedFiles.ts` generates the PostgreSQL password.
`startos/main.ts` then starts `postgres`, waits for `pg_isready`, runs the
`migrate` oneshot (`goose ... up` against `/migrations` — idempotent, safe on every start),
and only then starts the `enshu` daemon. There is no separate setup wizard: the first
usable state is Enshu's own signup screen. Enshu has no built-in admin/superuser concept —
every account is created the same way, through that screen.

## Actions

None.

## Tasks

None.

## Health Checks

- **`postgres`** (internal, not shown to the user) — `pg_isready` against `127.0.0.1:5432`.
  A failure here blocks the `migrate` oneshot and, transitively, the `enshu` daemon from
  starting; it means PostgreSQL itself hasn't finished initializing yet, not a data problem.
- **`enshu` / Web Interface** — `checkPortListening` on port `3000`. "Not ready" during
  normal startup means the `migrate` oneshot (which blocks this daemon via `requires`) is
  still running or PostgreSQL is still coming up; persistent failure after that means the
  `enshu` process itself crashed — check its logs.

## Backups and Restore

Strategy: whole-volume copy (`sdk.Backups.ofVolumes('main')`), not a database dump. The
PostgreSQL data directory, the media blob store, and `store.json` are all backed up and
restored byte-for-byte together, so a restore comes back with the exact same generated
password it had at backup time — nothing to re-enter. Because the volume is copied rather
than dumped, a restored instance needs no re-sync or replay step before it's usable;
`postgres` simply starts against its already-populated data directory. `ORIGIN` is
recomputed fresh from the restored instance's own addresses on first start, not restored
from the backup.

## Limitations and Differences

1. No admin-password or superuser bootstrap: every account, including the first, is created
   through Enshu's own signup screen. If you intend to gate signups, do so at the network
   level (e.g. disable public interfaces) — Enshu has no built-in registration toggle as of
   this packaging.
2. PostgreSQL is not reachable from outside the package — there is no interface for it, and
   no action exposes its credentials. This differs from services (e.g. Arx) that expose their
   database for an external client to connect to.

---

## Quick Reference for AI Consumers

```yaml
package_id: 'enshu'
image: local-build # custom Dockerfile, no public registry tag
architectures: [x86_64, aarch64]
subcontainers: [postgres-sub, enshu-sub]
volumes:
  main: /var/lib/postgresql, /data/media, /store.json
file_models:
  - store.json
startos_managed_env_vars:
  - DATABASE_URL
  - MEDIA_ROOT
  - ADDR
  - ORIGIN
dependencies: none
interfaces:
  ui: { type: ui, port: 3000 }
actions: none
tasks: none
health_checks:
  - postgres
  - enshu
```
