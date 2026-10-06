/// <reference types="vite/client" />

// Vite `define` constant (see vite.config.ts). Replaced at build time;
// Jest provides a runtime global in setupTests.ts.
declare const __DEV__: boolean;

// App version sourced from tauri.conf.json — the single authoritative
// version for the release pipeline. Display only.
declare const __APP_VERSION__: string;

// Feature flags gating in-progress features (see GATED_FEATURES in vite.config.ts).
// Production builds enable only EXIFHOUND_FEATURES entries; dev/test builds enable all.
declare const __FEATURE_FLAGS__: string[];

// Update channel baked at build time via EXIFHOUND_UPDATE_CHANNEL ('stable' | 'beta' | 'internal').
// Display/diagnostics only — the feed URL itself lives in the Tauri config.
declare const __UPDATE_CHANNEL__: 'stable' | 'beta' | 'internal';
