/// <reference types="vite/client" />

// Vite `define` constant (see vite.config.ts). Replaced at build time;
// Jest provides a runtime global in setupTests.ts.
declare const __DEV__: boolean;

// App edition set at build time via the EDITION env var ('pro' | 'community').
declare const __EDITION__: 'pro' | 'community';

// User-facing app name derived from the edition ('Exif Hound Pro' | 'Exif Hound Community').
declare const __APP_NAME__: string;
