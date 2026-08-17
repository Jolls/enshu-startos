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
  PostgreSQL password and the selected primary-URL domain.

There is no embedded database — the data of record lives in PostgreSQL, in the volume above.

## File Models

- **`store.json`** (`startos/fileModels/store.json.ts`) — JSON, holds two keys:
  - `pgPassword` — generated once on install (`startos/init/seedFiles.ts`), never re-asserted
    afterward. There is no action to rotate it; recovering from a suspected leak means
    restoring the volume or reinstalling.
  - `domain` — the address Enshu treats as its own origin (used for the `ORIGIN` env var).
    Seeded on install with a `.local` address if one is available, otherwise re-asserted only
    when it changes via the **Set Primary URL** action (see Actions below). A hand-edit
    would be overwritten the next time the action runs, but nothing rewrites it on a plain
    restart.

Enshu itself owns no configuration file on disk — its only inputs are the four environment
variables set in `startos/main.ts` (`DATABASE_URL`, `MEDIA_ROOT`, `ADDR`, `ORIGIN`), all
re-asserted on every daemon start.

## Dependencies

None. PostgreSQL runs as a bundled sidecar (`postgres-sub`), not a StartOS dependency.

## Network Access and Interfaces

One interface, `ui` (`startos/interfaces.ts`), type `ui`, protocol `http`, bound to port
`3000` (Enshu's fixed listen port — `ADDR` is hardcoded to `:3000` in `startos/main.ts`, not
user-configurable). Serves both the web reviewer and any HTML admin/classroom views Enshu
adds. PostgreSQL is not exposed on any interface; `enshu-sub` reaches it at
`127.0.0.1:5432`.

## Installation and First-Run Flow

On install, `startos/init/seedFiles.ts` generates the PostgreSQL password and
`startos/init/taskSetPrimaryUrl.ts` picks a default primary URL (preferring a `.local`
address). `startos/main.ts` then starts `postgres`, waits for `pg_isready`, runs the
`migrate` oneshot (`goose ... up` against `/migrations` — idempotent, safe on every start),
and only then starts the `enshu` daemon. There is no separate setup wizard: the first
usable state is Enshu's own signup screen. Enshu has no built-in admin/superuser concept —
every account is created the same way, through that screen.

## Actions

- **Set Primary URL** (`startos/actions/setPrimaryUrl.ts`) — user-facing. Choose which of
  this service's addresses Enshu treats as its own origin, used for the `ORIGIN` env var
  Enshu's CSRF check compares each state-changing request's `Origin` header against.
  Instant — updates `store.json` and the running daemon restarts with the new value. Safe
  to run repeatedly; picking the address you actually browse to avoids every non-GET
  request failing with a CSRF rejection.

## Tasks

- **Primary URL unavailable** (raised by `startos/init/taskSetPrimaryUrl.ts`) — fires when
  the address currently selected as primary (e.g. a domain, or a gateway's public IP) is no
  longer among the service's available addresses (a gateway was disabled, a domain removed).
  Severity `critical`: it blocks the service from starting, since Enshu would otherwise start
  with an `ORIGIN` that can never match an incoming request. Clears by running **Set Primary
  URL** and picking any currently-available address. Can recur if that address is later
  removed too.

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
password and primary-URL selection it had at backup time — nothing to re-enter. Because the
volume is copied rather than dumped, a restored instance needs no re-sync or replay step
before it's usable; `postgres` simply starts against its already-populated data directory.

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
actions:
  - set-primary-url
tasks:
  - { action: set-primary-url, severity: critical }
health_checks:
  - postgres
  - enshu
```
