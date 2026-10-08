import { InsightImage } from './types';

/**
 * Shared tunable thresholds for the insights engine.
 */
export const BURST_THRESHOLD_MS = 2000;
export const GAP_RANGE_FRACTION = 0.1;
export const COORDINATE_PRECISION = 3; // ~100 m grid cells
export const SPARSE_FIELD_COUNT = 3;
export const OUTLIER_FRACTION = 0.1;

/**
 * A "core field" for the sparse-metadata anomaly: an image carrying fewer
 * than `SPARSE_FIELD_COUNT` of these is flagged.
 */
export function countCoreFields(image: InsightImage): number {
  let count = 0;
  if (image.dateTimeOriginal) count++;
  if (image.make || image.model) count++;
  if (image.latitude != null && image.longitude != null) count++;
  if (image.imageWidth != null && image.imageHeight != null) count++;
  if (image.software) count++;
  return count;
}

/**
 * Parse a capture timestamp into epoch milliseconds. Accepts ISO 8601
 * strings as well as the EXIF "YYYY:MM:DD HH:mm[:ss]" convention. Returns
 * null when the value is empty or unparseable.
 */
export function parseCaptureTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return iso;
  const match = /^(\d{4}):(\d{2}):(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return new Date(
      Number(year), Number(month) - 1, Number(day),
      Number(hour), Number(minute), second ? Number(second) : 0
    ).getTime();
  }
  return null;
}

/** Local calendar date ("YYYY-MM-DD") for an epoch timestamp. */
export function localDateString(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Format coordinates as "lat, lon" with four decimals. */
export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/** Compose a place name from reverse-geocoded parts, or null if absent. */
export function composeLocationName(
  location: InsightImage['location']
): string | null {
  if (!location) return null;
  if (location.formatted) return location.formatted;
  const parts = [location.suburb, location.town, location.village, location.city, location.state, location.country]
    .filter((part): part is string => Boolean(part && part.trim()));
  return parts.length > 0 ? parts.join(', ') : null;
}
