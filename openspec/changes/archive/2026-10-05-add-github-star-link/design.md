# Design — add-github-star-link

## Context

The mobile menu contains the “Check for Updates” button. The request is to put a GitHub star action beneath it.

## Decision

Add an accessible action labeled “Star on GitHub” with a GitHub icon directly after the update action in the mobile menu. In Tauri, use the official opener plugin to open the repository in the system browser, with the opener permission scoped to the exact repository URL. In browser preview, open a new tab with `noopener,noreferrer`.

## Open Questions

The canonical URL is `https://github.com/minimallyexceptional/exif-hound`, confirmed from the configured Git remote.
