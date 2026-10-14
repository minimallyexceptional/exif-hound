# Design: App-wide Sonner toasts

## Context
The desktop app has no shared toast layer. Workbench uses a dismissible banner. Imports use a header `role="alert"`. The updater uses four modal dialogs. Clipboard success uses inline `role="status"` text.

## Decisions
- Add `sonner` to `exif-hound-desktop` only. Do not initialize shadcn; there is no `components.json`.
- All toast calls go through `notify` (`success`, `error`, `loading`, `action`, `dismiss`) so duration, close-button, and copy rules stay in one place.
- Mount `<AppToaster />` inside `ThemeProvider` in `main.tsx` (`position="bottom-right"`, `visibleToasts={4}`).
- Success duration 4s, error duration 8s, loading/available/ready `Infinity`. Loading toasts are not dismissible. Action toasts have an X and an action button.
- Theme Sonner CSS variables with `--app-gray`, `--app-white`, `--app-danger`, `--app-danger-bg`, `--glass-border`. Honor `data-theme` and `prefers-reduced-motion`.
- Batch uploads and imports emit one summary toast.
- Updater toasts use stable ids `update-available`, `update-progress`, `update-ready`, `update-error`. Only one updater toast is visible. Dismissing available/ready with X is the current Later behavior. Install starts download. Restart & Update either confirms unsaved work in a dialog or installs immediately.
- Inline validation stays in open forms. Workbench node failure messages on cards stay.

## Risks
- Sonner `onDismiss` also fires when a toast is replaced. Updater Later must ignore dismissals that happen because the state machine moved on.
- Jest tests mock `notify` rather than Sonner internals; Playwright covers live toast copy.
