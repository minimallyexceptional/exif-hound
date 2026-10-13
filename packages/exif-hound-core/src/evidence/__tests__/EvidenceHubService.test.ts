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

describe('EvidenceHubService', () => {
  it('loads an index and resolves images for navigation', async () => {
    const store = {
      listProjectOcrResults: jest.fn().mockResolvedValue([]),
      listProjectIdentifierResults: jest.fn().mockResolvedValue([]),
      listProjectProvenanceResults: jest.fn().mockResolvedValue([]),
    } as unknown as ProjectStore;
    const service = new EvidenceHubService(store, [image]);
    const index = await service.loadIndex();
    expect(index.categories).toHaveLength(8);
    expect(service.resolveImage(5)).toBe(image);
    expect(service.resolveImage(99)).toBeUndefined();
  });

  it('formats load errors', () => {
    expect(EvidenceHubService.loadErrorMessage(new Error('x'))).toBe('x');
    expect(EvidenceHubService.loadErrorMessage(null)).toBe('Could not load evidence.');
  });
});
