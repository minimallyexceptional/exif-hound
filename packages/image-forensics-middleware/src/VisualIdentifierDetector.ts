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
    const lines = groupLines(words);
    const enabled = enabledFamilies(input.settings.enabledFamilies);
    const candidates: IdentifierCandidate[] = [];
    for (const line of lines) {
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
    const profile = resolveLicensePlateProfile(input.settings);
    if (profile === 'us-general') {
      for (const line of lines) candidates.push(...licensePlateCandidates(line, profile));
      candidates.push(...licensePlateCandidatesFromText(recognized.text, words, profile));
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

function resolveLicensePlateProfile(settings: VisualIdentifierInput['settings']): string | null {
  if (settings.licensePlateProfile === 'off') return null;
  if (settings.licensePlateProfile === 'us-general') return 'us-general';
  return enabledFamilies(settings.enabledFamilies).has('license-plate-like') ? 'us-general' : null;
}

const usStateNames = [
  'WESTVIRGINIA', 'NORTHCAROLINA', 'SOUTHCAROLINA', 'MASSACHUSETTS', 'NEWHAMPSHIRE',
  'NORTHDAKOTA', 'SOUTHDAKOTA', 'RHODEISLAND', 'PENNSYLVANIA', 'CONNECTICUT',
  'MISSISSIPPI', 'WASHINGTON', 'WISCONSIN', 'CALIFORNIA', 'NEWJERSEY',
  'NEWMEXICO', 'MINNESOTA', 'LOUISIANA', 'OKLAHOMA', 'COLORADO', 'MARYLAND',
  'MISSOURI', 'MONTANA', 'NEBRASKA', 'GEORGIA', 'ALABAMA', 'ARIZONA',
  'ARKANSAS', 'FLORIDA', 'INDIANA', 'NEWYORK', 'OREGON', 'NEVADA',
  'KANSAS', 'TEXAS', 'IDAHO', 'IOWA', 'OHIO', 'UTAH',
].sort((left, right) => right.length - left.length);

function compactPlate(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function isUsGeneralPlate(value: string): boolean {
  return /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{5,8}$/.test(value);
}

function consumeLeadingStates(compact: string, start = 0): number {
  let index = start;
  let changed = true;
  while (changed) {
    changed = false;
    for (const state of usStateNames) {
      if (compact.startsWith(state, index)) {
        index += state.length;
        changed = true;
        break;
      }
    }
  }
  return index;
}

function plateValue(value: string): string | null {
  const compact = compactPlate(value);
  const body = compact.slice(consumeLeadingStates(compact));
  return isUsGeneralPlate(body) ? body : null;
}

function plateScore(plates: string[]): number {
  return plates.length * 10 + plates.filter(plate => plate.length === 6 || plate.length === 7).length;
}

function extractPlatesFromCompact(raw: string): string[] {
  const compact = compactPlate(raw);
  const covered = fullyCoveredPlates(compact.slice(consumeLeadingStates(compact)));
  if (covered?.length) return covered;
  return leftmostPlates(compact);
}

function fullyCoveredPlates(body: string): string[] | null {
  const search = (rest: string): string[] | null => {
    rest = rest.slice(consumeLeadingStates(rest));
    if (!rest) return [];
    let best: string[] | null = null;
    for (let len = 5; len <= 8; len += 1) {
      const slice = rest.slice(0, len);
      if (slice.length !== len || !isUsGeneralPlate(slice)) continue;
      const tail = search(rest.slice(len));
      if (!tail) continue;
      const candidate = [slice, ...tail];
      if (!best || plateScore(candidate) > plateScore(best)) best = candidate;
    }
    return best;
  };
  return search(body);
}

function leftmostPlates(compact: string): string[] {
  const body = compact.slice(consumeLeadingStates(compact));
  if (!body) return [];
  if (isUsGeneralPlate(body)) return [body];
  for (const len of [7, 6, 8, 5]) {
    const slice = body.slice(0, len);
    if (slice.length === len && isUsGeneralPlate(slice)) return [slice, ...leftmostPlates(body.slice(len))];
  }
  return body.length <= 1 ? [] : leftmostPlates(body.slice(1));
}

function extractPlatesFromLine(line: string): string[] {
  const tokens = line.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const found: string[] = [];
  for (let start = 0; start < tokens.length; start += 1) {
    let compact = '';
    for (let index = start; index < tokens.length; index += 1) {
      compact += compactPlate(tokens[index]);
      if (compact.length > 16) break;
      const value = plateValue(compact);
      if (value) found.push(value);
    }
  }
  found.push(...extractPlatesFromCompact(line));
  return [...new Set(found)];
}

function evidenceSpansForPlate(value: string, words: OcrWord[]): LineWord[][] {
  const indexed = words.map((word, index) => ({ word, index, start: 0, end: word.text.length }));
  const spans: LineWord[][] = [];
  for (let start = 0; start < indexed.length; start += 1) {
    let compact = '';
    const span: LineWord[] = [];
    for (let end = start; end < indexed.length; end += 1) {
      compact += compactPlate(indexed[end].word.text);
      span.push(indexed[end]);
      if (compact.length > 16) break;
      if (plateValue(compact) === value) {
        spans.push([...span]);
        break;
      }
    }
  }
  if (spans.length) return spans;
  return indexed
    .filter(entry => extractPlatesFromCompact(entry.word.text).includes(value))
    .map(entry => [entry]);
}

function licensePlateCandidates(line: WordLine, profile: string): IdentifierCandidate[] {
  const found: IdentifierCandidate[] = [];
  for (let start = 0; start < line.words.length; start += 1) {
    const evidence: LineWord[] = [];
    let compact = '';
    for (let index = start; index < line.words.length; index += 1) {
      compact += compactPlate(line.words[index].word.text);
      evidence.push(line.words[index]);
      if (compact.length > 16) break;
      const value = plateValue(compact);
      if (value) found.push(createCandidate('license-plate-like', value, evidence, profile));
    }
  }
  for (const entry of line.words) {
    const plates = extractPlatesFromCompact(entry.word.text);
    if (plates.length <= 1 && plateValue(entry.word.text) === plates[0]) continue;
    for (const plate of plates) found.push(createCandidate('license-plate-like', plate, [entry], profile));
  }
  return found;
}

function licensePlateCandidatesFromText(text: string, words: OcrWord[], profile: string): IdentifierCandidate[] {
  const values = [...new Set(text.split(/\r?\n/).flatMap(extractPlatesFromLine))];
  return values.flatMap((value) => {
    const spans = evidenceSpansForPlate(value, words);
    if (!spans.length) return [createCandidate('license-plate-like', value, [], profile)];
    return spans.map(evidence => createCandidate('license-plate-like', value, evidence, profile));
  });
}

function enabledFamilies(value: string | IdentifierCandidate['family'][] | undefined): Set<string> {
  if (Array.isArray(value)) return new Set(value);
  if (typeof value === 'string') return new Set(value.split(',').map(item => item.trim()).filter(Boolean));
  return new Set(['email', 'url-domain', 'phone-like', 'coordinate-pair']);
}

function createCandidate(family: IdentifierCandidate['family'], value: string, evidence: LineWord[], profile?: string): IdentifierCandidate {
  if (!evidence.length) {
    return {
      family, value, confidence: 0, sourceWords: [],
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      ...(profile ? { profile } : {}),
    };
  }
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
  const best = new Map<string, IdentifierCandidate>();
  for (const candidate of candidates) {
    const key = candidate.family === 'license-plate-like'
      ? `${candidate.family}:${candidate.value.toLowerCase()}:${plateLocationKey(candidate)}`
      : `${candidate.family}:${candidate.value.toLowerCase()}:${candidate.sourceWords.join(',')}`;
    const current = best.get(key);
    if (!current || betterPlateCandidate(candidate, current)) best.set(key, candidate);
  }
  const all = Array.from(best.values());
  const located = new Set(
    all.filter(candidate => candidate.family === 'license-plate-like' && boxArea(candidate) > 0)
      .map(candidate => candidate.value.toLowerCase()),
  );
  return all.filter(candidate => (
    candidate.family !== 'license-plate-like'
    || boxArea(candidate) > 0
    || !located.has(candidate.value.toLowerCase())
  ));
}

function plateLocationKey(candidate: IdentifierCandidate): string {
  if (candidate.sourceWords.length) return `w:${candidate.sourceWords.join(',')}`;
  if (boxArea(candidate) <= 0) return 'empty';
  const box = candidate.boundingBox;
  return `b:${box.x.toFixed(2)}:${box.y.toFixed(2)}`;
}

function betterPlateCandidate(candidate: IdentifierCandidate, current: IdentifierCandidate): boolean {
  const area = boxArea(candidate);
  const currentArea = boxArea(current);
  if (area > 0 && currentArea <= 0) return true;
  if (area > 0 && currentArea > 0) return area < currentArea;
  return false;
}

function boxArea(candidate: IdentifierCandidate): number {
  const area = candidate.boundingBox.width * candidate.boundingBox.height;
  return Number.isFinite(area) ? area : -1;
}

const normalizeConfidence = (value: number): number => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
