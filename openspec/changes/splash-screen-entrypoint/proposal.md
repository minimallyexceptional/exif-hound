# Proposal

## Why

Today the app launches straight into the upload flow with no sense of place: there is no moment that establishes the product identity, and no way to see or return to past work. A dedicated entrypoint screen gives the app a designed "front door" — large ExifHound brand presence on the left, recent investigations on the right — so returning users can orient instantly and start a new investigation in one click.

## What Changes

- Add a new **splash screen entrypoint** shown at app launch, before the existing upload experience:
  - **Left half:** large ExifHound logomark only, rendered with existing theme-aware tokens.
  - **Right half:** a "Start new investigation" primary action above a recent investigations region.
- Choosing **Start new investigation** transitions to the existing entrypoint (the current empty-state upload experience). Everything downstream of the splash screen is untouched in this change.
- The recent investigations region is a **history-only placeholder**: no sessions are recorded or persisted in this change, so it renders its empty state. A future change will persist investigation save files on the user's machine and populate the list from them.
- Existing `SplashScreen.tsx` (an unused, unreferenced boot/loading animation) is removed and replaced by the new entrypoint component so there is exactly one "splash screen" in the codebase.
- Full light/dark theme support via the existing `data-theme` token system; no new colors, no hardcoded literals.
- Respect `prefers-reduced-motion` for any entrance transitions.

## Capabilities

### New Capabilities
- `splash-entrypoint`: The launch-time entrypoint surface — layout, recent investigations list, new-investigation action, theme support, and the handoff into the existing upload flow.

### Modified Capabilities
<!-- None. The upload flow, app shell, and all views after the splash screen are unchanged at the requirement level. -->

## Impact

- **Code:** `apps/exif-hound-desktop/src/App.tsx` (mount gate only), `src/components/SplashScreen.tsx` (rewritten), removal of the dead boot-splash implementation.
- **Tests:** New Jest unit tests for splash rendering; Playwright E2E additions in `playwright/e2e/` (splash → upload handoff, theme rendering). Existing E2E fixtures/boot helpers in `playwright/support/app.ts` gain a `bootApp` option that starts at the splash screen; existing specs that assume direct upload entry need that flag (mechanical, no behavioral change to those specs).
- **No dependency changes.** No Tauri command changes.
