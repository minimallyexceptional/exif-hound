import { ImageProvenanceAnalyzer, type ImageStructureReader } from '../src';
const structureReader: ImageStructureReader = {
  inspect: jest.fn().mockReturnValue({ format: 'jpeg', width: 100, height: 50, quantizationTableFingerprints: ['q-123'], scans: 1, frames: 1 }),
};
const analyzer = (metadata: Record<string, unknown>) => new ImageProvenanceAnalyzer({
  metadataReader: { read: jest.fn().mockResolvedValue(metadata) }, structureReader,
});
const input = { imageId: 42, imageName: 'evidence.jpg', bytes: new Uint8Array([1, 2, 3]) };

describe('ImageProvenanceAnalyzer', () => {
  it('reports an editor tag with source and observed value without asserting tampering', async () => {
    const result = await analyzer({ Software: 'Adobe Photoshop 25' }).analyze(input);

    expect(result.indicators).toContainEqual(expect.objectContaining({
      code: 'editing-software-tag', sourceField: 'Software', observedValue: 'Adobe Photoshop 25',
    }));
    expect(result).not.toHaveProperty('authenticity');
  });

  it('reports a later file modification time with both supporting timestamp fields', async () => {
    const result = await analyzer({
      DateTimeOriginal: '2024:01:01 10:00:00', ModifyDate: '2025:01:01 10:00:00',
    }).analyze(input);

    expect(result.indicators).toContainEqual(expect.objectContaining({
      code: 'modified-after-capture', sourceFields: ['DateTimeOriginal', 'ModifyDate'],
    }));
  });

  it('makes the lack of timezone information explicit without guessing one', async () => {
    const result = await analyzer({ DateTimeOriginal: '2024:01:01 10:00:00' }).analyze(input);

    expect(result.indicators).toContainEqual(expect.objectContaining({
      code: 'timestamp-timezone-unspecified', sourceField: 'DateTimeOriginal',
    }));
    expect(result.facts.timestamps.capture).toBe('2024:01:01 10:00:00');
  });

  it('reports normalized JPEG structure facts', async () => {
    const result = await analyzer({}).analyze(input);

    expect(result.facts).toMatchObject({
      format: 'jpeg', width: 100, height: 50, quantizationTableFingerprints: ['q-123'], scans: 1, frames: 1,
    });
  });

  it('reports metadata absence as context and does not fabricate timestamps', async () => {
    const result = await analyzer({}).analyze(input);

    expect(result.facts.timestamps).toEqual({});
    expect(result.indicators).toContainEqual(expect.objectContaining({ code: 'metadata-unavailable' }));
  });

  it('exposes stable schema and tool versions with source image identity', async () => {
    const result = await analyzer({}).analyze(input);

    expect(result).toMatchObject({ schemaVersion: 1, toolVersion: expect.any(String), imageId: 42, imageName: 'evidence.jpg' });
  });
});

describe('local JPEG structure inspection', () => {
  it('reads dimensions, quantization tables, frame, and scan markers from bytes', async () => {
    const bytes = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xdb, 0x00, 0x43, 0x00, ...Array.from({ length: 64 }, (_value, index) => index + 1),
      0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x32, 0x00, 0x64, 0x01, 0x01, 0x11, 0x00,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x11, 0xff, 0xd9,
    ]);
    const result = await new ImageProvenanceAnalyzer().analyze({ ...input, bytes });

    expect(result.facts).toMatchObject({ format: 'jpeg', width: 100, height: 50, scans: 1, frames: 1 });
    expect(result.facts.quantizationTableFingerprints).toHaveLength(1);
  });

  it('rejects a truncated JPEG segment rather than reporting guessed structure', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x20, 0x01]);

    await expect(new ImageProvenanceAnalyzer().analyze({ ...input, bytes })).rejects.toThrow(/truncated/i);
  });
});
