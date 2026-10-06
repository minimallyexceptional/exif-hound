# Proposal

## Why

The desktop updater currently points to `updates.exifhound.com`, which does not resolve, so installed copies cannot fetch update manifests. Release assets are hosted on GitHub, but the manifest feed is not being published to an available public host. GitHub Pages can provide a simple public site and stable channel manifest URLs without adding a separate hosting service.

## What Changes

- Add a small static Exif Hound updates page suitable for GitHub Pages.
- Publish validated stable, beta, and internal manifests at predictable channel paths on the Pages site while retaining the other channels' current manifests.
- Point the native updater configuration and its frontend diagnostics at those Pages URLs.
- Support beta releases through the existing manual release workflow so all configured update channels can publish their own manifests.
- Keep signed installers on GitHub Releases and make release publication fail visibly if manifest publication cannot complete.
- Document the one-time Pages setup, public-repository requirement, and one-time manual update needed by installed versions that still use the unavailable feed.

## Capabilities

### New Capabilities

- `update-feed-hosting`: Public Pages hosting for channel manifests and basic release information, including publication from the release workflow.

### Modified Capabilities

None.

## Impact

- New standalone static site files, separate from the existing Next.js licensing and checkout website.
- Tauri updater endpoints, updater configuration helpers/tests, and update documentation.
- `.github/workflows/release.yml` and GitHub Pages repository settings.
- Public access to GitHub Releases is required because installed applications have no GitHub credentials. The repository is currently private; it must be made public before anonymous users can download release assets.
