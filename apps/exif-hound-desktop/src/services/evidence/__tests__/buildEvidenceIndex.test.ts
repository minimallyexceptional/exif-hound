import { buildEvidenceIndex } from '../buildEvidenceIndex';
import type { ImageData } from '../../../types';

const image: ImageData = {
  id: 'img-1',
  projectImageId: 7,
  url: 'blob:x',
  file: { name: 'photo.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
  exif: { latitude: 40.7, longitude: -74.0, location: { formatted: 'NYC', loading: false } },
};

describe('buildEvidenceIndex', () => {
  it('groups identifier candidates and GPS rows', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const index = buildEvidenceIndex(
      [],
      [{
        id: 1,
        imageId: 7,
        imageName: 'photo.jpg',
        result: {
          candidates: [
            { family: 'license-plate-like', value: 'ABC123', confidence: 88 },
            { family: 'email', value: 'a@b.com', confidence: 92 },
          ],
        },
        resultStatus: 'success',
        workflowId: 'wf',
        workflowRunId: 'run',
        nodeId: 'ids',
        toolVersion: '1.0.0',
        startedAt: now,
        finishedAt: now,
      }],
      [],
      [image],
    );
    expect(index.categories.find(c => c.id === 'license-plates')?.count).toBe(1);
    expect(index.categories.find(c => c.id === 'emails')?.count).toBe(1);
    expect(index.categories.find(c => c.id === 'gps-locations')?.count).toBe(1);
    expect(index.rowsByCategory['license-plates'][0].kind).toBe('identifier');
  });

  it('dedupes duplicate identifier values for the same image', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const record = {
      id: 1,
      imageId: 7,
      imageName: 'photo.jpg',
      result: { candidates: [{ family: 'email', value: 'A@B.com', confidence: 80 }] },
      resultStatus: 'success' as const,
      workflowId: 'wf-a',
      workflowRunId: 'run-a',
      nodeId: 'ids',
      toolVersion: '1.0.0',
      startedAt: now,
      finishedAt: now,
    };
    const index = buildEvidenceIndex(
      [],
      [record, { ...record, id: 2, workflowId: 'wf-b', workflowRunId: 'run-b', result: { candidates: [{ family: 'email', value: 'a@b.com', confidence: 90 }] } }],
      [],
      [],
    );
    expect(index.categories.find(c => c.id === 'emails')?.count).toBe(1);
  });
});
