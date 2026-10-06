# feature-flags Specification

## Purpose
TBD - created by archiving change gate-in-progress-features. Update Purpose after archive.

## Requirements

### Requirement: Build-time feature flag mechanism

The app SHALL derive feature flags at build time into a `__FEATURE_FLAGS__` global. Development and test builds SHALL enable every registered in-progress feature. Production builds SHALL enable a flag only when it is listed in the `EXIFHOUND_FEATURES` environment variable (comma-separated names) passed to the build.

#### Scenario: Development build shows in-progress features

- **WHEN** a developer runs the app in a development or test build
- **THEN** every registered in-progress feature is enabled

#### Scenario: Production build hides in-progress features by default

- **WHEN** a production build is made without `EXIFHOUND_FEATURES`
- **THEN** no in-progress feature is enabled

#### Scenario: Production build selectively enables a flag

- **WHEN** a production build is made with `EXIFHOUND_FEATURES=investigation`
- **THEN** the listed feature is enabled and unlisted features remain disabled

### Requirement: Gated features are unavailable in the UI

The Investigation view SHALL be gated behind the `investigation` flag. When the flag is disabled, the header button, the mobile-menu entry, and the investigation view SHALL not render, and the app SHALL fall back to a regular view if the gated view is somehow requested.

#### Scenario: Gated feature is absent in production

- **WHEN** a production build without the `investigation` flag runs
- **THEN** no UI element exposes the Investigation view, and the map or list view renders

#### Scenario: Gated feature is visible in development

- **WHEN** a development build runs
- **THEN** the Investigation view is reachable as today

### Requirement: Flag mechanism is documented

Contributor documentation SHALL describe how to register a new in-progress feature behind a flag and how the flag behaves per build type.

#### Scenario: Contributor adds a new gated feature

- **WHEN** a contributor consults the feature-flag documentation
- **THEN** the documented steps match the implemented mechanism
