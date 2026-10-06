# Proposal

## Why

Creating a release currently requires editing six files: the desktop `package.json`, the root `package-lock.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, and a hardcoded version string in `SplashScreen.tsx`. Only `tauri.conf.json` is functionally read by the release pipeline (its `prepare` job takes the version from there), so the other five edits are manual derivations that can drift silently.

Two release-pipeline traps were hit while shipping v2.6.1:

- The `on: push: tags` trigger — the workflow's advertised stable-release path — builds all four platforms for ~5 minutes and then fails at the GitHub Pages deployment step because the `github-pages` environment's custom branch policy does not allow tag refs. Every successful release to date has actually been a `workflow_dispatch` on `main`.
- The "release already published; refusing to overwrite" guard fires only after all platform builds have completed, wasting several minutes on a misfire that could be detected in seconds.

## What Changes

- Make `tauri.conf.json` the single authoritative app version:
  - The splash screen version is derived at build time via a new `__APP_VERSION__` Vite global (same pattern as the existing `__DEV__` / `__UPDATE_CHANNEL__`), replacing the hardcoded string in `SplashScreen.tsx`.
  - `Cargo.toml` is frozen at a constant with a comment stating it is not the release version, making `Cargo.toml` and `Cargo.lock` permanently edit-free for releases.
  - A single command (`scripts/release/set-version.mjs`, exposed as `npm run release:version -- <version>`… no — the command takes no argument) synchronizes the desktop `package.json` version and the root `package-lock.json` from `tauri.conf.json`.
- Move the already-published refusal guard into the release workflow's `prepare` job so a misfired release is refused in seconds instead of after all platform builds complete.
- Add a version-consistency check to `prepare` that validates `tauri.conf.json`, the desktop `package.json`, and the root lockfile agree before any build starts.
- Make the tag-push trigger complete end to end by adding the `v*` tag pattern to the `github-pages` environment's deployment policies (one-time operator settings change), so `git push origin v2.7.0` becomes the atomic release action. `workflow_dispatch` remains the fallback for beta and internal channels.
- Document the one-edit release flow in `docs/updater.md`.

## Capabilities

### New Capabilities

- `release-pipeline`: Single-source app versioning and fail-fast, tag-triggered release publication.

### Modified Capabilities

None.

## Impact

- `apps/exif-hound-desktop/vite.config.ts` and `src/components/SplashScreen.tsx` (splash version derivation).
- `apps/exif-hound-desktop/src-tauri/Cargo.toml` and `Cargo.lock` (version frozen; one-time sync).
- `scripts/release/set-version.mjs` (new) and root `package.json` (new script entry).
- `.github/workflows/release.yml` (`prepare` job guards).
- `docs/updater.md` (release flow documentation).
- GitHub environment settings for `github-pages` (operator one-time change; not code).
- The root, website, and middleware package versions remain intentionally untouched — the release convention bumps only the desktop app.
