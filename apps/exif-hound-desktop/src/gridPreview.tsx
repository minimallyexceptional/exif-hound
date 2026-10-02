import React from 'react';
import { createRoot } from 'react-dom/client';
import ImageList from './components/ImageList';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// TEMPORARY visual QA harness for ImageList — not part of the app.

const svgThumb = (c: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='${c}'/><circle cx='20' cy='20' r='10' fill='rgba(255,255,255,0.25)'/></svg>`
  )}`;

const images = ['#5a4a3a', '#7a6a5a', '#4a5a3a', '#6a5a2a'].map((c, i) => ({
  id: `img-${i}`,
  url: svgThumb(c),
  file: { name: `DSCN000${i}.jpg`, type: 'image/jpeg', size: 153900 + i * 1000, lastModified: Date.parse('2026-09-21T14:41:00') },
  exif: {
    make: 'NIKON',
    model: 'COOLPIX P6000',
    software: 'Capture ONE',
    lensModel: 'Nikkor 6.0-24.0mm',
    dateTimeOriginal: `2008-10-22T1${i}:52:00`,
    latitude: 43.467255 + i / 10000,
    longitude: 11.879213 - i / 10000,
    gpsAltitude: 324,
    imageWidth: 4000,
    imageHeight: 3000,
    fNumber: 2.8,
    exposureTime: '1/64',
    iso: 103,
    focalLength: 24,
    artist: 'Jane Photographer',
    description: 'Street scene at dusk with warm lighting',
    copyright: '© 2008 Jane Photographer',
  },
}));

// A sparse image with no EXIF at all
images.push({
  id: 'img-9',
  url: svgThumb('#333333'),
  file: { name: 'IMG_0009.png', type: 'image/png', size: 99000, lastModified: Date.now() },
  exif: {},
} as never);

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <div style={{ height: '100vh', padding: 16 }}>
      <ImageList images={images} selectedImage={null} onSelect={() => {}} />
    </div>
  </ThemeProvider>
);

// Auto-enable the GPS Data + Camera Settings groups (labels 5 and 6)
setTimeout(() => {
  const labels = document.querySelectorAll('label');
  labels[4]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  labels[5]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}, 200);