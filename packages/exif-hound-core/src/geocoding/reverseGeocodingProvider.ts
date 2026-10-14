import type { LocationData } from '../types/location';

/** Swappable reverse-geocoding backend (default: OpenStreetMap Nominatim). */
export interface ReverseGeocodingProvider {
  reverse(latitude: number, longitude: number): Promise<LocationData>;
}

let configuredProvider: ReverseGeocodingProvider | null = null;

export function configureReverseGeocodingProvider(provider: ReverseGeocodingProvider | null): void {
  configuredProvider = provider;
}

export function getReverseGeocodingProvider(): ReverseGeocodingProvider | null {
  return configuredProvider;
}
