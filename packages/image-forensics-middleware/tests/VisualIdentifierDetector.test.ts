import { VisualIdentifierDetector } from '../src';
import type { OcrResult } from 'ocr-middleware';

const word = (text: string, x = 0.1, y = 0.1) => ({
  text, confidence: 90, boundingBox: { x, y, width: 0.08, height: 0.04 },
});
const input = { imageId: 7, imageName: 'sign.png', bytes: new Uint8Array([1]) };
const recognizer = (result: OcrResult) => ({ recognize: jest.fn().mockResolvedValue(result) });

describe('VisualIdentifierDetector', () => {
  it('returns recognized word locations and email/domain/phone/coordinate candidates', async () => {
    const ocr = recognizer({
      text: 'contact alice@example.org site example.org +1 (555) 123-4567 40.7128, -74.0060',
      confidence: 88,
      words: [
        word('alice@example.org', 0.1, 0.1), word('example.org', 0.3, 0.1),
        word('+1', 0.1, 0.2), word('(555)', 0.2, 0.2), word('123-4567', 0.3, 0.2),
        word('40.7128,', 0.1, 0.3), word('-74.0060', 0.2, 0.3),
      ],
    });
    const detector = new VisualIdentifierDetector(ocr);

    const result = await detector.detect({ ...input, settings: {} });

    expect(result.words).toHaveLength(7);
    expect(result.candidates.map(candidate => candidate.family)).toEqual(expect.arrayContaining([
      'email', 'url-domain', 'phone-like', 'coordinate-pair',
    ]));
    expect(result.candidates.every(candidate => candidate.sourceWords.length > 0 && candidate.boundingBox.width > 0)).toBe(true);
  });

  it('does not classify a plate-like token until a profile is explicitly selected', async () => {
    const detector = new VisualIdentifierDetector(recognizer({ text: 'ABC1234', confidence: 90, words: [word('ABC1234')] }));

    const withoutProfile = await detector.detect({ ...input, settings: {} });
    const withProfile = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });

    expect(withoutProfile.candidates.some(candidate => candidate.family === 'license-plate-like')).toBe(false);
    expect(withProfile.candidates).toContainEqual(expect.objectContaining({
      family: 'license-plate-like', profile: 'us-general', sourceWords: [0],
    }));
  });

  it('respects enabled candidate families', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'alice@example.org', confidence: 90, words: [word('alice@example.org')],
    }));

    const result = await detector.detect({ ...input, settings: { enabledFamilies: ['phone-like'] } });

    expect(result.candidates).toEqual([]);
  });

  it('returns a successful empty result when OCR finds no words', async () => {
    const detector = new VisualIdentifierDetector(recognizer({ text: '', confidence: 0, words: [] }));

    await expect(detector.detect({ ...input, settings: {} })).resolves.toMatchObject({ text: '', words: [], candidates: [] });
  });

  it('propagates local OCR errors so the workflow runner can mark the step failed', async () => {
    const failure = new Error('local OCR failed');
    const detector = new VisualIdentifierDetector({ recognize: jest.fn().mockRejectedValue(failure) });

    await expect(detector.detect({ ...input, settings: {} })).rejects.toBe(failure);
  });

  it('forwards selected OCR languages and progress to its caller', async () => {
    const ocr = { recognize: jest.fn(async (_image, options) => {
      options?.onProgress?.({ status: 'recognizing text', progress: 0.6 });
      return { text: '', confidence: 0, words: [] };
    }) };
    const detector = new VisualIdentifierDetector(ocr);
    const onProgress = jest.fn();

    await detector.detect({ ...input, settings: { language: 'eng+spa' } }, onProgress);

    expect(ocr.recognize).toHaveBeenCalledWith(input.bytes, expect.objectContaining({ languages: 'eng+spa' }));
    expect(onProgress).toHaveBeenCalledWith(0.6, 'recognizing text');
  });
});
