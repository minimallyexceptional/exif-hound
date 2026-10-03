/**
 * Update configuration: which edition feeds into which channel.
 *
 * PRIVACY NOTE: the update system is pull-based and anonymous by design.
 * The updater fetches a small static manifest from `updates.exifhound.com`
 * and performs the version comparison locally. It never sends the app
 * version, OS details, architecture, license data, investigation data,
 * image metadata, filenames, or any persistent identifier. Nothing about
 * the request identifies the user beyond what ordinary HTTPS requires
 * (e.g. the client's IP address, which the app cannot avoid and does not
 * store, correlate, or transmit anywhere else).
 *
 * The actual feed URL used at runtime is baked into the Tauri edition
 * config overlays (src-tauri/tauri.<edition>.conf.json) and consumed by
 * the Rust updater plugin. The constants here exist so the frontend, the
 * manifest tooling (scripts/updater) and the documentation share one
 * declared namespace, and so future channels are a pure configuration
 * change rather than a code change.
 */

export type Edition = 'community' | 'pro';

/** Internal: used to test update chains (e.g. 2.7.0-test.1 -> 2.7.0-test.2). */
export type UpdateChannel = 'stable' | 'beta' | 'internal';

export const UPDATE_FEED_BASE_URL = 'https://updates.exifhound.com';

export const EDITIONS: readonly Edition[] = ['community', 'pro'] as const;
export const UPDATE_CHANNELS: readonly UpdateChannel[] = ['stable', 'beta', 'internal'] as const;

/**
 * Resolves the update manifest URL for an edition/channel pair.
 *
 * Community and Pro are separate feeds backed by separate signing keys, so
 * a Community client can never consume a Pro release and vice versa.
 *
 *   /community/stable/latest.json
 *   /community/beta/latest.json
 *   /community/internal/latest.json
 *   /pro/stable/latest.json
 *   ...
 */
export function resolveFeedUrl(edition: Edition, channel: UpdateChannel): string {
  return `${UPDATE_FEED_BASE_URL}/${edition}/${channel}/latest.json`;
}

export interface UpdateConfiguration {
  edition: Edition;
  channel: UpdateChannel;
  /** The manifest URL for this configuration (see resolveFeedUrl). */
  feedUrl: string;
  /** User-facing display name, e.g. "Exif Hound Pro". */
  appName: string;
}

/**
 * Returns the update configuration for the running build.
 *
 * Accepts explicit parameters for testability; defaults to the compile-time
 * `__EDITION__` / `__UPDATE_CHANNEL__` defines set by vite.config.ts.
 */
export function getUpdateConfiguration(
  edition: Edition = __EDITION__,
  channel: UpdateChannel = __UPDATE_CHANNEL__
): UpdateConfiguration {
  return {
    edition,
    channel,
    feedUrl: resolveFeedUrl(edition, channel),
    appName: edition === 'community' ? 'Exif Hound Community' : 'Exif Hound Pro',
  };
}