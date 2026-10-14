import { EvidenceHubService } from '../EvidenceHubService';
import type { ProjectStore } from 'investigation-archive';
import type { ImageData } from '../../types/imageData';

const image: ImageData = {
  id: 'img',
  projectImageId: 5,
  url: 'blob:',
  file: { name: 'a.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
  exif: {},
};

const gpsImage: ImageData = {
  id: 'gps-img',
  projectImageId: 8,
  url: 'blob:',
  file: { name: 'gps.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
  exif: { latitude: 51.5, longitude: -0.12 },
};

function mockStore(): ProjectStore {
  return {
    listProjectOcrResults: jest.fn().mockResolvedValue([]),
    listProjectIdentifierResults: jest.fn().mockResolvedValue([]),
    listProjectProvenanceResults: jest.fn().mockResolvedValue([]),
  } as unknown as ProjectStore;
}

describe('EvidenceHubService', () => {
  it('loads an index and resolves images for navigation', async () => {
    const service = new EvidenceHubService(mockStore(), [image]);
    const { index, patches } = await service.loadIndex();
    expect(index.categories).toHaveLength(8);
    expect(patches).toEqual([]);
    expect(service.resolveImage(5)).toBe(image);
    expect(service.resolveImage(99)).toBeUndefined();
  });

  it('looks up missing GPS place names when enabled and fills the index', async () => {
    const lookup = jest.fn().mockResolvedValue({ formatted: 'London', loading: false });
    const service = new EvidenceHubService(mockStore(), [gpsImage], {
      resolvePlaceNames: true,
      lookupPlaceName: lookup,
    });
    const { index, patches } = await service.loadIndex();
    expect(lookup).toHaveBeenCalledWith(51.5, -0.12);
    expect(patches).toEqual([{ id: 'gps-img', location: { formatted: 'London', loading: false } }]);
    const row = index.rowsByCategory['gps-locations'][0];
    expect(row.kind).toBe('gps');
    if (row.kind === 'gps') expect(row.locationLabel).toBe('London');
  });

  it('does not look up place names when disabled', async () => {
    const lookup = jest.fn();
    const service = new EvidenceHubService(mockStore(), [gpsImage], {
      resolvePlaceNames: false,
      lookupPlaceName: lookup,
    });
    const { index, patches } = await service.loadIndex();
    expect(lookup).not.toHaveBeenCalled();
    expect(patches).toEqual([]);
    const row = index.rowsByCategory['gps-locations'][0];
    expect(row.kind).toBe('gps');
    if (row.kind === 'gps') expect(row.locationLabel).toBeNull();
  });

  it('formats load errors', () => {
    expect(EvidenceHubService.loadErrorMessage(new Error('x'))).toBe('x');
    expect(EvidenceHubService.loadErrorMessage(null)).toBe('Could not load evidence.');
  });
});
