# DESIGN.md — Exif Hound (desktop app)

Generated from `apps/exif-hound-desktop` code. This is the incumbent design
system; polish aligns toward it, never against it.

## Identity

Dark-first, monochrome "evidence board" aesthetic: near-black surfaces,
hairline glass borders, a single white accent. No brand hue — hierarchy comes
from luminance steps, not color. Light theme is a full inversion of the same
tokens (`[data-theme="light"]` inverts variable values, `--app-white` becomes
dark ink). `ThemeContext` + `ThemeToggle` drive it.

## Color tokens (single source of truth: `src/index.css`)

Dark theme values / light-theme inversion:

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--app-black` | `#000000` | `#ffffff` | App background |
| `--app-dark` | `#121212` | `#f8f9fa` | Deep surface |
| `--app-gray` | `#1a1a1a` | `#e9ecef` | Panel/card surface |
| `--app-gray-light` | `#2a2a2a` | `#dee2e6` | Raised surface, borders, hover |
| `--app-gray-lighter` | `#333333` | `#ced4da` | Strongest raised surface, hover+ |
| `--app-white` | `#ffffff` | `#212529` | Primary text / inverted ink |
| `--app-accent` | `#f5f5f5` | `#495057` | Accent (hover ink, secondary text) |
| `--app-accent-dim` | `#858585` | `#6c757d` | Muted text |
| `--app-overlay` | `rgba(0,0,0,.5)` | `rgba(0,0,0,.1)` | Scrim |
| `--glass-border` | `rgba(255,255,255,.1)` | `rgba(0,0,0,.1)` | Hairline borders |

Tailwind maps them via `@theme` as `bg-app-*` / `text-app-*` / `border-app-*`.
**Rule: never use literal `white`/`black`/`gray-N` or hex in components — use
`app-*` tokens.** Exceptions: overlays above imagery (`bg-black/50` scrims on
photos), and the map imagery itself.

## Component classes (`@layer components` in `index.css`)

- `.glass-panel` — `bg-app-gray` + `glass-border` hairline + `backdrop-blur-md`
  + `shadow-inner-light`. The canonical surface.
- `.stat-card` — flat card for use *inside* already-shaded surfaces (avoids
  nested glass-on-glass). Use instead of `.glass-panel` in sidebars.
- `.button-primary` / `.button-secondary` — px-4 py-2 rounded-lg, 200ms
  color transition. (Prefer the shared `Button` component in practice.)

## Shared components (`src/components/common/`)

- **`Button`** — `variant: primary | secondary | ghost`, `size: sm | md | lg`,
  `icon`, `fullWidth`, `tooltip`. `rounded-lg`, `transition-all duration-300`.
  Primary = `bg-app-white text-app-black`; secondary = `bg-app-gray-light`;
  ghost = text-only with hover bg. Always use this over raw `<button>` for
  prominent actions.
- **`Modal`** — fixed scrim `bg-app-black/50 backdrop-blur-sm`, glass-panel
  body, `rounded-xl`, sizes sm/md/lg/xl, optional fullscreen toggle.
- **`Panel`** — glass-panel card with optional titled header
  (`p-4 border-b border-app-gray-light/30`).
- `Tooltip`, `FilterPanel`, and `Logomark` for the rest.

## Shape & spacing

- Radius scale: `rounded-lg` (default, 67 uses) → `rounded-full` (pills,
  avatars) → `rounded-xl` (modals). Avoid off-scale values.
- Spacing: Tailwind default scale; common paddings `p-4`, `px-4 py-3`,
  gaps `gap-2/4`.
- Type scale in practice: `text-sm` (body/UI default) > `text-xs` (metadata,
  captions) > `text-lg` (panel titles) > `text-xl`/`text-2xl` (headers).
  Metadata is frequently `font-mono`.

## Iconography & imagery

- `lucide-react` exclusively, `w-4 h-4` standard, `w-5`/`w-6` for headers.
- Leaflet maps with dark-tiled styles; popup chrome uses tokens where possible.

## Motion

- Interaction transitions: `transition-colors duration-200` (component classes)
  or `transition-all duration-300` (Button). Hover = subtle luminance step or
  1px translate on Buttons. No bounce/elastic. `prefers-reduced-motion` must be
  respected (currently a known gap; see polish notes).

## Accessibility floor

- Focus must remain visible: no bare `outline-none` without a replacement ring.
- Touch/pointer targets ≥ 40px; `button:disabled` gets `opacity-50` + no-cursor.
- Every icon-only control needs a label (aria-label or tooltip).

## Theme mechanism (critical)

Theme switches via `data-theme` attribute on `<html>` — **never a `.dark`
class**. CSS that needs theme-aware values must use the `--app-*` variables
(they invert automatically) or `[data-theme="light"]`/`[data-theme="dark"]`
selectors. Map chrome (Leaflet popup/controls) lives in
`components/Map/styles/*.css` and must follow the same rule.

## Interaction standards (polished)

- Keyboard focus: `button:focus-visible`/`a:focus-visible` get a global
  outline ring in `index.css`; text inputs signal focus via `border-color`.
- `prefers-reduced-motion: reduce` is honored globally (animations/transitions
  collapse to instant in `index.css`).
- Literal-color exceptions in practice: scrims and handles layered **directly
  over photos** (`bg-black/5` letterboxing, `bg-white/80` comparison handle).
  Everywhere else, use `app-*` tokens.

## Known remaining debt

- Arbitrary values (`top-[4.5rem]`, toggle knob internals) — acceptable when
  the scale has no fit.
- Pre-existing lint debt (51 errors: `no-explicit-any`, unused vars in
  `importData.ts`/`exifWorker.ts`) — tracked separately, not design scope.
