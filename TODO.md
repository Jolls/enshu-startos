# TODO — Enshu

Core packaging is done and verified: `make x86` builds cleanly, installs, PostgreSQL
initializes, the `migrate` oneshot applies all 15 goose migrations, and the `enshu` daemon
comes up listening on `:3000` (confirmed via `start-cli package logs` and a live install on
`192.168.121.132`). Remaining items:

- [ ] **Icon.** Upstream ships no icon/logo of any kind (checked the repo tree at v0.1.25).
      `icon.svg` is still the scaffold placeholder. Do not fabricate one — either get a real
      icon from the Enshu maintainer or design one, then replace `icon.svg` (≤ 40 KiB).
- [ ] **Translations.** `startos/manifest/i18n.ts` and
      `startos/i18n/dictionaries/translations.ts` (es_ES/de_DE/pl_PL/fr_FR) are machine-drafted.
      Have a native speaker review before publishing.
- [ ] **Backup/restore sanity check.** Not yet exercised — `sdk.Backups.ofVolumes('main')` is
      wired up (see README § Backups and Restore) but taking a real backup and restoring it
      needs StartOS's backup-target flow, which is a GUI action.
- [ ] **Open registration.** Enshu has no built-in signup gate (confirmed: no such env var in
      `cmd/enshu/main.go`). If that matters to you, flag it prominently before publishing —
      currently just noted under README § Limitations and Differences.
- [ ] Re-verify `docker-tag`/submodule pins closer to publish time (Postgres image, upstream
      Enshu release) per `UPDATING.md` — this package was bumped to `enshu v0.1.27`; re-check
      `postgres` at publish time too.
