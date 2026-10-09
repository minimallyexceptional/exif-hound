# Contributing to Exif Hound

Thanks for your interest in contributing! Exif Hound is a privacy-first desktop
app for inspecting image metadata, mapping photo locations, and organizing
investigations — built as a single consolidated Tauri application.

## Code of conduct

By participating you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting set up

Prerequisites:

- **Node.js >= 20** and the pinned npm major (`packageManager` in the root
  `package.json` — use npm, not yarn or pnpm)
- **Rust** (stable) for the Tauri shell
- Linux: `webkit2gtk-4.1`, `libappindicator`/`libayatana-appindicator` and the
  usual GTK build deps (see `.github/workflows/ci.yml` for the exact apt list)
- Playwright Chromium for E2E: `npx playwright install chromium`

Bootstrap:

```bash
npm install          # installs workspaces + Husky hooks
npm run build:packages
npm run tauri:dev    # desktop app in dev mode
```

Useful commands (run from the repo root):

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint across workspaces |
| `npm run typecheck` | TypeScript across workspaces |
| `npm test --workspace=exif-hound-desktop` | Jest unit tests |
| `npm run test:e2e` | Playwright E2E suite |
| `npm run tauri:build` | Local production build (current platform) |
| `npm run scan:electron` | Fails if Electron references sneak back in |

## Repository rules

These are enforced by convention and, where possible, by CI:

1. **No Electron.** The app is Tauri-only. `npm run scan:electron` exits
   non-zero if Electron references are reintroduced.
2. **No `import.meta` in source files** — Jest/Playwright compatibility. Use
   the Vite `define` globals instead: `__DEV__`, `__APP_VERSION__`, and
   `__UPDATE_CHANNEL__`.
3. **Single app version.** `apps/exif-hound-desktop/src-tauri/tauri.conf.json`
   is the only version you edit. Run `npm run release:version` to sync the
   workspace `package.json` and lockfile. See `docs/updater.md`.
4. **Theming via tokens.** Never hardcode colors — use the token utilities
   (e.g. `text-app-accent`, `bg-app-gray`). Respect
   `prefers-reduced-motion`.
5. **Selectable values.** `body` is `user-select: none`; EXIF/metadata values
   users should be able to copy opt back in with the `selectable-value` class.

## OpenSpec feature workflow

New features follow the OpenSpec workflow in `openspec/`:

1. Create a change: `openspec new change <feature-name> --description "..."`.
2. Write the proposal, requirements, and design; get the spec approved before
   writing feature code.
3. Implement from the generated tasks, keeping artifacts up to date.
4. Run `openspec validate --all`, then archive the change when done.

Bug fixes, dependency updates, and documentation do not need a spec.

## Tests

- **Unit tests** live beside the code under `src/**/__tests__/` (config:
  `apps/exif-hound-desktop/jest.config.cjs`).
- **E2E tests** are Playwright specs in `apps/exif-hound-desktop/playwright/e2e/`,
  served by a dedicated Vite dev server with the Tauri bridge, geocoding, and
  map tiles mocked (`playwright/support/app.ts`). Register canned responses for
  any new Tauri command in `bootApp` options.
- E2E binary fixtures are generated — never hand-edit them; run
  `apps/exif-hound-desktop/scripts/generate-e2e-fixtures.mjs` if their
  constants change.

## Commits and pull requests

- Every commit runs the full pre-commit gate through Husky: desktop lint,
  typecheck, unit tests, the complete E2E suite, and a production build.
  **Do not bypass it** (`--no-verify` only in rare justified cases, fixed
  forward immediately).
- Keep commits and PRs focused; a short imperative subject line is fine
  (e.g. `Fix gallery rendering in WebKitGTK (AppImage) builds`).
- PRs are reviewed on GitHub; `main` is the integration branch. CI must be
  green before merge.

## Releasing

Releases are automated — see `docs/updater.md` for the full flow:

1. Bump the version in `tauri.conf.json`, run `npm run release:version`,
   commit, push to `main`.
2. Push the matching tag: `git tag v<version> && git push origin v<version>`.
3. The release workflow validates version consistency, builds and signs all
   platforms, publishes the GitHub Release, and refreshes the update feed.

## Reporting issues

- Bug reports and feature requests: use the GitHub issue templates.
- Security vulnerabilities: **do not open a public issue** — see
  [SECURITY.md](./SECURITY.md).
