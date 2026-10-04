import { fileURLToPath } from 'node:url';

export interface ExifFixture {
  name: string;
  path: string;
  mime: string;
  hasGps: boolean;
  absolutePath: string;
}

const fixture = (name: string, path: string, mime: string, hasGps: boolean): ExifFixture => ({
  name,
  path,
  mime,
  hasGps,
  absolutePath: fileURLToPath(new URL(`../fixtures/${path}`, import.meta.url)),
});

export const FIXTURE_IMAGES = {
  fullExif: fixture('full-exif.jpg', 'images/full-exif.jpg', 'image/jpeg', true),
  noGps: fixture('no-gps.jpg', 'images/no-gps.jpg', 'image/jpeg', false),
  corrupt: fixture('corrupt.jpg', 'images/corrupt.jpg', 'image/jpeg', false),
} satisfies Record<string, ExifFixture>;

export const FIXTURE_IMPORT = {
  kml: { path: fileURLToPath(new URL('../fixtures/import/points.kml', import.meta.url)), mime: 'application/vnd.google-earth.kml+xml' },
  points: { path: fileURLToPath(new URL('../fixtures/import/points.kml', import.meta.url)), mime: 'application/vnd.google-earth.kml+xml' },
  invalid: { path: fileURLToPath(new URL('../fixtures/import/invalid.txt', import.meta.url)), mime: 'text/plain' },
};

export const FULL_EXIF_EXPECTED = {
  make: 'TestCam',
  model: 'Hound-1',
  dateParts: { month: 'Jun', day: '15', year: '2024', time: '10:30' },
  exposureTime: '1/250',
  fNumber: '8',
  iso: '200',
  focalLength: '35mm',
  coordinates: '51.500000, -0.127778',
  reverseGeocoded: 'Charing Cross Rd 1, Westminster, London, England, WC2H 0NN, United Kingdom',
  shortLocation: 'London, England, United Kingdom',
};
