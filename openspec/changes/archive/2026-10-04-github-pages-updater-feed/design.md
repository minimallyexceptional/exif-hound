# Design: GitHub Pages updater feed

## Context

Stable builds currently request `https://updates.exifhound.com/stable/latest.json`; beta and internal builds use sibling paths. The host does not resolve. The release workflow already generates and validates `latest.json`, uploads it with the signed assets to the correct GitHub repository, and puts release artifact URLs on `https://github.com/${GITHUB_REPOSITORY}/releases/download/...`. The repository is private today, which prevents anonymous installs from downloading those artifacts.

The existing `apps/exif-hound-website` is a Next.js application with server routes for licensing and checkout. It is not appropriate for static GitHub Pages hosting. The update site will be a separate, dependency-free static site.

## Chosen approach

- Use the project Pages URL `https://minimallyexceptional.github.io/exif-hound/` as the public origin. Store manifests at `/stable/latest.json`, `/beta/latest.json`, and `/internal/latest.json`.
- Add a small static index page that links to releases and lists the manifest URLs.
- Keep a `gh-pages` branch as the site and manifest state. The site workflow updates its static files and the release workflow updates only the current channel manifest, preserving other channel files and the index. Both workflows deploy the resulting branch contents through GitHub Pages Actions.
- Point each Tauri channel configuration and the TypeScript URL resolver at the matching Pages path.
- Add beta to the manual release workflow alongside stable and internal. The generated manifest continues to point at signed artifacts on the exact versioned GitHub Release tag. Require a public repository for end-user delivery; do not embed credentials in the client.
- Keep `updates.exifhound.com` out of the active update chain. A custom domain can be added later by configuring DNS and Pages' custom domain, without changing manifest layout.

## Release publication flow

1. Build and sign each platform artifact.
2. Generate and validate a channel-specific manifest from the staged artifacts and `GITHUB_REPOSITORY`.
3. Publish the versioned GitHub Release and its assets as today.
4. Update `latest.json` under the matching channel directory on `gh-pages`, preserve the other site files, and push the branch update.
5. GitHub Pages serves the updated branch. The release workflow fails if it cannot publish the manifest.

The Pages source must be set to GitHub Actions once. Release assets remain on GitHub Releases; Pages hosts only the small manifests and static page.

## Migration and limitations

Installed builds already contain the old feed URL and cannot be redirected by changing the repository. They need one manual installation of a release built with the Pages endpoint. No change to the updater signing key is planned. Keeping the key unchanged is required for existing clients to accept future signed artifacts.

Because `github-pages` is a project site, the base path `/exif-hound/` must be included in the site URL, but the updater manifest paths are absolute under that project path. Any later custom-domain migration must update all three compiled endpoint URLs and the Pages custom-domain configuration together.

## Failure handling

Manifest generation or validation failures stop publication before a release is published. Failure to update the Pages branch is reported as a failed workflow, leaving the release assets available for manual installation while clearly signaling that automatic update discovery is stale.
