import { formatFileType } from '../../utils/formatFileType';

describe('formatFileType', () => {
  it('returns uppercase subtype for MIME types', () => {
    expect(formatFileType('image/jpeg')).toBe('JPEG');
  });

  it('returns N/A for empty type (CSV imports)', () => {
    expect(formatFileType('')).toBe('N/A');
  });

  it('returns N/A for malformed MIME', () => {
    expect(formatFileType('not-a-mime')).toBe('N/A');
  });
});
