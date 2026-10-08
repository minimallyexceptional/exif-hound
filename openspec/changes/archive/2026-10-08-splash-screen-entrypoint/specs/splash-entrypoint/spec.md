# splash-entrypoint — Specification (delta)

## ADDED Requirements

### Requirement: Splash screen is shown at launch
The application SHALL show a splash screen as its entrypoint on launch. The splash screen MUST occupy the full app window and MUST NOT render any part of the existing app shell (header, uploader, map, gallery) until the user has made an entry choice.

#### Scenario: First launch of the session
- **WHEN** the app starts
- **THEN** the splash screen is displayed as the only visible surface

### Requirement: Splash screen layout — logo and investigations
The splash screen SHALL present a two-region composition:
- **Left region:** a large ExifHound logomark alone (no wordmark, tagline, or other brand content).
- **Right region:** a prominent "Start new investigation" primary action, and beneath it a recent investigations region.

#### Scenario: Composition renders
- **WHEN** the splash screen is displayed
- **THEN** the logomark is visible in the left region, and the primary action and recent investigations region are visible in the right region, with the action positioned above the list region

### Requirement: Start new investigation enters the existing flow
Activation of the new-investigation action SHALL dismiss the splash screen and enter the existing upload entrypoint (the app's current empty-state upload experience), with the recorded session counting as a new investigation.

#### Scenario: User starts a new investigation
- **WHEN** the user activates "Start new investigation"
- **THEN** the splash screen is dismissed and the existing upload empty-state is shown, ready to receive photos

### Requirement: Recent investigations region is a history placeholder
The recent investigations region SHALL exist in the layout beneath the primary action and SHALL render an empty state in this change: no sessions are recorded or persisted, and the region MUST NOT imply that prior investigations can be reopened or resumed. Population of this list from user-machine save files is deferred to a future change.

#### Scenario: Empty state
- **WHEN** the splash screen is displayed
- **THEN** the recent investigations region shows an empty state inviting the user to start their first investigation, with no entry rows and no interactive resume affordances

### Requirement: Theme support
The splash screen SHALL fully support both light and dark themes using the app's existing `data-theme` token system. All colors MUST come from the shared `--app-*` tokens; the logomark SHALL render in theme-appropriate ink (existing theme-aware Logomark behavior). No hardcoded color literals are permitted.

#### Scenario: Dark theme render
- **WHEN** the active theme is dark
- **THEN** the splash screen renders with the dark token palette, logomark in light ink

#### Scenario: Light theme render
- **WHEN** the active theme is light
- **THEN** the splash screen renders with the light token palette, logomark in dark ink

### Requirement: Existing flow untouched
All behavior after the splash screen (upload, map, list, investigation, export/import, settings) MUST remain unchanged. The splash screen MUST NOT alter any downstream requirement or component behavior.

#### Scenario: Regression guard
- **WHEN** the user proceeds past the splash screen
- **THEN** the application behaves exactly as it did before this change

### Requirement: Motion accessibility
Any splash entrance transitions MUST respect `prefers-reduced-motion: reduce` (instant rendering, no animation).

#### Scenario: Reduced motion preference
- **WHEN** the OS reports `prefers-reduced-motion: reduce`
- **THEN** the splash screen renders fully composed with no animated transitions
