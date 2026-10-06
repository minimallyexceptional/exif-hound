# Update Feed Hosting

## ADDED Requirements

### Requirement: Public updates landing page

The project SHALL publish a static Exif Hound updates page on GitHub Pages. The page SHALL identify the application, provide a link to GitHub Releases, and list the stable, beta, and internal manifest URLs.

#### Scenario: Visitor opens the Pages site

- **WHEN** a visitor opens the configured GitHub Pages site
- **THEN** the page identifies Exif Hound and links to releases and each update channel's manifest

### Requirement: Public channel manifests

The updater SHALL fetch stable, beta, and internal manifests from public GitHub Pages URLs under the project site. The Tauri native updater configuration and frontend update diagnostics SHALL resolve each channel to the same URL.

#### Scenario: Stable build checks for updates

- **WHEN** a stable build checks for an update
- **THEN** it fetches the stable manifest from the GitHub Pages site

#### Scenario: Non-stable build checks for updates

- **WHEN** a beta or internal build checks for an update
- **THEN** it fetches only that channel's manifest from the corresponding GitHub Pages path

### Requirement: Release publishes its channel manifest

After the release workflow has generated and validated a manifest and published its signed release assets, it SHALL publish that manifest to the matching Pages channel path. Publishing one channel SHALL preserve the latest manifests for every other channel. A failed Pages publication SHALL fail the release workflow so operators know the update feed was not refreshed.

#### Scenario: Stable release is published

- **WHEN** the stable release workflow completes
- **THEN** the Pages site's stable manifest describes that release and links to its signed GitHub Release artifacts

#### Scenario: Internal release is published

- **WHEN** an internal release workflow completes
- **THEN** the Pages site's internal manifest describes that release while the stable and beta manifests remain available

### Requirement: Anonymous clients can download release artifacts

GitHub Release artifacts referenced by a public update manifest SHALL be anonymously downloadable. The repository SHALL be public before this update chain is used by end-user installations.

#### Scenario: Installed app downloads a signed update

- **WHEN** an installed app receives a newer manifest and downloads its artifact URL
- **THEN** GitHub serves the referenced release asset without requiring a GitHub account or token

### Requirement: Existing installations can recover from a retired feed

Documentation SHALL explain that an installed version compiled with the unavailable `updates.exifhound.com` endpoint cannot learn a replacement endpoint from the new Pages site. Such installations SHALL be directed to install one release manually before using automatic updates again.

#### Scenario: User has a build with the retired feed URL

- **WHEN** the installed app cannot resolve the old update feed
- **THEN** the user can download and install the current release manually, after which future checks use GitHub Pages
