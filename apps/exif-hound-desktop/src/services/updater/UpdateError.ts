/**
 * Update errors.
 *
 * The updater is non-critical infrastructure: any failure here must never
 * prevent EXIF HOUND from launching or working normally. Silent (automatic)
 * checks swallow these entirely; manual checks surface `userMessage`.
 *
 * There is deliberately no "ignore signature" path. An artifact whose
 * minisign signature does not match the edition's baked-in public key can
 * never be installed; the Rust updater enforces this before the frontend
 * ever sees the bytes, and the frontend maps it to VERIFY_FAILED purely
 * for error reporting.
 */

export enum UpdateErrorCode {
  /** The updater is not available in this build (dev/web, no updater config). */
  Unavailable = 'unavailable',
  /** The manifest could not be fetched or parsed (offline, DNS, bad manifest...). */
  CheckFailed = 'check-failed',
  /** The artifact download failed (network interruption, server error...). */
  DownloadFailed = 'download-failed',
  /** Signature verification failed. The update is rejected, never installed. */
  VerifyFailed = 'verify-failed',
  /** Installation failed. The existing installation remains intact. */
  InstallFailed = 'install-failed',
  /** Installation succeeded, but the running process could not relaunch. */
  RelaunchFailed = 'relaunch-failed',
}

export class UpdateError extends Error {
  readonly code: UpdateErrorCode;
  /** Non-technical message suitable for direct display to the user. */
  readonly userMessage: string;

  constructor(code: UpdateErrorCode, userMessage: string, cause?: unknown) {
    super(`${code}: ${userMessage}`);
    this.name = 'UpdateError';
    this.code = code;
    this.userMessage = userMessage;
    // ES2020 target has no Error `cause` option; record it non-enumerably.
    if (cause !== undefined) {
      Object.defineProperty(this, 'cause', { value: cause, enumerable: false, writable: true });
    }
  }
}

const DEFAULT_USER_MESSAGES: Record<UpdateErrorCode, string> = {
  [UpdateErrorCode.Unavailable]: 'Updates are not available in this build.',
  [UpdateErrorCode.CheckFailed]:
    'Unable to check for updates. Please verify your internet connection and try again.',
  [UpdateErrorCode.DownloadFailed]:
    'The update could not be downloaded. Please check your internet connection and try again.',
  [UpdateErrorCode.VerifyFailed]:
    'The downloaded update failed its security verification and was rejected. Nothing was changed on your system.',
  [UpdateErrorCode.InstallFailed]:
    'The update could not be installed. Your installation of EXIF Hound is unchanged.',
  [UpdateErrorCode.RelaunchFailed]:
    'The update was installed, but EXIF Hound could not restart automatically. Close and reopen the app to finish updating.',
};

export function makeUpdateError(code: UpdateErrorCode, cause?: unknown): UpdateError {
  return new UpdateError(code, DEFAULT_USER_MESSAGES[code], cause);
}

/**
 * Maps an error thrown by the Tauri updater plugin (or anything else) onto
 * a typed UpdateError. Signature failures from the Rust side contain
 * distinctive wording; everything else falls back to the operation kind.
 */
export function mapPluginError(
  error: unknown,
  operation: 'check' | 'download' | 'install' | 'relaunch'
): UpdateError {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes('signature') ||
    normalized.includes('minisign') ||
    normalized.includes('public key')
  ) {
    return makeUpdateError(UpdateErrorCode.VerifyFailed, error);
  }

  switch (operation) {
    case 'check':
      return makeUpdateError(UpdateErrorCode.CheckFailed, error);
    case 'download':
      return makeUpdateError(UpdateErrorCode.DownloadFailed, error);
    case 'install':
      return makeUpdateError(UpdateErrorCode.InstallFailed, error);
    case 'relaunch':
      return makeUpdateError(UpdateErrorCode.RelaunchFailed, error);
  }
}
