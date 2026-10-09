import { ExifReaderMetadataReader, LocalImageStructureReader } from './LocalImageReaders';
import type {
  ImageProvenanceResult,
  ImageStructureReader,
  MetadataReader,
  ProvenanceIndicator,
  ProvenanceTimestampFacts,
} from './types';
import type { ForensicImageInput } from './types';

export interface ImageProvenanceAnalyzerOptions {
  metadataReader?: MetadataReader;
  structureReader?: ImageStructureReader;
  toolVersion?: string;
}

export class ImageProvenanceAnalyzer {
  private readonly metadataReader: MetadataReader;
  private readonly structureReader: ImageStructureReader;
  private readonly toolVersion: string;

  constructor(options: ImageProvenanceAnalyzerOptions = {}) {
    this.metadataReader = options.metadataReader ?? new ExifReaderMetadataReader();
    this.structureReader = options.structureReader ?? new LocalImageStructureReader();
    this.toolVersion = options.toolVersion ?? '1.0.0';
  }

  async analyze(input: ForensicImageInput): Promise<ImageProvenanceResult> {
    if (!input.bytes.length) throw new Error('The selected image has no readable bytes.');
    const metadata = { ...(await this.metadataReader.read(input.bytes)), ...(input.metadata ?? {}) };
    const structure = this.structureReader.inspect(input.bytes);
    const timestamps = readTimestamps(metadata);
    const indicators = analyzeIndicators(metadata, timestamps);
    return {
      schemaVersion: 1,
      toolVersion: this.toolVersion,
      imageId: input.imageId,
      imageName: input.imageName,
      facts: {
        ...structure,
        timestamps,
        metadataFieldCount: Object.entries(metadata).filter(([field, value]) => hasValue(value) && !isStructuralTag(field)).length,
      },
      indicators,
    };
  }
}

function readTimestamps(metadata: Record<string, unknown>): ProvenanceTimestampFacts {
  const capture = firstValue(metadata, ['DateTimeOriginal', 'dateTimeOriginal', 'DateTimeCreated', 'CreateDate']);
  const digitized = firstValue(metadata, ['DateTimeDigitized', 'dateTimeDigitized', 'DigitizedDate']);
  const modified = firstValue(metadata, ['ModifyDate', 'DateTime', 'DateTimeModified', 'modifyDate']);
  return {
    ...(capture ? { capture } : {}),
    ...(digitized ? { digitized } : {}),
    ...(modified ? { modified } : {}),
  };
}

function analyzeIndicators(metadata: Record<string, unknown>, timestamps: ProvenanceTimestampFacts): ProvenanceIndicator[] {
  const indicators: ProvenanceIndicator[] = [];
  const softwareEntry = firstEntry(metadata, ['Software', 'software', 'ProcessingSoftware']);
  const software = softwareEntry ? String(softwareEntry.value) : '';
  if (software && /photoshop|lightroom|gimp|affinity photo|darktable|capture one|snapseed|pixlr/i.test(software)) {
    indicators.push({
      code: 'editing-software-tag', severity: 'notice',
      message: 'Metadata names software commonly used to edit images; this tag alone does not establish what was changed.',
      sourceField: softwareEntry?.field, observedValue: software,
    });
  }

  const captureField = firstEntry(metadata, ['DateTimeOriginal', 'dateTimeOriginal', 'DateTimeCreated', 'CreateDate']);
  const digitizedField = firstEntry(metadata, ['DateTimeDigitized', 'dateTimeDigitized', 'DigitizedDate']);
  const modifiedField = firstEntry(metadata, ['ModifyDate', 'DateTime', 'DateTimeModified', 'modifyDate']);
  const capture = parseTimestamp(timestamps.capture);
  const digitized = parseTimestamp(timestamps.digitized);
  const modified = parseTimestamp(timestamps.modified);

  for (const [value, entry] of [
    [timestamps.capture, captureField], [timestamps.digitized, digitizedField], [timestamps.modified, modifiedField],
  ] as const) {
    if (!value || !entry) continue;
    if (!hasExplicitTimezone(value)) {
      indicators.push({
        code: 'timestamp-timezone-unspecified', severity: 'info',
        message: 'This timestamp has no timezone; its local time is preserved without inferring an offset.',
        sourceField: entry.field, observedValue: value,
      });
    } else if (parseTimestamp(value) === null) {
      indicators.push({
        code: 'timestamp-unreadable', severity: 'notice',
        message: 'The timestamp field is present but could not be interpreted.',
        sourceField: entry.field, observedValue: value,
      });
    }
  }

  if (capture !== null && modified !== null && modified > capture + 1000) {
    indicators.push({
      code: 'modified-after-capture', severity: 'info',
      message: 'The recorded modification time is later than the recorded capture time.',
      sourceFields: [captureField?.field ?? 'capture', modifiedField?.field ?? 'modified'],
    });
  }
  if (capture !== null && digitized !== null && Math.abs(digitized - capture) > 24 * 60 * 60 * 1000) {
    indicators.push({
      code: 'capture-digitized-time-difference', severity: 'notice',
      message: 'The recorded capture and digitized times differ by more than one day.',
      sourceFields: [captureField?.field ?? 'capture', digitizedField?.field ?? 'digitized'],
    });
  }
  if (Object.values(metadata).filter(hasValue).length === 0) {
    indicators.push({
      code: 'metadata-unavailable', severity: 'info',
      message: 'No readable metadata fields were present; the file structure can still be reviewed independently.',
    });
  }
  return indicators;
}

function firstValue(metadata: Record<string, unknown>, aliases: string[]): string | undefined {
  const entry = firstEntry(metadata, aliases);
  return entry && hasValue(entry.value) ? String(entry.value).trim() : undefined;
}

function firstEntry(metadata: Record<string, unknown>, aliases: string[]): { field: string; value: unknown } | undefined {
  for (const alias of aliases) {
    const found = Object.entries(metadata).find(([field]) => field.toLowerCase() === alias.toLowerCase());
    if (found && hasValue(found[1])) return { field: found[0], value: found[1] };
  }
  return undefined;
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function parseTimestamp(value: string | undefined): number | null {
  if (!value) return null;
  const explicitZone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
  const normalized = value.trim().replace(/^(\d{4}):(\d{2}):(\d{2})\s/, '$1-$2-$3T');
  if (explicitZone) {
    const timestamp = Date.parse(normalized);
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  const parts = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return null;
  const [, year, month, day, hour, minute, second] = parts.map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

function hasExplicitTimezone(value: string): boolean {
  return /(?:z|[+-]\d{2}:?\d{2})$/i.test(value.trim());
}

function isStructuralTag(field: string): boolean {
  return /^(filetype|filetypeextension|mimetype|filename|filesize|imagewidth|imageheight|colorcomponents|encodingprocess|bitspersample)$/i.test(field);
}
