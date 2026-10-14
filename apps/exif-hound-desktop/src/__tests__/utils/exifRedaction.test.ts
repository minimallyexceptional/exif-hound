import { redactGpsFromExif } from '../../utils/exifRedaction';

describe('redactGpsFromExif', () => {
  it('removes GPS-related fields', () => {
    const redacted = redactGpsFromExif({
      latitude: 1,
      longitude: 2,
      gpsAltitude: 10,
      make: 'Canon',
      location: { loading: false, city: 'London' },
    });
    expect(redacted.make).toBe('Canon');
    expect(redacted.latitude).toBeUndefined();
    expect(redacted.longitude).toBeUndefined();
    expect(redacted.gpsAltitude).toBeUndefined();
    expect(redacted.location).toBeNull();
  });
});
