# Updating the upstream version

Upstream is tracked via the `upstream-project/` git submodule, pinned to a tagged release
(currently `v0.1.27`). This package's root `Dockerfile` builds from that submodule's source
(see `README.md` § Image and Container Runtime for why it's a custom Dockerfile rather than
`upstream-project/Dockerfile` directly) — there is no separate `postgres` version to track,
that image is pinned independently by Docker Hub tag in `startos/manifest/index.ts`.

Enshu's releases are not all tagged — check `CHANGELOG.md` in the submodule, not just
`git tag`, per its own `UPDATING`-equivalent notes (see `upstream-project/migrations/README.md`
for the same caveat applied to schema history).

## Determining the upstream version

The current pin lives in two places that must agree:

1. `upstream-project` (the submodule's checked-out commit) — `git -C upstream-project describe --tags`.
2. `startos/versions/current.ts`'s `version` field, `<upstream-version>:<revision>`.

Fetch the latest release:

```sh
gh api repos/Jolls/enshu/tags --jq '.[].name' | head -1
```

## Applying the bump

1. `cd upstream-project && git fetch --tags && git checkout <new-tag> && cd ..`
2. `git add upstream-project`
3. Check `upstream-project/migrations/` for new files since the last pin — no action needed
   (this package's Dockerfile copies the whole directory and `goose` only applies what's
   unapplied), but note in the commit if the schema changed.
4. Check `upstream-project/.github/workflows/ci.yml` for the `goose`/`sqlc` version pins used
   there — if `goose`'s pin changed, update the matching `go install ... goose@` version in
   this package's root `Dockerfile`.
5. Bump `startos/versions/current.ts`'s `version` to `<new-tag-without-v>:0` (reset the
   revision to `0` on an upstream bump; increment it instead for a packaging-only fix at the
   same upstream version — see `start-technologies/projects/start-sdk/docs/src/versions.md`).
6. Update this file's "currently" note above.
7. Rebuild (`make x86`) and verify (install, sign up, review a card, restart, confirm data
   survives) before committing.
