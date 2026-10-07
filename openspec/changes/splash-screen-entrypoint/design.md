# Design — splash-screen-entrypoint

## Context

The app currently boots directly into `App.tsx`'s upload flow. There is an unused `SplashScreen.tsx` (a boot/loading animation, referenced nowhere) that will be replaced. Investigations are in-memory only — images, EXIF data, and analysis are never persisted — so "recent investigations" is new, lightweight state. The design system is established and documented in `DESIGN.md`: dark-first monochrome "evidence board" aesthetic, `--app-*` tokens in `src/index.css`, shared `Button`/`Panel`/`Logomark` components in `src/components/common/`.

## Goals / Non-Goals

**Goals**
- A designed, brand-forward entrypoint that feels native to the existing "evidence board" world.
- Real light/dark parity using only existing tokens.
- A clean handoff into the untouched upload flow.

**Non-Goals**
- Persisting images or resumable investigation sessions (future change).
- Any change to components or behavior downstream of the splash screen.
- The Tauri build-time boot splash / window chrome (OS-level splash is out of scope).

## Decisions

### D1 — Replace, don't add: one SplashScreen
The dead boot-animation `SplashScreen.tsx` is deleted and the new entrypoint takes its place as `src/components/SplashScreen.tsx`. Rationale: two components named "splash" guarantees confusion; the boot animation is unreferenced dead code. *Alternative considered:* renaming the new component `WelcomeScreen` — rejected; the user's term and the file's existing name align, and the boot animation has no callers to preserve.

### D2 — Composition: asymmetric split, evidence-board grammar
Full-bleed `bg-app-black` stage. A single vertical hairline (`--glass-border`) divides the surface at roughly 45/55 (left/right), echoing the hairline borders of `.glass-panel` rather than introducing card-on-card nesting:

- **Left (~45%):** the `Logomark` alone at large scale (`w-40 h-40`–`w-48 h-48`), centered — nothing else (user decision; the wordmark already lives in the app header after entry). Version stamp (`v{__APP_VERSION__}`) pinned bottom-left in `font-mono text-xs text-app-accent-dim`, matching the old splash's signature — app chrome, not brand content.
- **Right (~55%):** left-aligned column, vertically centered, `max-w-md`:
  - `Button variant="primary" size="lg"` with a `Plus` lucide icon: "Start new investigation".
  - Below, a `text-xs font-mono text-app-accent-dim uppercase` section label "RECENT INVESTIGATIONS" — the same tracked-mono-label pattern used across app chrome.
  - The list region: rows separated by hairline `border-app-gray-light/30` dividers (not nested cards — avoids glass-on-glass per DESIGN.md). Rows will carry name in `text-sm text-app-white` (truncated) and a right-aligned `text-xs text-app-accent-dim font-mono` relative timestamp — **not built in this change** (see D4).
  - Empty state (current and only state for now): a `font-mono text-xs text-app-accent-dim` line ("No investigations yet — start your first above") inside a hairline-dashed border block, matching the app's quiet empty-state register (cf. `AppLayout` `isEmpty` panel).

Type, spacing, and radii stay on the documented scale: `text-sm`/`text-xs` body, `p-4`/`gap-4` rhythm, no off-scale radii. Icons: `lucide-react` only, `w-4 h-4`/`w-5 h-5`.

### D3 — Entrance motion: one staggered reveal, reduced-motion aware
Two-phase stagger on mount (left composition, then right column, ~200ms apart) using opacity + small `translate-y` transitions (`duration-700 ease-out`) — this inherits the motion grammar of the old (unused) splash and AppHeader feel, so it stays in-world. `prefers-reduced-motion: reduce` collapses it instantly (global rule already in `index.css` handles transitions; the initial hidden state must also be gated so reduced-motion users never see a blank flash — use a `useReducedMotion`-style check via `matchMedia` to start in the visible state). Deliberately restrained: Operate mode, brand lives in precision, not flourish.

### D4 — Recent list: placeholder now, save files later
**No persistence is built in this change.** Investigations remain in-memory; the list region renders its empty state permanently. A future change will persist investigation save files on the user's machine (Tauri fs) and populate the list from them — the region, section label, and empty state are designed now so that population later is a data-plug-in, not a redesign.

*Alternative considered:* localStorage-backed history records — rejected after user review: it would show entries that cannot be reopened and would be discarded once real save files arrive; a permanently blank list is more honest.

```json
// Future record shape (contract noted for the later change, not implemented here)
[{ "id": "a1b2", "name": "Investigation — 2026-07-14 09:32", "startedAt": 1752478320000, "lastActiveAt": 1752481000000, "imageCount": 14 }]
```

### D5 — Mount gating in App.tsx
`App.tsx` gains a `sessionState: 'splash' | 'active'` state initialized to `'splash'`. When `'splash'`, App renders only `<SplashScreen onStart={…} />` and nothing else (no `AppHeader`, no layout) — guaranteeing the splash owns the window. `onStart` flips to `'active'`, rendering the app exactly as it exists today. The theme context mounts as it already does so the splash inherits the user's theme from first paint. Deliberately the *only* structural change to `App.tsx`.

### D6 — Responsive fallback
The two-region split is the target layout at the desktop viewport (≥ `lg`, per E2E 1600×900 standard). Below `lg`, the split stacks: logo composition on top, actions below, list capped with scroll. The E2E suite and selectors are written against the desktop layout.

## Risks / Trade-offs

- [List stays blank until save files exist — users may read it as broken] → The empty state is framed as an invitation ("No investigations yet — start your first above"), not an error; the section label keeps the region's purpose legible.
- [E2E specs assume direct upload entry] → `bootApp` gains an option to start past the splash (default behavior preserved for existing specs via that flag); new splash specs opt in. Mechanical, spec'd in tasks.

## Migration Plan

Single self-contained change; no data migration (new localStorage key, first-use empty). Rollback = revert commit; the only coupled surface is the E2E `bootApp` option, which is additive.

## Open Questions

None — the one genuinely open product question (source of "recent investigations" data) is resolved by D4 as history-only, flagged in the proposal for user approval.
