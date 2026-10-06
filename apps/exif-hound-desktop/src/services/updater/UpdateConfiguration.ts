/**
 * Update configuration for the single Exif Hound application.
 *
 * PRIVACY NOTE: the update system is pull-based and anonymous by design.
 * The updater fetches a small static manifest from the project's GitHub Pages
 * site and performs the version comparison locally. It never sends the app
 * version, OS details, architecture, license data, investigation data,
 * image metadata, filenames, or any persistent identifier. Nothing about
 * the request identifies the user beyond what ordinary HTTPS requires
 * (e.g. the client's IP address, which the app cannot avoid and does not
 * store, correlate, or transmit anywhere else).
 *
 * The actual feed URL used at runtime is baked into tauri.conf.json (stable)
 * or a channel overlay and consumed by the Rust updater plugin. The constants
 * here keep the frontend, manifest tooling, and documentation aligned.
 */

/** Internal: used to test update chains (e.g. 2.7.0-test.1 -> 2.7.0-test.2). */
export type UpdateChannel = 'stable' | 'beta' | 'internal';

export const UPDATE_FEED_BASE_URL = 'https://minimallyexceptional.github.io/exif-hound';

export const UPDATE_CHANNELS: readonly UpdateChannel[] = ['stable', 'beta', 'internal'] as const;

/**
 * Resolves the update manifest URL for a channel.
 *
 *   /stable/latest.json
 *   /beta/latest.json
 *   /internal/latest.json
 */
export function resolveFeedUrl(channel: UpdateChannel): string {
  return `${UPDATE_FEED_BASE_URL}/${channel}/latest.json`;
}

export interface UpdateConfiguration {
  channel: UpdateChannel;
  /** The manifest URL for this configuration (see resolveFeedUrl). */
  feedUrl: string;
  /** User-facing display name. */
  appName: string;
}

/**
 * Returns the update configuration for the running build.
 *
 * Accepts an explicit channel for testability; defaults to the compile-time
 * `__UPDATE_CHANNEL__` define set by vite.config.ts.
 */
export function getUpdateConfiguration(
  channel: UpdateChannel = __UPDATE_CHANNEL__
): UpdateConfiguration {
  return {
    channel,
    feedUrl: resolveFeedUrl(channel),
    appName: 'Exif Hound',
  };
}
