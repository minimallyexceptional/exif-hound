import React from 'react';
import { render } from '@testing-library/react';
import L from 'leaflet';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { MapLayers } from '../../components/Map/components/layers/MapLayers';
import { ImportedData } from '../../utils/importData';

// The <GeoJSON> mock records every remount so the test can assert that a new
// KML import actually replaces the layer's features.
const mockEvents = {
  geoJSONMounts: 0,
  geoJSONVisible: false,
  lastGeoJSONData: undefined as FeatureCollection<Geometry, GeoJsonProperties> | undefined,
  fitBoundsCalls: [] as unknown[][],
};

const mockMap = {
  fitBounds: (...args: unknown[]) => {
    mockEvents.fitBoundsCalls.push(args);
  },
} as unknown as L.Map;

jest.mock('react-leaflet', () => {
  const React = jest.requireActual('react');
  class GeoJSON extends React.Component {
    componentDidMount() {
      mockEvents.geoJSONMounts += 1;
      mockEvents.geoJSONVisible = true;
      mockEvents.lastGeoJSONData = this.props.data;
    }
    componentWillUnmount() {
      mockEvents.geoJSONVisible = false;
    }
    render() {
      return null;
    }
  }
  return {
    useMap: () => mockMap,
    TileLayer: () => null,
    Circle: () => null,
    GeoJSON,
  };
});

jest.mock('leaflet', () => {
  class GeoJSON {
    fc: unknown;
    constructor(fc: unknown) {
      this.fc = fc;
    }
    toGeoJSON() {
      return this.fc;
    }
    getBounds() {
      return { isValid: () => true };
    }
  }
  return { __esModule: true, default: { GeoJSON } };
});

jest.mock('../../context/SettingsContext', () => ({
  useSettings: () => ({ mapSettings: undefined }),
}));

const makeFC = (name: string): FeatureCollection<Geometry, GeoJsonProperties> => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name },
      geometry: { type: 'Point', coordinates: [-122.33, 47.6] },
    },
  ],
});

const makeKmlImport = (name: string): { fc: FeatureCollection<Geometry, GeoJsonProperties>; imported: ImportedData } => {
  const fc = makeFC(name);
  const layer = new L.GeoJSON(fc) as unknown as L.GeoJSON;
  return { fc, imported: { type: 'kml', data: `<kml>${name}</kml>`, layer } };
};

describe('MapLayers KML layer', () => {
  beforeEach(() => {
    mockEvents.geoJSONMounts = 0;
    mockEvents.geoJSONVisible = false;
    mockEvents.lastGeoJSONData = undefined;
    mockEvents.fitBoundsCalls = [];
  });

  it('remounts the GeoJSON layer when a new KML import replaces the data', () => {
    // react-leaflet's <GeoJSON> ignores the `data` prop on updates, so the
    // regression would show as the layer still rendering the FIRST import's
    // features after the second import.
    const a = makeKmlImport('file-a');
    const b = makeKmlImport('file-b');

    const { rerender } = render(<MapLayers kmlData={a.imported} />);

    // First import renders the layer once with file-a's features
    expect(mockEvents.geoJSONMounts).toBe(1);
    expect(mockEvents.lastGeoJSONData).toBe(a.fc);
    expect(mockEvents.fitBoundsCalls.length).toBe(1);

    // Second import must remount the layer to render file-b's features
    rerender(<MapLayers kmlData={b.imported} />);

    expect(mockEvents.geoJSONMounts).toBe(2);
    expect(mockEvents.lastGeoJSONData).toBe(b.fc);
    expect(mockEvents.fitBoundsCalls.length).toBe(2);

    // Re-rendering with the same import must not remount again
    rerender(<MapLayers kmlData={b.imported} />);
    expect(mockEvents.geoJSONMounts).toBe(2);
  });

  it('removes the GeoJSON layer when kmlData is cleared after a CSV import', () => {
    const a = makeKmlImport('file-a');
    const { rerender } = render(<MapLayers kmlData={a.imported} />);

    expect(mockEvents.geoJSONVisible).toBe(true);

    // Map passes undefined once importedData.type is no longer 'kml'
    rerender(<MapLayers />);

    expect(mockEvents.geoJSONVisible).toBe(false);
  });

  it('clears the GeoJSON layer when the new import is not a FeatureCollection', () => {
    const a = makeKmlImport('file-a');
    const { rerender } = render(<MapLayers kmlData={a.imported} />);
    expect(mockEvents.geoJSONVisible).toBe(true);

    const layer = new L.GeoJSON(makeFC('bad')) as unknown as L.GeoJSON;
    layer.toGeoJSON = () =>
      ({ type: 'Point', coordinates: [0, 0] }) as unknown as ReturnType<L.GeoJSON['toGeoJSON']>;

    rerender(<MapLayers kmlData={{ type: 'kml', data: '<kml/>', layer }} />);
    expect(mockEvents.geoJSONVisible).toBe(false);
  });
});
