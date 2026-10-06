// Vite `define` constant (see vite.config.ts). Replaced at build time;
// Jest provides a runtime global in setupTests.ts.
declare const __FEATURE_FLAGS__: string[];

/**
 * Whether an in-progress feature is enabled in this build.
 *
 * Dev/test builds enable every registered gated feature; production builds
 * enable only features explicitly listed in the EXIFHOUND_FEATURES env var
 * at build time (comma-separated, e.g. `EXIFHOUND_FEATURES=investigation`).
 * Guard gated UI with this so in-progress work never ships in releases.
 */
export function isFeatureEnabled(feature: string): boolean {
  return __FEATURE_FLAGS__.includes(feature);
}
