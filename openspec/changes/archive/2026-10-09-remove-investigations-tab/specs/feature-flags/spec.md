# Spec Delta

## REMOVED Requirements

### Requirement: Build-time feature flag mechanism
**Reason**: The only registered feature flag gates the retired Investigation tab; no other gated feature remains.
**Migration**: Remove `EXIFHOUND_FEATURES` configuration. If a future feature needs gating, define and document that mechanism with the feature.

### Requirement: Gated features are unavailable in the UI
**Reason**: The only gated UI is removed, so no gated feature remains in the application.
**Migration**: The Investigation view is no longer available in any build; use Workbench for image-analysis workflows.

### Requirement: Flag mechanism is documented
**Reason**: The feature-flag mechanism and its contributor guide are removed together.
**Migration**: Future feature-specific gating requirements must document their own implementation.
