export {
  getLocationFromCoordinates,
  formatLocation,
  formatShortLocation,
  __setIsTauriEnvironmentForTests,
  type LocationData,
} from './geocoding';

import { getLocationFromCoordinates, formatLocation, formatShortLocation } from './geocoding';

export class GeocodingFacade {
  getLocationFromCoordinates = getLocationFromCoordinates;
  formatLocation = formatLocation;
  formatShortLocation = formatShortLocation;
}
