import { GeocodingFacade } from '../../src/geocoding/GeocodingFacade';
import {
  configureReverseGeocodingProvider,
  getLocationFromCoordinates,
} from '../../src/geocoding/geocoding';
import type { ReverseGeocodingProvider } from '../../src/geocoding/reverseGeocodingProvider';

describe('ReverseGeocodingProvider', () => {
  afterEach(() => {
    configureReverseGeocodingProvider(null);
  });

  it('routes getLocationFromCoordinates through configureReverseGeocodingProvider', async () => {
    const provider: ReverseGeocodingProvider = {
      reverse: jest.fn().mockResolvedValue({ city: 'Testville', loading: false }),
    };
    configureReverseGeocodingProvider(provider);

    await expect(getLocationFromCoordinates(1, 2)).resolves.toMatchObject({ city: 'Testville' });
    expect(provider.reverse).toHaveBeenCalledWith(1, 2);
  });

  it('GeocodingFacade uses an instance provider before the global default', async () => {
    const instanceProvider: ReverseGeocodingProvider = {
      reverse: jest.fn().mockResolvedValue({ formatted: 'Instance', loading: false }),
    };
    const globalProvider: ReverseGeocodingProvider = {
      reverse: jest.fn().mockResolvedValue({ formatted: 'Global', loading: false }),
    };
    configureReverseGeocodingProvider(globalProvider);

    const facade = new GeocodingFacade(instanceProvider);
    await expect(facade.getLocationFromCoordinates(3, 4)).resolves.toMatchObject({ formatted: 'Instance' });
    expect(instanceProvider.reverse).toHaveBeenCalledWith(3, 4);
    expect(globalProvider.reverse).not.toHaveBeenCalled();
  });
});
