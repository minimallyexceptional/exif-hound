import ExifReader from 'exifreader';
import { extractExifData } from '../../../../../packages/exif-middleware/src';

jest.mock('exifreader', () => ({
  __esModule: true,
  default: { load: jest.fn() },
}));

const load = ExifReader.load as jest.Mock;

describe('EXIF GPS coordinate extraction', () => {
  beforeEach(() => load.mockReset());

  it('keeps latitude and longitude in their EXIF-defined order', async () => {
    load.mockReturnValue({
      GPSLatitude: {
        value: [[37, 1], [46, 1], [2964, 100]],
        description: '37 deg 46\' 29.64"',
      },
      GPSLatitudeRef: { value: ['N'], description: 'North latitude' },
      GPSLongitude: {
        value: [[122, 1], [25, 1], [1014, 100]],
        description: '122 deg 25\' 10.14"',
      },
      GPSLongitudeRef: { value: ['W'], description: 'West longitude' },
    });

    const metadata = await extractExifData(new ArrayBuffer(0));

    expect(metadata.latitude).toBeCloseTo(37.7749, 5);
    expect(metadata.longitude).toBeCloseTo(-122.419483, 5);
  });
});
