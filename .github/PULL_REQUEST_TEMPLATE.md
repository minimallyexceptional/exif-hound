<!-- Thank you for contributing! -->

## What does this PR change?

<!-- A short description of the change and why it's needed. -->

## How was it tested?

<!-- e.g. unit tests added/updated, E2E spec, manual reproduction steps. -->

## Checklist

- [ ] `npm run lint` and `npm run typecheck` pass
- [ ] Unit tests added/updated for changed behavior
- [ ] New user-facing data values use the `selectable-value` class
- [ ] Colors use theme token utilities (no hardcoded colors)
- [ ] New in-progress features are registered in `GATED_FEATURES` and guarded with `isFeatureEnabled()`
- [ ] No `import.meta` in source files (use the Vite `define` globals)
- [ ] Any new Tauri command has a canned response registered in the E2E `bootApp` mocks
- [ ] Feature work followed the OpenSpec workflow (`openspec/changes/`)