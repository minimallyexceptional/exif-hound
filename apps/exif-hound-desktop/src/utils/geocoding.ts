/**
 * Geocoding utility for converting coordinates to human-readable locations
 */

// Define the location data structure
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

// Cache for storing previously retrieved location data
interface LocationCache {
  [key: string]: LocationData;
}

// In-memory cache to avoid repeated API calls
const locationCache: LocationCache = {};

// Rate limiting for API calls (OpenStreetMap usage policy recommends max 1 request per second)
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 1100; // 1.1 seconds to be safe

/**
 * Create a cache key from latitude and longitude
 */
function createCacheKey(latitude: number, longitude: number): string {
  // Round to 4 decimal places for cache efficiency (about 11m precision)
  const lat = Math.round(latitude * 10000) / 10000;
  const lng = Math.round(longitude * 10000) / 10000;
  return `${lat},${lng}`;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Respect rate limits for API calls
 */
async function respectRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCallTime;
  
  if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
    const waitTime = MIN_API_CALL_INTERVAL - timeSinceLastCall;
    await sleep(waitTime);
  }
  
  lastApiCallTime = Date.now();
}

/**
 * Get a human-readable location from coordinates using OpenStreetMap Nominatim
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Location data including country, city, etc.
 */
export async function getLocationFromCoordinates(
  latitude: number, 
  longitude: number
): Promise<LocationData> {
  // Check cache first
  const cacheKey = createCacheKey(latitude, longitude);
  
  if (locationCache[cacheKey]) {
    return locationCache[cacheKey];
  }
  
  try {
    // Wait for rate limit before making API call
    await respectRateLimit();
    
    // Use OpenStreetMap Nominatim for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        // Add a user agent as required by Nominatim usage policy
        'User-Agent': 'Exif-Hound/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract address components
    const address = data.address || {};
    
    const locationData: LocationData = {
      country: address.country,
      state: address.state,
      county: address.county,
      city: address.city || address.town,
      village: address.village,
      suburb: address.suburb,
      road: address.road,
      postcode: address.postcode,
      formatted: data.display_name,
      loading: false
    };
    
    // Cache the result
    locationCache[cacheKey] = locationData;
    
    return locationData;
  } catch (error) {
    console.error('Error getting location data:', error);
    return {
      loading: false,
      error: 'Failed to retrieve location information'
    };
  }
}

/**
 * Generate a formatted address from location data
 * @param location Location data object
 * @returns Formatted address string
 */
export function formatLocation(location: LocationData): string {
  if (location.error || !location) {
    return 'Location information unavailable';
  }
  
  if (location.formatted) {
    return location.formatted;
  }
  
  const parts = [];
  
  // Add components in order of specificity
  if (location.road) parts.push(location.road);
  if (location.suburb) parts.push(location.suburb);
  if (location.village) parts.push(location.village);
  if (location.city) parts.push(location.city);
  if (location.county) parts.push(location.county);
  if (location.state) parts.push(location.state);
  if (location.country) parts.push(location.country);
  
  return parts.join(', ') || 'Unknown location';
}

/**
 * Generate a short location summary (e.g. "San Francisco, CA, USA")
 * @param location Location data object
 * @returns Short location summary
 */
export function formatShortLocation(location: LocationData): string {
  if (location.error || !location) {
    return 'Unknown';
  }
  
  const parts = [];
  
  // Only use the most significant components for a short format
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