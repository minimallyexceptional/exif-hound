# Feature flags

In-progress features are gated out of production builds with build-time feature
flags. The mechanism exists so unfinished work (e.g. the Investigation view)
can merge to `main` without shipping to users.

## How it works

The registry of gated features lives in `apps/exif-hound-desktop/vite.config.ts`:

```ts
const GATED_FEATURES = ['investigation'];
```

At build time the registry is baked into the frontend as the
`__FEATURE_FLAGS__` global (a `string[]`), derived like the other Vite
`define` globals (`__DEV__`, `__APP_VERSION__`, `__UPDATE_CHANNEL__`):

| Build type | Enabled flags |
| --- | --- |
| Development / test (`vite dev`, Jest) | every feature in `GATED_FEATURES` |
| Production (`vite build`, `tauri:build`) | only names listed in `EXIFHOUND_FEATURES` |

`EXIFHOUND_FEATURES` is a comma-separated list passed to the build, e.g.:

```bash
EXIFHOUND_FEATURES=investigation npm run tauri:build
```

The variable is declared in `apps/exif-hound-desktop/turbo.json` so Turborepo
passes it through to cached tasks.

## Gating UI

Use the accessor from `src/config/featureFlags.ts` at every point that
exposes the feature:

```tsx
import { isFeatureEnabled } from '../config/featureFlags';

{isFeatureEnabled('investigation') && (
  <Button onClick={() => setView('investigation')}>Investigation</Button>
)}
```

Jest reads the global from `src/setupTests.ts`, which enables the full
registry — tests behave like development builds.

## Adding a new gated feature

1. Add the feature name to `GATED_FEATURES` in `vite.config.ts`.
2. Guard every UI entry point with `isFeatureEnabled('<name>')`.
3. If the feature has a view, add a fallback in the view switch for builds
   without the flag (see the `investigation` case in `src/App.tsx`).
4. Ship it to production (remove the flag and the guards) only when the work
   is complete.

Production builds default to **no** gated features; `EXIFHOUND_FEATURES` is an
operator escape hatch for staging/internal builds built from production code.