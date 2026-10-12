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
