/**
 * Fixture registry: canonical names, paths, and the expected values the app
 * renders from each fixture's embedded EXIF. Keep in sync with
 * scripts/generate-e2e-fixtures.mjs (which self-verifies these constants).
 */

export interface ExifFixture {
  /** File name as the app sees it after upload. */
  name: string;
  /** Path relative to cypress/fixtures/. */
  path: string;
  mime: string;
  /** True when the fixture carries a GPS IFD. */
  hasGps: boolean;
}

export const FIXTURE_IMAGES = {
  /** Full EXIF: TestCam Hound-1, 2024:06:15 10:30:00, GPS 51.5, -0.127778 */
  fullExif: {
    name: 'full-exif.jpg',
    path: 'images/full-exif.jpg',
    mime: 'image/jpeg',
    hasGps: true,
  },
  /** Camera metadata only, no GPS: TestCam Hound-2 */
  noGps: {
    name: 'no-gps.jpg',
    path: 'images/no-gps.jpg',
    mime: 'image/jpeg',
    hasGps: false,
  },
  /** Deterministic garbage bytes with a .jpg name. */
  corrupt: {
    name: 'corrupt.jpg',
    path: 'images/corrupt.jpg',
    mime: 'image/jpeg',
    hasGps: false,
  },
} satisfies Record<string, ExifFixture>;

export const FIXTURE_IMPORT = {
  kml: { path: 'import/points.kml', mime: 'application/vnd.google-earth.kml+xml' },
  invalid: { path: 'import/invalid.txt', mime: 'text/plain' },
};

/** Values the app displays for the full-exif fixture (see fixtures README). */
export const FULL_EXIF_EXPECTED = {
  make: 'TestCam',
  model: 'Hound-1',
  // Intl.DateTimeFormat('en-US', { weekday, year, month, day, hour, minute, hour12 })
  // applied to a local-time parse of 2024:06:15 10:30:00.
  dateParts: { month: 'Jun', day: '15', year: '2024', time: '10:30' },
  exposureTime: '1/250',
  fNumber: '8',
  iso: '200',
  focalLength: '35mm',
  coordinates: '51.500000, -0.127778',
  reverseGeocoded: 'Charing Cross Rd 1, Westminster, London, England, WC2H 0NN, United Kingdom',
  shortLocation: 'London, England, United Kingdom',
};