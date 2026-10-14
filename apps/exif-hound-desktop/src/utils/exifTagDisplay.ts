import type { ExpandedTags } from 'exif-hound-core';

type ExifTagValue = {
  value?: unknown;
  description?: unknown;
};

const COLOR_SPACE_LABELS: Record<number, string> = {
  1: 'sRGB',
  2: 'Adobe RGB',
  65535: 'Uncalibrated',
};

/**
 * Resolve a tag from ExifReader's expanded structure (first matching section).
 */
export function getExpandedExifTag(
  rawExif: ExpandedTags,
  tagNames: string[],
  sections: string[] = ['exif', 'file', 'jfif', 'gps', 'icc', 'Thumbnail']
): ExifTagValue | undefined {
  for (const section of sections) {
    const group = rawExif[section as keyof ExpandedTags] as Record<string, ExifTagValue> | undefined;
    if (!group) continue;
    for (const tagName of tagNames) {
      if (tagName in group) {
        return group[tagName];
      }
    }
  }
  return undefined;
}

export function formatExifTagForDisplay(tag: ExifTagValue | undefined): string {
  if (!tag) {
    return 'N/A';
  }
  if (tag.description !== undefined && tag.description !== null && String(tag.description) !== '') {
    return String(tag.description);
  }
  if (tag.value !== undefined && tag.value !== null) {
    if (typeof tag.value === 'object') {
      return JSON.stringify(tag.value);
    }
    return String(tag.value);
  }
  return 'N/A';
}

function formatRationalPair(pair: unknown): string | null {
  if (
    Array.isArray(pair) &&
    pair.length === 2 &&
    typeof pair[0] === 'number' &&
    typeof pair[1] === 'number'
  ) {
    return `${pair[0]}/${pair[1]}`;
  }
  return null;
}

function formatArrayItemForCopy(item: unknown): string {
  return formatRationalPair(item) ?? String(item);
}

/** Raw value for clipboard copy (no units / formatted suffixes). */
export function formatExifTagForCopy(tag: ExifTagValue | undefined): string {
  if (!tag) {
    return 'N/A';
  }
  if (tag.value !== undefined && tag.value !== null) {
    if (Array.isArray(tag.value)) {
      if (
        tag.value.length === 2 &&
        typeof tag.value[0] === 'number' &&
        typeof tag.value[1] === 'number'
      ) {
        return `${tag.value[0]}/${tag.value[1]}`;
      }
      return tag.value
        .map((item) => formatArrayItemForCopy(item))
        .join(', ');
    }
    if (typeof tag.value === 'object') {
      return JSON.stringify(tag.value);
    }
    return String(tag.value);
  }
  if (tag.description !== undefined && tag.description !== null) {
    return String(tag.description);
  }
  return 'N/A';
}

/**
 * Color space label: prefer ICC profile description when EXIF says uncalibrated.
 */
export function resolveColorSpaceLabel(rawExif: ExpandedTags): string {
  const colorSpaceTag = getExpandedExifTag(rawExif, ['ColorSpace', 'Color Space'], ['exif']);
  const numericValue =
    typeof colorSpaceTag?.value === 'number'
      ? colorSpaceTag.value
      : Number(colorSpaceTag?.description);

  const iccGroup = rawExif.icc as Record<string, ExifTagValue> | undefined;
  const iccDescription =
    iccGroup?.['Profile Description'] ??
    iccGroup?.ProfileDescription ??
    iccGroup?.['Profile Description (ICC)'];

  if (iccDescription) {
    const iccLabel = formatExifTagForDisplay(iccDescription);
    if (iccLabel !== 'N/A') {
      if (numericValue === 65535 || colorSpaceTag?.description === 'Uncalibrated') {
        return iccLabel;
      }
      if (!Number.isFinite(numericValue)) {
        return iccLabel;
      }
    }
  }

  if (Number.isFinite(numericValue) && COLOR_SPACE_LABELS[numericValue]) {
    return COLOR_SPACE_LABELS[numericValue];
  }

  return formatExifTagForDisplay(colorSpaceTag);
}
