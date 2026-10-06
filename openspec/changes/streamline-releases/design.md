# Design: Streamline releases

## Context

The release pipeline reads its version from exactly one file — `apps/exif-hound-desktop/src-tauri/tauri.conf.json` (`release.yml` prepare step). Everything else the operator edits today is a manual derivation: the desktop `package.json` (mirrored into the root lockfile by npm), `Cargo.toml`/`Cargo.lock` (never read by the release or bundle pipeline; Tauri takes the bundle, installer, and updater manifest version from `tauri.conf.json`), and a hardcoded `SYSTEM v2.6.1` string in `SplashScreen.tsx`. In addition, the release workflow's tag-push trigger is broken in practice: the `github-pages` environment uses a custom deployment branch policy that lists branches only, so tag-ref deploys are rejected after ~5 minutes of successful platform builds. The already-published refusal guard sits in the publish job for the same reason: a re-run for a published version burns full builds before failing.

## Chosen approach

### Version single-sourcing

- `tauri.conf.json` stays the single source. Nothing else needs to be authoritative.
- `SplashScreen.tsx` renders `SYSTEM v{__APP_VERSION__}`. `__APP_VERSION__` is added to the existing Vite `define` block in `vite.config.ts`, read from `tauri.conf.json` at config load. This mirrors the established `__DEV__` / `__UPDATE_CHANNEL__` pattern, which exists precisely so source files stay Jest-compatible (no `import.meta`). Jest sees the global through `setupTests.ts`-style globals configuration the same way the other two globals do.
- `Cargo.toml` is frozen at `0.1.0` with a comment pointing at `tauri.conf.json` as the release version. `Cargo.lock` is updated once (`cargo update -p exif-hound`) and then stops changing across releases.
- `scripts/release/set-version.mjs` reads the version from `tauri.conf.json` and runs `npm version <version> --workspace=exif-hound-desktop --no-git-tag-version`, which updates the workspace `package.json` and the root `package-lock.json` atomically. Exposed as `release:version` at the root. The script is deliberately argument-free: the version comes from `tauri.conf.json`, so the only edit an operator makes is the one number in that file.

### Fail-fast guards (release.yml `prepare` job)

The prepare job keeps its existing tag-matches-version check and gains two steps:

1. **Version consistency**: a small Node script compares `tauri.conf.json`, the desktop `package.json`, and the workspace entry in the root `package-lock.json`; on mismatch it fails with the list of disagreeing files.
2. **Already-published guard**: using `GH_TOKEN`, `gh release view "$TAG"`; if the release exists and `isDraft` is false, fail with "Release v<version> is already published; refusing to overwrite it." (same message the publish job used). The publish job keeps its guard too — belt and braces for the draft-then-race case — but the common misfire now dies in seconds.

### Tag trigger

The workflow already declares `on: push: tags: ['v*']` and the prepare step already validates the tag equals `v${VERSION}`. The only missing piece is the `github-pages` environment policy: add a tag pattern (`v*`) to the environment's deployment policies via the GitHub API. With that one-time settings change, tag-push releases deploy without rejection. `workflow_dispatch` on `main`/`edge` continues to work for beta and internal channels and as the fallback.

### Documentation

`docs/updater.md` gains a release-flow section: edit the version in `tauri.conf.json`, run `npm run release:version`, commit and push `main`, push the tag (or dispatch for beta/internal). It records that the tag path is the stable-channel trigger and that misfires are refused in the prepare job.

## Alternatives considered

- **Deriving the desktop `package.json` version at build time and dropping the field**: rejected for now — npm tooling conventions expect workspace versions, and the sync command is cheap and keeps the lockfile honest.
- **Letting CI auto-sync the lockfile instead of a script**: rejected — mutating files during CI complicates the "commits are the record" model and hides drift rather than surfacing it.
- **Fixing tag deploys by pushing gh-pages content directly from the release job** (bypassing the environment): rejected — it would bypass Pages deployment protections the team relies on for atomicity, and the environment policy fix is a one-line settings change.
- **Removing the tag-push trigger instead of fixing it**: rejected — tag push is the most declarative trigger; it prevents dispatching from a stale `main`, which is a real hazard the dispatch path has today.

## Risks

- The environment-policy API call is a settings change; if the GitHub API rejects tag patterns for this environment type, the documented fallback remains `workflow_dispatch` and the code changes are still valid.
- Jest tests asserting a hardcoded splash version would fail after the derivation change; any such assertion must read the same source of truth (tauri.conf.json) instead of duplicating a literal.
