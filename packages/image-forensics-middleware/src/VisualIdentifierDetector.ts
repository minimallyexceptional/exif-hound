import type { IdentifierCandidate, LocalOcrRecognizer, VisualIdentifierInput, VisualIdentifierResult } from './types';
import type { OcrWord } from 'ocr-middleware';

export class VisualIdentifierDetector {
  constructor(private readonly ocr: LocalOcrRecognizer, private readonly toolVersion = '1.0.0') {}

  async detect(
    input: VisualIdentifierInput,
    onProgress?: (progress: number, status?: string) => void,
  ): Promise<VisualIdentifierResult> {
    if (!input.bytes.length) throw new Error('The selected image has no readable bytes.');
    const recognized = await this.ocr.recognize(input.bytes, {
      languages: input.settings.language ?? 'eng',
      onProgress: progress => onProgress?.(progress.progress, progress.status),
    });
    const words = recognized.words ?? [];
    const enabled = enabledFamilies(input.settings.enabledFamilies);
    const candidates: IdentifierCandidate[] = [];
    for (const line of groupLines(words)) {
      for (const rule of rules) {
        if (!enabled.has(rule.family)) continue;
        rule.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = rule.pattern.exec(line.text)) !== null) {
          if (!rule.validate(match[0])) continue;
          const evidence = line.words.filter(word => word.start < match!.index + match![0].length
            && word.end > match!.index);
          if (!evidence.length) continue;
          candidates.push(createCandidate(rule.family, match[0].trim(), evidence));
          if (!match[0].length) rule.pattern.lastIndex += 1;
        }
      }
    }
    const profile = input.settings.licensePlateProfile;
    if (profile === 'us-general') {
      words.forEach((word, index) => {
        if (/^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{5,8}$/i.test(word.text.trim())) {
          candidates.push(createCandidate('license-plate-like', word.text, [{ word, index, start: 0, end: word.text.length }], profile));
        }
      });
    }
    return {
      schemaVersion: 1,
      toolVersion: this.toolVersion,
      imageId: input.imageId,
      imageName: input.imageName,
      text: recognized.text,
      confidence: normalizeConfidence(recognized.confidence),
      words,
      candidates: uniqueCandidates(candidates),
    };
  }
}

interface LineWord { word: OcrWord; index: number; start: number; end: number }
interface WordLine { text: string; words: LineWord[]; centerY: number; height: number }

function groupLines(words: OcrWord[]): WordLine[] {
  const ordered = words.map((word, index) => ({ word, index }))
    .filter(({ word }) => word.text.trim().length > 0)
    .sort((left, right) => left.word.boundingBox.y - right.word.boundingBox.y
      || left.word.boundingBox.x - right.word.boundingBox.x);
  const lines: Array<{ centerY: number; height: number; words: Array<{ word: OcrWord; index: number }> }> = [];
  for (const entry of ordered) {
    const box = entry.word.boundingBox;
    const centerY = box.y + box.height / 2;
    const line = lines.find(candidate => Math.abs(candidate.centerY - centerY)
      <= Math.max(candidate.height, box.height, 0.015) * 0.7);
    if (line) {
      line.words.push(entry);
      line.centerY = line.words.reduce((sum, item) => sum + item.word.boundingBox.y + item.word.boundingBox.height / 2, 0) / line.words.length;
      line.height = Math.max(line.height, box.height);
    } else {
      lines.push({ centerY, height: box.height, words: [entry] });
    }
  }
  return lines.map(line => {
    const sorted = line.words.sort((left, right) => left.word.boundingBox.x - right.word.boundingBox.x);
    let cursor = 0;
    const indexed = sorted.map(({ word, index }) => {
      if (cursor) cursor += 1;
      const start = cursor;
      cursor += word.text.length;
      return { word, index, start, end: cursor };
    });
    return { text: indexed.map(entry => entry.word.text).join(' '), words: indexed, centerY: line.centerY, height: line.height };
  });
}

const rules: Array<{ family: Exclude<IdentifierCandidate['family'], 'license-plate-like'>; pattern: RegExp; validate: (value: string) => boolean }> = [
  {
    family: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    validate: value => value.length <= 254,
  },
  {
    family: 'url-domain',
    pattern: /\b(?:https?:\/\/|www\.)[^\s<>()]+|\b(?:[A-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|co|uk|ca|de|fr|au|info|biz|app|dev)(?:\/[^\s<>()]*)?/gi,
    validate: value => value.replace(/[.,;:!?]+$/, '').length <= 253,
  },
  {
    family: 'phone-like', pattern: /\+?\d[\d ().-]{5,}\d/g,
    validate: value => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    },
  },
  {
    family: 'coordinate-pair', pattern: /(?<![\d.])-?\d{1,2}(?:\.\d{1,8})?\s*,\s*-?\d{1,3}(?:\.\d{1,8})?(?![\d.])/g,
    validate: value => {
      const [latitude, longitude] = value.split(',').map(Number);
      return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    },
  },
];

function enabledFamilies(value: string | IdentifierCandidate['family'][] | undefined): Set<string> {
  if (Array.isArray(value)) return new Set(value);
  if (typeof value === 'string') return new Set(value.split(',').map(item => item.trim()).filter(Boolean));
  return new Set(['email', 'url-domain', 'phone-like', 'coordinate-pair']);
}

function createCandidate(family: IdentifierCandidate['family'], value: string, evidence: LineWord[], profile?: string): IdentifierCandidate {
  const x0 = Math.min(...evidence.map(item => item.word.boundingBox.x));
  const y0 = Math.min(...evidence.map(item => item.word.boundingBox.y));
  const x1 = Math.max(...evidence.map(item => item.word.boundingBox.x + item.word.boundingBox.width));
  const y1 = Math.max(...evidence.map(item => item.word.boundingBox.y + item.word.boundingBox.height));
  return {
    family,
    value: value.replace(/[.,;:!?]+$/, ''),
    confidence: normalizeConfidence(evidence.reduce((sum, item) => sum + item.word.confidence, 0) / evidence.length),
    sourceWords: evidence.map(item => item.index),
    boundingBox: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 },
    ...(profile ? { profile } : {}),
  };
}

function uniqueCandidates(candidates: IdentifierCandidate[]): IdentifierCandidate[] {
  const seen = new Set<string>();
  return candidates.filter(candidate => {
    const key = `${candidate.family}:${candidate.value.toLowerCase()}:${candidate.sourceWords.join(',')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const normalizeConfidence = (value: number): number => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
