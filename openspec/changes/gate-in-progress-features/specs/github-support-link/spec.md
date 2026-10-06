# GitHub Support Link

## MODIFIED Requirements

### Requirement: Open the Exif Hound GitHub repository

The app SHALL show a "Star on GitHub" action directly below "Check for Updates" in the mobile menu, and a matching "Star on GitHub" button in the Settings About section directly below the update controls. Activating either action SHALL open `https://github.com/minimallyexceptional/exif-hound` in the system browser when running in Tauri, and SHALL open that URL in a new browser tab in web preview. In Tauri, URL opening permission SHALL be scoped to the repository URL.

#### Scenario: User opens repository from the mobile menu

- **WHEN** the user activates "Star on GitHub" in the mobile menu
- **THEN** the Exif Hound repository opens in the external browser
- **AND** the mobile menu closes

#### Scenario: User opens repository from Settings

- **WHEN** the user activates "Star on GitHub" in the Settings About section
- **THEN** the Exif Hound repository opens in the external browser