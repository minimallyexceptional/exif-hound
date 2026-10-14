import type { ExifData } from '../types';

const GPS_FIELD_NAMES = new Set([
  'latitude',
  'longitude',
  'gpsAltitude',
  'gpsAltitudeRef',
]);

/** Remove GPS-related fields from EXIF metadata for redacted exports. */
export function redactGpsFromExif(exif: ExifData): ExifData {
  const copy = { ...exif };
  for (const key of GPS_FIELD_NAMES) {
    delete (copy as Record<string, unknown>)[key];
  }
  if (copy.location) {
    copy.location = null;
  }
  return copy;
}
