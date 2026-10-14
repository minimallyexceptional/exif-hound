import ExifReader, { type ExpandedTags, type Tags } from 'exifreader';

export type ExifReaderTags = Tags | ExpandedTags;

/** Injectable EXIF tag source so parsers can swap off ExifReader in tests or future engines. */
export interface ExifTagLoader {
  loadFlat(buffer: ArrayBuffer): Tags;
  loadExpanded(buffer: ArrayBuffer): ExpandedTags;
}

export class ExifReaderTagLoader implements ExifTagLoader {
  loadFlat(buffer: ArrayBuffer): Tags {
    return ExifReader.load(buffer);
  }

  loadExpanded(buffer: ArrayBuffer): ExpandedTags {
    return ExifReader.load(buffer, { expanded: true });
  }
}

export const defaultExifTagLoader = new ExifReaderTagLoader();
