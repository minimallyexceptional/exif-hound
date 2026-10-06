# Release Pipeline

## ADDED Requirements

### Requirement: Authoritative app version source

The app version SHALL be defined in exactly one place: `apps/exif-hound-desktop/src-tauri/tauri.conf.json`. The desktop `package.json` and root `package-lock.json` SHALL remain synchronized with it through a repository command, and CI SHALL validate that all three agree before any release build starts.

#### Scenario: Release bump touches one file

- **WHEN** an operator changes the app version
- **THEN** only the `version` field of `tauri.conf.json` requires a manual edit, and the synchronize command updates the desktop `package.json` version and the root `package-lock.json`

#### Scenario: Drift is caught before builds

- **WHEN** the release workflow's validation job detects that `tauri.conf.json`, the desktop `package.json`, and the root `package-lock.json` disagree on the app version
- **THEN** the workflow fails before any platform build starts, with an error naming the inconsistent files

### Requirement: Splash screen version is derived

The splash screen SHALL display the app version obtained from build configuration (a compile-time global derived from `tauri.conf.json`), and the splash screen source SHALL NOT contain a hardcoded version string.

#### Scenario: Splash screen reflects the configured version

- **WHEN** an operator bumps the version in `tauri.conf.json` and builds the app
- **THEN** the splash screen displays the new version without any edit to `SplashScreen.tsx`

### Requirement: Rust crate version requires no release edits

The Rust crate version SHALL NOT be part of the release bump. It SHALL be set to a constant that does not change between releases, with a comment stating that the release version lives in `tauri.conf.json`, so `Cargo.toml` and `Cargo.lock` require no edits to create a release.

#### Scenario: Release bump leaves Cargo files untouched

- **WHEN** an operator prepares a release
- **THEN** neither `Cargo.toml` nor `Cargo.lock` requires an edit

### Requirement: Fail-fast release validation

The release workflow SHALL perform, inside the job that runs before all platform builds: the existing tag-matches-version check, the version-consistency check, and a check that the target release does not already exist as a published (non-draft) release. A misfired release SHALL be refused within seconds of workflow start, not after builds complete.

#### Scenario: Already-published version is refused early

- **WHEN** the workflow targets a version whose GitHub Release already exists and is not a draft
- **THEN** the workflow fails in the pre-build validation job with a clear refusal message, before any platform build runs

#### Scenario: Fresh release passes validation

- **WHEN** the workflow targets a new version with consistent version files
- **THEN** validation passes and platform builds proceed

### Requirement: Tag push is an atomic release trigger

Pushing a tag of the form `v<app-version>` SHALL complete the full release pipeline end to end: validated, built, signed, published as a GitHub Release, and deployed as the refresh of its channel manifest on the update feed. The `github-pages` environment's deployment policies SHALL allow the versioned tag pattern so tag-ref deployments are not rejected.

#### Scenario: Operator releases by pushing a tag

- **WHEN** an operator commits the version bump, pushes `main`, and pushes the matching `v<version>` tag
- **THEN** the release workflow completes and the channel manifest on the update feed describes the new version

#### Scenario: Manual dispatch remains supported

- **WHEN** an operator dispatches the release workflow on `main` for the beta or internal channel
- **THEN** the pipeline publishes that channel's release and refreshes only that channel's manifest

### Requirement: Release flow is documented

The updater documentation SHALL describe the current release flow: the single-file version edit, the synchronize command, the tag-push trigger, the fallback `workflow_dispatch` channels, and the early validation guards.

#### Scenario: Operator follows the documented flow

- **WHEN** an operator consults the updater documentation to create a release
- **THEN** the documented commands and expectations match the implemented pipeline
