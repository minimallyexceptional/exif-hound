import React from 'react';
import { render, screen } from '@testing-library/react';
import Map from '../index';
import { ImageData } from '../../../types';
import { ImportedPoint } from '../../../utils/importData';

// Mock the components that are used in the Map component
jest.mock('../components/layers/MapLayers', () => ({
  MapLayers: () => <div data-testid="map-layers">Map Layers Component</div>,
}));

jest.mock('../components/controls/MapControls', () => ({
  MapControls: () => <div data-testid="map-controls">Map Controls Component</div>,
}));

jest.mock('../components/layers/ImageCluster', () => ({
  ImageCluster: () => <div data-testid="image-cluster">Image Cluster Component</div>
}));

jest.mock('../components/layers/ImageRoute', () => ({
  ImageRoute: () => <div data-testid="image-route">Image Route Component</div>,
}));

jest.mock('../components/layers/HeatmapLayer', () => ({
  ImageHeatmap: () => <div data-testid="image-heatmap">Heatmap Component</div>,
}));

jest.mock('../components/controls/MapZoomHandler', () => ({
  MapZoomHandler: () => <div data-testid="map-zoom-handler">Map Zoom Handler</div>,
}));

jest.mock('../components/MapErrorBoundary', () => ({
  MapErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="map-error-boundary">{children}</div>,
}));

// Add mock for ReticleLayer component
jest.mock('../components/layers/ReticleLayer', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="reticle-layer">Reticle Layer Component</div>
  };
});

// Mock the react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  useMap: () => ({
    flyTo: jest.fn(),
    getBounds: jest.fn(),
    getCenter: jest.fn(),
    getZoom: jest.fn(),
    fitBounds: jest.fn(),
  }),
}));

// Mock the hooks that are used in the Map component
jest.mock('../hooks/useMapCenter', () => ({
  useMapCenter: () => ({
    center: [0, 0],
    isFullscreen: false,
    setIsFullscreen: jest.fn(),
  }),
}));

jest.mock('../hooks/useMapImages', () => ({
  useMapImages: () => ({
    imagesWithLocation: [],
    sortedImages: [],
  }),
}));

const mockImages: (ImageData | ImportedPoint)[] = [];
const mockOnToggleRoute = jest.fn();
const mockOnSelectImage = jest.fn();
const mockOnOpenImport = jest.fn();

describe('Map Component', () => {
  it('renders the map container', () => {
    render(
      <Map
        images={mockImages}
        selectedImage={null}
        onToggleRoute={mockOnToggleRoute}
        onSelectImage={mockOnSelectImage}
        onOpenImport={mockOnOpenImport}
      />
    );
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
}); 