/**
 * Diagnostics utility for debugging GPS coordinate issues
 */

/**
 * Detect if coordinates are likely in North America
 */
export function isNorthAmerica(lat: number, lng: number): boolean {
  return lat > 15 && lat < 70 && Math.abs(lng) > 50 && Math.abs(lng) < 180;
}

/**
 * Detect if coordinates are likely in South America
 */
export function isSouthAmerica(lat: number, lng: number): boolean {
  return lat < 0 && lat > -60 && Math.abs(lng) > 30 && Math.abs(lng) < 100;
}

/**
 * Detect if coordinates are likely in the Western Hemisphere (Americas)
 */
export function isWesternHemisphere(lat: number, lng: number): boolean {
  return isNorthAmerica(lat, lng) || isSouthAmerica(lat, lng);
}

/**
 * Fix Western hemisphere coordinates (North/South America)
 */
export function fixWesternHemisphere(lat: number, lng: number): [number, number] {
  if (isWesternHemisphere(lat, lng) && lng > 0) {
    console.warn("DIAGNOSTICS: Western hemisphere location with incorrect positive longitude");
    console.warn(`Before: ${lat}, ${lng} → After: ${lat}, ${-Math.abs(lng)}`);
    return [lat, -Math.abs(lng)];
  }
  return [lat, lng];
}

/**
 * Apply all coordinate fixes
 */
export function fixCoordinates(lat: number | null, lng: number | null): [number | null, number | null] {
  if (lat === null || lng === null) return [lat, lng];
  
  // Apply Western hemisphere fix to ensure negative longitude for Americas
  const [fixedLat, fixedLng] = fixWesternHemisphere(lat, lng);
  
  return [fixedLat, fixedLng];
} 