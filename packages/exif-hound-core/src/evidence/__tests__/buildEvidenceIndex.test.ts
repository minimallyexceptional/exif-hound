import { buildEvidenceIndex } from '../buildEvidenceIndex';
import type { ImageData } from '../../types/imageData';

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

  it('maps all identifier families and skips invalid or failed records', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const toolBase = {
      imageId: 1,
      imageName: 'x.png',
      resultStatus: 'success' as const,
      workflowId: 'wf',
      workflowRunId: 'run',
      nodeId: 'n',
      toolVersion: '1',
      startedAt: now,
      finishedAt: now,
    };
    const index = buildEvidenceIndex(
      [],
      [{
        id: 1,
        ...toolBase,
        result: {
          candidates: [
            { family: 'phone-like', value: '+1 555 0100', confidence: 70 },
            { family: 'url-domain', value: 'example.com' },
            { family: 'coordinate-pair', value: '40,-74' },
            { family: 'unknown-family', value: 'skip-me' },
            null,
            { family: 'email', value: 123 },
          ],
        },
      }, {
        id: 2,
        ...toolBase,
        resultStatus: 'failed',
        result: { candidates: [{ family: 'email', value: 'fail@x.com' }] },
      }],
      [],
      [],
    );
    expect(index.categories.find(c => c.id === 'phone-numbers')?.count).toBe(1);
    expect(index.categories.find(c => c.id === 'urls')?.count).toBe(1);
    expect(index.categories.find(c => c.id === 'text-coordinates')?.count).toBe(1);
    expect(index.categories.find(c => c.id === 'emails')?.count).toBe(0);
    const phoneRow = index.rowsByCategory['phone-numbers'][0];
    expect(phoneRow.kind === 'identifier' && phoneRow.confidence).toBe(70);
    const urlRow = index.rowsByCategory['urls'][0];
    expect(urlRow.kind === 'identifier' && urlRow.confidence).toBeNull();
  });

  it('keeps one OCR row per image and skips duplicate list entries', () => {
    const t1 = new Date('2026-01-01T10:00:00Z');
    const t2 = new Date('2026-01-01T11:00:00Z');
    const index = buildEvidenceIndex(
      [
        { id: 1, imageId: 5, imageName: 'a.png', text: 'first', confidence: 80, processedAt: t1, resultStatus: 'success' },
        { id: 2, imageId: 5, imageName: 'a.png', text: 'second', confidence: 90, processedAt: t2, resultStatus: 'success' },
      ],
      [],
      [],
      [],
    );
    expect(index.categories.find(c => c.id === 'ocr-text')?.count).toBe(1);
    expect(index.rowsByCategory['ocr-text'][0].kind).toBe('ocr');
    const ocrRow = index.rowsByCategory['ocr-text'][0];
    expect(ocrRow.kind === 'ocr' && ocrRow.text).toBe('first');
  });

  it('indexes provenance indicators with dedupe and defaults', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const record = {
      id: 10,
      imageId: 2,
      imageName: 'p.jpg',
      result: {
        indicators: [
          { code: 'A', message: 'one', observedValue: ' v ', severity: 'high' },
          { code: 'A', message: 'dup', observedValue: 'v' },
          {},
        ],
      },
      resultStatus: 'success' as const,
      workflowId: 'wf',
      workflowRunId: 'run',
      nodeId: 'prov',
      toolVersion: '1',
      startedAt: now,
      finishedAt: now,
    };
    const index = buildEvidenceIndex([], [], [record, { ...record, id: 11, resultStatus: 'failed' }], []);
    expect(index.categories.find(c => c.id === 'provenance')?.count).toBe(2);
    const rows = index.rowsByCategory.provenance;
    expect(rows[0].kind).toBe('provenance');
    expect(rows[1].kind).toBe('provenance');
    if (rows[0].kind === 'provenance') expect(rows[0].code).toBe('A');
    if (rows[1].kind === 'provenance') {
      expect(rows[1].code).toBe('Indicator');
      expect(rows[1].message).toBe('');
    }
  });

  it('ignores GPS when coordinates are missing or non-finite', () => {
    const mkImage = (partial: Partial<ImageData['exif']>, projectImageId = 1): ImageData => ({
      id: 'x',
      projectImageId,
      url: 'blob:',
      file: { name: 'i.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
      exif: { latitude: undefined, longitude: undefined, ...partial },
    });
    const index = buildEvidenceIndex(
      [],
      [],
      [],
      [
        mkImage({ latitude: Number.NaN, longitude: 0 }),
        mkImage({ latitude: 1, longitude: undefined }),
        { ...mkImage({ latitude: 2, longitude: 3 }), projectImageId: undefined } as ImageData,
        { ...mkImage({ latitude: 4, longitude: 5 }), hasImage: false } as ImageData & { hasImage: boolean },
        mkImage({ latitude: 40, longitude: -70, location: { formatted: 'Place', loading: false } }, 99),
      ],
    );
    expect(index.categories.find(c => c.id === 'gps-locations')?.count).toBe(1);
    const gpsRow = index.rowsByCategory['gps-locations'][0];
    expect(gpsRow.kind).toBe('gps');
    if (gpsRow.kind === 'gps') expect(gpsRow.locationLabel).toBe('Place');
  });
});
