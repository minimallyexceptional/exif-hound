# Tasks — splash-screen-entrypoint

## 1. Splash screen component

- [x] 1.1 Rewrite `apps/exif-hound-desktop/src/components/SplashScreen.tsx` as the entrypoint: full-bleed `bg-app-black` stage, vertical hairline split (left ~45% logomark only, `w-40`–`w-48`, centered; version stamp `v{__APP_VERSION__}` bottom-left mono), right column with `Button variant="primary" size="lg"` "Start new investigation" (Plus icon), tracked-mono "RECENT INVESTIGATIONS" section label, and empty-state block ("No investigations yet — start your first above") in a hairline-dashed border. Verify: component renders in isolation; all colors are `app-*` tokens (`grep` for hex/literal color classes returns nothing new).
- [x] 1.2 Staggered entrance (left composition, then right column) via opacity + small `translate-y`, gated on `prefers-reduced-motion` (matchMedia check renders the visible state immediately when reduced). Verify: Jest renders with `matchMedia` mocked to `reduce` and asserts no hidden initial state.

## 2. Mount gating in App.tsx

- [x] 2.1 Add `sessionState: 'splash' | 'active'` to `App.tsx`; when `'splash'`, render only `<SplashScreen onStart={…} />`; `onStart` flips to `'active'` rendering the app exactly as today. Verify: `npm run typecheck` and existing Jest suite pass; app after splash is byte-for-byte the previous tree.

## 3. E2E support

- [x] 3.1 Add `skipSplash` option (default `true`) to `bootApp` in `playwright/support/app.ts`: when true, click "Start new investigation" after `page.goto('/')` and wait for the existing header heading; when false, return immediately so splash specs can assert on the splash. Verify: run 2–3 existing E2E specs unchanged (`npm run test:e2e -- upload exif-display`) and confirm green.
- [x] 3.2 New spec `playwright/e2e/splash.ts`: splash shows logomark + "Start new investigation" + "RECENT INVESTIGATIONS" empty state; clicking the button dismisses splash and shows the upload empty state; light-theme variant (localStorage `theme=light` seed) renders logomark in dark ink and light surfaces. Verify: `npx playwright test splash`.

## 4. Quality gates

- [x] 4.1 Jest unit test `src/components/__tests__/SplashScreen.test.tsx`: renders both regions, fires `onStart` on button click, shows empty state, reduced-motion path. Verify: `npm test --workspace=exif-hound-desktop`.
- [x] 4.2 Run full gates: `npm run lint`, `npm run typecheck`, `npm test --workspace=exif-hound-desktop`, `npm run test:e2e`, and `npm run build:apps`. Verify: all pass with no new lint errors.

## 5. OpenSpec closeout

- [x] 5.1 `openspec validate --all` passes; mark tasks complete. Verify: validator output shows `change/splash-screen-entrypoint ✓`.
- [x] 5.2 Run the Impeccable design detector on the changed UI files and address findings. Verify: `impeccable detect --json src/components/SplashScreen.tsx src/App.tsx` run once after concept selection.

## Workflow follow-up

- Archive the change with `openspec archive splash-screen-entrypoint` after implementation, validation, and user acceptance.
- Update `AGENTS.md`/README E2E notes only if the bootApp option surface warrants documentation.
