/**
 * Location formatting helpers for EXIF location objects persisted in projects.
 * Reverse geocoding (Nominatim) was removed — coordinates stay local-only.
 */

export interface LocationData {
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  road?: string;
  postcode?: string;
  formatted?: string;
  loading: boolean;
  error?: string;
}

export function formatLocation(location: LocationData): string {
  if (location.error || !location) {
    return 'Location information unavailable';
  }

  if (location.formatted) {
    return location.formatted;
  }

  const parts = [];

  if (location.road) parts.push(location.road);
  if (location.suburb) parts.push(location.suburb);
  if (location.village) parts.push(location.village);
  if (location.city) parts.push(location.city);
  if (location.county) parts.push(location.county);
  if (location.state) parts.push(location.state);
  if (location.country) parts.push(location.country);

  return parts.join(', ') || 'Unknown location';
}

export function formatShortLocation(location: LocationData): string {
  if (location.error || !location) {
    return 'Unknown';
  }

  const parts = [];

  if (location.city || location.town || location.village) {
    parts.push(location.city || location.town || location.village);
  }

  if (location.state) {
    parts.push(location.state);
  }

  if (location.country) {
    parts.push(location.country);
  }

  return parts.join(', ') || 'Unknown location';
}
