import ExifReader from 'exifreader';
import { extractExifData } from '../../../../../packages/exif-middleware/src';

jest.mock('exifreader', () => ({
  __esModule: true,
  default: { load: jest.fn() },
}));

const load = ExifReader.load as jest.Mock;

describe('EXIF GPS coordinate extraction', () => {
  beforeEach(() => load.mockReset());

  it('prefers the expanded gps group over hemisphere guessing', async () => {
    // Some cameras encode hemisphere references in ways the hand-rolled
    // matcher cannot read; the old code then guessed signs and mirrored
    // eastern-hemisphere coordinates. The expanded load resolves them.
    load
      .mockImplementationOnce(() => ({
        GPSLatitude: { value: [[40, 1], [50, 1], [4514, 100]], description: '40 deg 50\' 45.14"' },
        GPSLatitudeRef: { value: 1, description: '1' },
        GPSLongitude: { value: [[176, 1], [14, 1], [3844, 100]], description: '176 deg 14\' 38.44"' },
        GPSLongitudeRef: { value: 1, description: '1' },
      }))
      .mockImplementationOnce(() => ({
        gps: { Latitude: -40.84587222222226, Longitude: 176.2440111111111, Altitude: 10.05 },
      }));

    const metadata = await extractExifData(new ArrayBuffer(0));

    expect(metadata.latitude).toBeCloseTo(-40.845872, 5);
    expect(metadata.longitude).toBeCloseTo(176.244011, 5);
  });

  it('falls back to parsed values without guessing signs when the expanded load fails', async () => {
    load
      .mockImplementationOnce(() => ({
        GPSLatitude: { value: [[40, 1], [50, 1], [4514, 100]], description: '40 deg 50\' 45.14"' },
        GPSLatitudeRef: { value: ['S'], description: 'South latitude' },
        GPSLongitude: { value: [[176, 1], [14, 1], [3844, 100]], description: '176 deg 14\' 38.44"' },
        GPSLongitudeRef: { value: ['E'], description: 'East longitude' },
      }))
      .mockImplementationOnce(() => {
        throw new Error('expanded load failed');
      });

    const metadata = await extractExifData(new ArrayBuffer(0));

    expect(metadata.latitude).toBeCloseTo(-40.845872, 5);
    expect(metadata.longitude).toBeCloseTo(176.244011, 5);
  });

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
