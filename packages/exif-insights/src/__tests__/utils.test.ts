import {
  countCoreFields,
  composeLocationName,
  formatCoordinates,
  localDateString,
  parseCaptureTimestamp
} from '../utils';
import { InsightImage } from '../types';

function img(overrides: Partial<InsightImage>): InsightImage {
  return { id: 'i1', ...overrides };
}

describe('countCoreFields', () => {
  it('counts zero on an empty record', () => {
    expect(countCoreFields(img({}))).toBe(0);
  });

  it('counts each present core field once', () => {
    expect(countCoreFields(img({ dateTimeOriginal: '2023-01-01T00:00:00Z' }))).toBe(1);
    expect(countCoreFields(img({ make: 'Canon' }))).toBe(1);
    expect(countCoreFields(img({ model: 'R6' }))).toBe(1);
    expect(countCoreFields(img({ latitude: 1, longitude: 2 }))).toBe(1);
    expect(countCoreFields(img({ imageWidth: 100, imageHeight: 50 }))).toBe(1);
    expect(countCoreFields(img({ software: 'GIMP' }))).toBe(1);
  });

  it('counts up to all five fields', () => {
    expect(countCoreFields(img({
      dateTimeOriginal: '2023-01-01T00:00:00Z',
      make: 'Canon',
      latitude: 1,
      longitude: 2,
      imageWidth: 100,
      imageHeight: 50,
      software: 'GIMP'
    }))).toBe(5);
  });

  it('requires both coordinates or both dimensions', () => {
    expect(countCoreFields(img({ latitude: 1 }))).toBe(0);
    expect(countCoreFields(img({ longitude: 2 }))).toBe(0);
    expect(countCoreFields(img({ imageWidth: 100 }))).toBe(0);
  });
});

describe('parseCaptureTimestamp', () => {
  it('returns null for empty and missing values', () => {
    expect(parseCaptureTimestamp(undefined)).toBeNull();
    expect(parseCaptureTimestamp(null)).toBeNull();
    expect(parseCaptureTimestamp('')).toBeNull();
  });

  it('parses ISO 8601 strings', () => {
    expect(parseCaptureTimestamp('2023-01-15T10:30:00Z')).toBe(Date.parse('2023-01-15T10:30:00Z'));
  });

  it('parses EXIF convention timestamps with seconds', () => {
    const expected = new Date(2023, 0, 15, 10, 30, 45).getTime();
    expect(parseCaptureTimestamp('2023:01:15 10:30:45')).toBe(expected);
  });

  it('parses EXIF convention timestamps without seconds', () => {
    const expected = new Date(2023, 0, 15, 10, 30, 0).getTime();
    expect(parseCaptureTimestamp('2023:01:15 10:30')).toBe(expected);
  });

  it('returns null for unparseable strings', () => {
    expect(parseCaptureTimestamp('not a date')).toBeNull();
  });
});

describe('localDateString', () => {
  it('zero-pads month and day', () => {
    expect(localDateString(new Date(2023, 0, 5, 9, 0, 0).getTime())).toBe('2023-01-05');
  });

  it('does not pad two-digit month and day', () => {
    expect(localDateString(new Date(2023, 11, 25, 9, 0, 0).getTime())).toBe('2023-12-25');
  });
});

describe('formatCoordinates', () => {
  it('formats with four decimals', () => {
    expect(formatCoordinates(51.50745678, -0.1278)).toBe('51.5075, -0.1278');
  });
});

describe('composeLocationName', () => {
  it('returns null for missing location', () => {
    expect(composeLocationName(null)).toBeNull();
    expect(composeLocationName(undefined)).toBeNull();
  });

  it('prefers the formatted name', () => {
    expect(composeLocationName({ formatted: 'London, UK', city: 'London' })).toBe('London, UK');
  });

  it('composes a name from parts when formatted is absent', () => {
    expect(composeLocationName({ city: 'Paris', state: 'Île-de-France', country: 'France' }))
      .toBe('Paris, Île-de-France, France');
  });

  it('skips blank parts', () => {
    expect(composeLocationName({ suburb: '  ', town: 'Some Town' })).toBe('Some Town');
  });

  it('returns null when no parts are present', () => {
    expect(composeLocationName({})).toBeNull();
  });
});
