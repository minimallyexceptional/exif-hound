import type { ImageData } from '../../types/imageData';
import {
  applyGpsPlaceNamePatches,
  resolveMissingGpsPlaceNames,
} from '../resolveGpsPlaceNames';

const gpsImage = (overrides: Partial<ImageData> = {}): ImageData => ({
  id: 'img-1',
  projectImageId: 7,
  url: 'blob:x',
  file: { name: 'photo.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
  exif: { latitude: 40.7, longitude: -74.0 },
  ...overrides,
});

describe('resolveMissingGpsPlaceNames', () => {
  it('does not look up when place names are disabled', async () => {
    const lookup = jest.fn();
    const patches = await resolveMissingGpsPlaceNames([gpsImage()], {
      enabled: false,
      lookup,
    });
    expect(patches).toEqual([]);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('skips images that already have a formatted place name', async () => {
    const lookup = jest.fn();
    const patches = await resolveMissingGpsPlaceNames([
      gpsImage({
        exif: { latitude: 40.7, longitude: -74.0, location: { formatted: 'NYC', loading: false } },
      }),
    ], { enabled: true, lookup });
    expect(patches).toEqual([]);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('looks up missing labels and returns patches', async () => {
    const lookup = jest.fn().mockResolvedValue({ formatted: 'New York, NY', loading: false });
    const patches = await resolveMissingGpsPlaceNames([gpsImage()], {
      enabled: true,
      lookup,
    });
    expect(lookup).toHaveBeenCalledWith(40.7, -74.0);
    expect(patches).toEqual([{ id: 'img-1', location: { formatted: 'New York, NY', loading: false } }]);
  });

  it('omits patches when lookup returns no formatted name', async () => {
    const lookup = jest.fn().mockResolvedValue({ loading: false, error: 'Failed' });
    const patches = await resolveMissingGpsPlaceNames([gpsImage()], {
      enabled: true,
      lookup,
    });
    expect(patches).toEqual([]);
  });
});

describe('applyGpsPlaceNamePatches', () => {
  it('writes location onto matching session images', () => {
    const image = gpsImage();
    const location = { formatted: 'NYC', loading: false };
    const next = applyGpsPlaceNamePatches([image], [{ id: 'img-1', location }]);
    expect(next[0].exif.location).toEqual(location);
    expect(next[0]).not.toBe(image);
  });
});
