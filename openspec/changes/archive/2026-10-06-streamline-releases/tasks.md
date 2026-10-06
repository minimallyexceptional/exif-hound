# Tasks

## 1. Version single-sourcing

- [x] 1.1 Add `__APP_VERSION__` to the Vite `define` globals in `apps/exif-hound-desktop/vite.config.ts`, read from `src-tauri/tauri.conf.json`; render `SYSTEM v{__APP_VERSION__}` in `src/components/SplashScreen.tsx`; update any Jest test that asserts a hardcoded splash version so it reads the version from `tauri.conf.json` instead.
- [x] 1.2 Freeze the crate version: set `apps/exif-hound-desktop/src-tauri/Cargo.toml` to `version = "0.1.0"` with a comment stating the release version lives in `tauri.conf.json`; update the `exif-hound` entry in `Cargo.lock` to match.
- [x] 1.3 Add `scripts/release/set-version.mjs` that reads the version from `tauri.conf.json` and runs `npm version <version> --workspace=exif-hound-desktop --no-git-tag-version`; expose it as `release:version` in the root `package.json`; verify running it after a `tauri.conf.json` bump updates the workspace `package.json` and root `package-lock.json` and changes nothing else.

## 2. Fail-fast release guards

- [x] 2.1 Add the version-consistency check to the `prepare` job of `.github/workflows/release.yml`: compare the `tauri.conf.json` version against the desktop `package.json` and the workspace entry in the root `package-lock.json`, failing with the names of disagreeing files.
- [x] 2.2 Add the already-published guard to the `prepare` job: with `GH_TOKEN`, fail when `gh release view "$TAG"` resolves to a non-draft release; keep the existing guard in the publish job.

## 3. Tag-trigger enablement and docs

- [x] 3.1 Enable tag-ref deployments: add the `v*` tag pattern to the `github-pages` environment deployment policies via the GitHub API; verify the policy lists `v*` and that a dispatch-path release deploys unchanged.
- [x] 3.2 Document the release flow in `docs/updater.md`: single-file version edit, `npm run release:version`, push `main`, push `v<version>` tag for stable, `workflow_dispatch` for beta/internal, and the prepare-job early guards.
- [x] 3.3 Run the desktop quality gates (lint, typecheck, Jest) and commit through the Husky pre-commit hook; run `openspec validate --all`.

## 4. Release rehearsal

- [x] 4.1 Bump the version to 2.6.2 in `tauri.conf.json`, run `npm run release:version`, commit, push to `main`.
- [x] 4.2 Push the `v2.6.2` tag and verify the release workflow completes end to end: release published, all four platform assets attached, and the stable manifest on the update feed serving version 2.6.2.
- [x] 4.3 Verify CI on the version-bump commit passes and the GitHub Pages download button resolves to the new latest release; archive the OpenSpec change.
