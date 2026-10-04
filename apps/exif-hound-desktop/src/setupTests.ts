// Add Jest-DOM custom matchers
import '@testing-library/jest-dom';

// Shim for the Vite `define`d __DEV__ constant (see vite.config.ts).
// Kept false in tests to mirror production behavior and silence dev logging.
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
(globalThis as { __UPDATE_CHANNEL__?: string }).__UPDATE_CHANNEL__ = 'stable';

// jsdom does not implement blob URL methods
if (typeof URL.createObjectURL !== 'function') {
(URL as typeof URL & { createObjectURL: typeof URL.createObjectURL }).createObjectURL = jest.fn(() => 'mock-object-url');
}
if (typeof URL.revokeObjectURL !== 'function') {
(URL as typeof URL & { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = jest.fn();
}

// Mock the Leaflet library
jest.mock('leaflet', () => {
  return {
    map: jest.fn().mockReturnValue({
      setView: jest.fn(),
      remove: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      getZoom: jest.fn().mockReturnValue(10),
      getBounds: jest.fn().mockReturnValue({
        extend: jest.fn(),
        isValid: jest.fn().mockReturnValue(true),
      }),
      fitBounds: jest.fn(),
      invalidateSize: jest.fn(),
    }),
    tileLayer: jest.fn().mockReturnValue({
      addTo: jest.fn(),
    }),
    marker: jest.fn().mockReturnValue({
      addTo: jest.fn(),
      bindPopup: jest.fn().mockReturnValue({
        openPopup: jest.fn(),
      }),
    }),
    icon: jest.fn(),
    latLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    layerGroup: jest.fn().mockReturnValue({
      addTo: jest.fn(),
      addLayer: jest.fn(),
      clearLayers: jest.fn(),
    }),
    polyline: jest.fn().mockReturnValue({
      addTo: jest.fn(),
    }),
    latLngBounds: jest.fn().mockReturnValue({
      extend: jest.fn(),
      isValid: jest.fn().mockReturnValue(true),
    }),
    DomUtil: {
      create: jest.fn(),
    },
    DomEvent: {
      on: jest.fn(),
      off: jest.fn(),
      stopPropagation: jest.fn(),
      disableClickPropagation: jest.fn(),
      disableScrollPropagation: jest.fn(),
    },
    Control: {
      extend: jest.fn().mockReturnValue(
        jest.fn().mockImplementation(() => ({
          onAdd: jest.fn(),
          onRemove: jest.fn(),
        }))
      ),
    },
  };
});
