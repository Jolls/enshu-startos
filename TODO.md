# TODO — Enshu

Core packaging is done and verified: `make x86` builds cleanly, installs, PostgreSQL
initializes, the `migrate` oneshot applies all 15 goose migrations, and the `enshu` daemon
comes up listening on `:3000` (confirmed via `start-cli package logs` and a live install on
`192.168.121.132`). Remaining items:

- [ ] **Icon.** Upstream ships no icon/logo of any kind (checked the repo tree at v0.1.25).
      `icon.svg` is still the scaffold placeholder. Do not fabricate one — either get a real
      icon from the Enshu maintainer or design one, then replace `icon.svg` (≤ 40 KiB).
- [ ] **`packageRepo`.** `startos/manifest/index.ts` currently points at
      `https://github.com/Jolls/enshu-startos`, following this author's naming convention for
      other packages (`navidrome-startos`, `arx-startos`) — but that repo does not exist yet
      (confirmed via `gh api repos/Jolls/enshu-startos` → 404). Create it and push this package
      there, or update the field if it lands somewhere else.
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
      Enshu release) per `UPDATING.md` — this package was built against `postgres:18.6` and
      `enshu v0.1.25`, both current as of packaging.
