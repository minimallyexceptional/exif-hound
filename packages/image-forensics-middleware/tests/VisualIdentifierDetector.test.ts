import { VisualIdentifierDetector } from '../src';
import type { OcrResult } from 'ocr-middleware';

const word = (text: string, x = 0.1, y = 0.1) => ({
  text, confidence: 90, boundingBox: { x, y, width: 0.08, height: 0.04 },
});
const input = { imageId: 7, imageName: 'sign.png', bytes: new Uint8Array([1]) };
const recognizer = (result: Partial<OcrResult> & Pick<OcrResult, 'text' | 'confidence' | 'words'>) => ({
  recognize: jest.fn().mockResolvedValue({ provider: 'paddle', engineVersion: 'test', ...result }),
});

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

  it('detects multiple plates in one image', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'TEXAS\nSFJ+3162\nTEXAS\nBW5-F851',
      confidence: 90,
      words: [
        word('TEXAS', 0.1, 0.2), word('SFJ+3162', 0.1, 0.32),
        word('TEXAS', 0.6, 0.2), word('BW5-F851', 0.6, 0.32),
      ],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });
    const plates = result.candidates.filter(candidate => candidate.family === 'license-plate-like').map(candidate => candidate.value);

    expect(plates).toEqual(expect.arrayContaining(['SFJ3162', 'BW5F851']));
    expect(new Set(plates).size).toBeGreaterThanOrEqual(2);
  });

  it('detects two plates when they appear on one OCR line', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'SFJ+3162 BW5-F851',
      confidence: 90,
      words: [word('SFJ+3162', 0.1, 0.4), word('BW5-F851', 0.6, 0.4)],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });
    const plates = result.candidates.filter(candidate => candidate.family === 'license-plate-like').map(candidate => candidate.value);

    expect(plates).toEqual(expect.arrayContaining(['SFJ3162', 'BW5F851']));
  });

  it('detects both plates when they share one recognized text line without word boxes', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'SFJ+3162 BW5-F851',
      confidence: 90,
      words: [],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });
    const plates = result.candidates.filter(candidate => candidate.family === 'license-plate-like').map(candidate => candidate.value);

    expect(plates).toEqual(expect.arrayContaining(['SFJ3162', 'BW5F851']));
  });

  it('detects both plates when Paddle returns them as one line item', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'TEXAS SFJ+3162 TEXAS BW5-F851',
      confidence: 90,
      words: [word('TEXAS SFJ+3162 TEXAS BW5-F851', 0.1, 0.3)],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });
    const plates = result.candidates.filter(candidate => candidate.family === 'license-plate-like').map(candidate => candidate.value);

    expect(plates).toEqual(expect.arrayContaining(['SFJ3162', 'BW5F851']));
  });

  it('keeps two plates at different locations even when the values match', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'ABC1234\nABC1234',
      confidence: 90,
      words: [word('ABC1234', 0.1, 0.2), word('ABC1234', 0.6, 0.7)],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });
    const plates = result.candidates.filter(candidate => candidate.family === 'license-plate-like');

    expect(plates).toHaveLength(2);
    expect(plates.map(candidate => candidate.boundingBox.x).sort()).toEqual([0.1, 0.6]);
  });

  it('joins split or hyphenated plate tokens when the US profile is selected', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'ABC 1234 ABC-1234',
      confidence: 90,
      words: [word('ABC', 0.1, 0.4), word('1234', 0.2, 0.4), word('ABC-1234', 0.4, 0.5)],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });

    expect(result.candidates.filter(candidate => candidate.family === 'license-plate-like').map(candidate => candidate.value))
      .toEqual(expect.arrayContaining(['ABC1234']));
  });

  it('detects a plate from recognized text when word boxes are missing', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'TEXAS\nBW5-F851',
      confidence: 90,
      words: [],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });

    expect(result.candidates).toContainEqual(expect.objectContaining({
      family: 'license-plate-like', value: 'BW5F851',
    }));
  });

  it('detects Texas plates from recognized text even when words are fragmented', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'TEXAS\nBW5-F851',
      confidence: 90,
      words: ['B', 'W', '5', '-', 'F', '8', '5', '1'].map((text, index) => word(text, 0.1 + index * 0.03, 0.42)),
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });

    expect(result.candidates).toContainEqual(expect.objectContaining({
      family: 'license-plate-like', value: 'BW5F851',
    }));
  });

  it('detects a Texas plate when OCR splits the state word and reads the separator as +', async () => {
    const detector = new VisualIdentifierDetector(recognizer({
      text: 'TEXAS\nSFJ+3162',
      confidence: 90,
      words: [word('TEXAS', 0.2, 0.3), word('SFJ+3162', 0.2, 0.42)],
    }));

    const result = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });

    expect(result.candidates).toContainEqual(expect.objectContaining({
      family: 'license-plate-like',
      value: 'SFJ3162',
      profile: 'us-general',
      boundingBox: expect.objectContaining({ x: 0.2, y: 0.42, width: expect.closeTo(0.08, 8), height: expect.closeTo(0.04, 8) }),
    }));
    expect(result.candidates.some(candidate => candidate.value.includes('TEXAS'))).toBe(false);
  });

  it('does not classify a plate-like token until a profile is explicitly selected', async () => {
    const detector = new VisualIdentifierDetector(recognizer({ text: 'ABC1234', confidence: 90, words: [word('ABC1234')] }));

    const withoutProfile = await detector.detect({ ...input, settings: {} });
    const withProfile = await detector.detect({ ...input, settings: { licensePlateProfile: 'us-general' } });

    expect(withoutProfile.candidates.some(candidate => candidate.family === 'license-plate-like')).toBe(false);
    expect(withProfile.candidates).toContainEqual(expect.objectContaining({
      family: 'license-plate-like', profile: 'us-general', sourceWords: [0],
    }));
    const byFamily = await detector.detect({ ...input, settings: { enabledFamilies: ['license-plate-like'] } });
    expect(byFamily.candidates.some(candidate => candidate.family === 'license-plate-like')).toBe(true);
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
      return { text: '', confidence: 0, words: [], provider: 'paddle' as const, engineVersion: 'test' };
    }) };
    const detector = new VisualIdentifierDetector(ocr);
    const onProgress = jest.fn();

    await detector.detect({ ...input, settings: { language: 'eng+spa' } }, onProgress);

    expect(ocr.recognize).toHaveBeenCalledWith(input.bytes, expect.objectContaining({ languages: 'eng+spa' }));
    expect(onProgress).toHaveBeenCalledWith(0.6, 'recognizing text');
  });
});
