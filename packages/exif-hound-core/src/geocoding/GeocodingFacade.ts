import {
  formatLocation,
  formatShortLocation,
  getLocationFromCoordinates as resolveLocationFromCoordinates,
  __setIsTauriEnvironmentForTests,
  type LocationData,
} from './geocoding';
import type { ReverseGeocodingProvider } from './reverseGeocodingProvider';

export {
  configureReverseGeocodingProvider,
  getLocationFromCoordinates,
  formatLocation,
  formatShortLocation,
  __setIsTauriEnvironmentForTests,
  type LocationData,
  type ReverseGeocodingProvider,
} from './geocoding';

export class GeocodingFacade {
  constructor(private readonly provider?: ReverseGeocodingProvider) {}

  getLocationFromCoordinates(latitude: number, longitude: number): Promise<LocationData> {
    if (this.provider) {
      return this.provider.reverse(latitude, longitude);
    }
    return resolveLocationFromCoordinates(latitude, longitude);
  }

  formatLocation = formatLocation;
  formatShortLocation = formatShortLocation;
}
