/**
 * Typed errors for the .investigation archive format.
 * The reader distinguishes "this file is not a valid archive" from
 * "this archive is valid but written by an incompatible format version".
 */

export class ArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveError';
  }
}

/** The bytes are not a recognizable .investigation archive (foreign/corrupt). */
export class InvalidArchiveError extends ArchiveError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidArchiveError';
  }
}

/** The archive is structurally valid but its formatVersion is not supported. */
export class UnsupportedFormatError extends ArchiveError {
  constructor(
    public readonly foundVersion: number,
    public readonly supportedVersion: number,
  ) {
    super(
      `Unsupported investigation format version ${foundVersion} ` +
      `(this app supports version ${supportedVersion}).`
    );
    this.name = 'UnsupportedFormatError';
  }
}