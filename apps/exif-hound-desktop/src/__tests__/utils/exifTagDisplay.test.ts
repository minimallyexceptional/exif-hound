import type { ExpandedTags } from 'exifreader';
import {
  formatExifTagForCopy,
  formatExifTagForDisplay,
  resolveColorSpaceLabel,
} from '../../utils/exifTagDisplay';

describe('exifTagDisplay', () => {
  it('uses raw value for copy when description includes units', () => {
    const tag = { value: 640, description: '640px' };
    expect(formatExifTagForDisplay(tag)).toBe('640px');
    expect(formatExifTagForCopy(tag)).toBe('640');
  });

  it('formats nested rational arrays for clipboard copy', () => {
    const lensTag = {
      value: [[180, 1], [10, 1], [28, 10], [10, 1]],
      description: '180/1, 10/1, 28/10, 10/1',
    };
    expect(formatExifTagForCopy(lensTag)).toBe('180/1, 10/1, 28/10, 10/1');

    const gpsTag = {
      value: [[37, 1], [46, 1], [1234, 100]],
      description: '37 deg 46\' 12.34"',
    };
    expect(formatExifTagForCopy(gpsTag)).toBe('37/1, 46/1, 1234/100');
  });

  it('prefers ICC profile description when ColorSpace is uncalibrated', () => {
    const rawExif = {
      exif: {
        ColorSpace: { value: 65535, description: 'Uncalibrated' },
      },
      icc: {
        'Profile Description': { value: 'Adobe RGB (1998)', description: 'Adobe RGB (1998)' },
      },
    } as unknown as ExpandedTags;

    expect(resolveColorSpaceLabel(rawExif)).toBe('Adobe RGB (1998)');
  });
});
