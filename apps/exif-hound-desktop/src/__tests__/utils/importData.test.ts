// Use the real Leaflet: these tests assert actual GeoJSON layer behavior
// (toGeoJSON round-trip, eachLayer), which the global jsdom mock can't provide.
jest.unmock('leaflet');

import { parseImportData, looksLikeKml, ImportedData } from '../../utils/importData';
import L from 'leaflet';
import type { FeatureCollection, Geometry } from 'geojson';

const KML_NS = 'http://www.opengis.net/kml/2.2';

function asFeatureCollection(fc: ReturnType<L.GeoJSON['toGeoJSON']>): FeatureCollection<Geometry> {
  if (!('features' in fc)) {
    throw new Error('Expected a FeatureCollection from toGeoJSON()');
  }
  return fc;
}

const unprefixedKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}"><Document><Placemark>
<name>Point A</name>
<Point><coordinates>-122.0822035425683,37.42228990140251,17</coordinates></Point>
</Placemark></Document></kml>`;

const prefixedKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml:kml xmlns:kml="${KML_NS}"><kml:Document><kml:Placemark>
<kml:name>Point A</kml:name>
<kml:Point><kml:coordinates>-122.08,37.42</kml:coordinates></kml:Point>
</kml:Placemark></kml:Document></kml:kml>`;

const GOOGLE_KML_NS = 'http://earth.google.com/kml/2.2';
const prefixedGoogleEarthKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml:kml xmlns:kml="${GOOGLE_KML_NS}"><kml:Document><kml:Placemark>
<kml:name>Point A</kml:name>
<kml:Point><kml:coordinates>-122.08,37.42</kml:coordinates></kml:Point>
</kml:Placemark></kml:Document></kml:kml>`;

const mixedGeometryKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}"><Document>
<Placemark><name>Route</name><LineString><coordinates>
-1.0,52.0 -1.01,52.01 -1.02,52.02</coordinates></LineString></Placemark>
<Placemark><name>P1</name><Point><coordinates>-1.0,52.0</coordinates></Point></Placemark>
</Document></kml>`;

const malformedKml = `<kml xmlns="${KML_NS}"><Placemark><Point><coordinates>-122.0,37.4`;

const nonKmlXml = `<?xml version="1.0" encoding="UTF-8"?>
<root><item>not a placemark</item></root>`;

const declarationlessKml = `<kml xmlns="${KML_NS}"><Placemark>
<Point><coordinates>-1.0,52.0</coordinates></Point></Placemark></kml>`;

async function parseKml(text: string): Promise<ImportedData> {
  return parseImportData({ type: 'kml', data: text });
}

describe('looksLikeKml', () => {
  it('accepts KML without an XML declaration', () => {
    expect(looksLikeKml(declarationlessKml)).toBe(true);
  });

  it('accepts namespace-prefixed KML', () => {
    expect(looksLikeKml(prefixedKml)).toBe(true);
  });

  it('rejects text without KML content', () => {
    expect(looksLikeKml('latitude,longitude\n1.0,2.0')).toBe(false);
  });
});

describe('parseImportData KML', () => {
  it('parses unprefixed KML into a GeoJSON layer', async () => {
    const result = await parseKml(unprefixedKml);
    expect(result.type).toBe('kml');
    expect(result.layer).toBeInstanceOf(L.GeoJSON);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry?.type).toBe('Point');
    expect(fc.features[0].properties?.name).toBe('Point A');
  });

  it('parses namespace-prefixed KML identically to unprefixed KML', async () => {
    const result = await parseKml(prefixedKml);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry?.type).toBe('Point');
    expect(fc.features[0].properties?.name).toBe('Point A');
  });

  it('parses prefixed Google Earth KML 2.2 namespace documents', async () => {
    const result = await parseKml(prefixedGoogleEarthKml);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry?.type).toBe('Point');
    expect(fc.features[0].properties?.name).toBe('Point A');
  });

  it('parses prefixed OGC KML 2.3 namespace documents', async () => {
    const prefixedOgc23Kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml:kml xmlns:kml="http://www.opengis.net/kml/2.3"><kml:Document><kml:Placemark>
<kml:name>Point A</kml:name>
<kml:Point><kml:coordinates>-122.08,37.42</kml:coordinates></kml:Point>
</kml:Placemark></kml:Document></kml:kml>`;
    const result = await parseKml(prefixedOgc23Kml);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry?.type).toBe('Point');
    expect(fc.features[0].properties?.name).toBe('Point A');
  });

  it('parses mixed Point and LineString geometries', async () => {
    const result = await parseKml(mixedGeometryKml);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(2);
    const types = fc.features.map(f => f.geometry?.type).sort();
    expect(types).toEqual(['LineString', 'Point']);
  });

  it('parses Polygon geometries', async () => {
    const polygonKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}"><Placemark><name>Yard</name>
<Polygon><outerBoundaryIs><LinearRing><coordinates>
0,0,0 1,0,0 1,1,0 0,1,0 0,0,0
</coordinates></LinearRing></outerBoundaryIs></Polygon>
</Placemark></kml>`;
    const result = await parseKml(polygonKml);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0].geometry?.type).toBe('Polygon');
  });

  it('rejects placemarks that have no geometry', async () => {
    const noGeometryKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="${KML_NS}"><Placemark><name>No geo</name></Placemark></kml>`;
    await expect(parseKml(noGeometryKml)).rejects.toThrow(/no KML content/i);
  });

  it('accepts KML without an XML declaration', async () => {
    const result = await parseKml(declarationlessKml);
    const fc = asFeatureCollection((result.layer as L.GeoJSON).toGeoJSON());
    expect(fc.features).toHaveLength(1);
  });

  it('rejects malformed XML with a parse error', async () => {
    await expect(parseKml(malformedKml)).rejects.toThrow(/could not be parsed/i);
  });

  it('rejects well-formed XML without KML content', async () => {
    await expect(parseKml(nonKmlXml)).rejects.toThrow(/no KML content/i);
  });

  it('does not create default markers for point features', async () => {
    const result = await parseKml(unprefixedKml);
    const markers: L.Layer[] = [];
    (result.layer as L.GeoJSON).eachLayer(layer => {
      if (layer instanceof L.Marker) markers.push(layer);
    });
    expect(markers).toHaveLength(0);
  });

  it('does not create default markers for prefixed point features', async () => {
    const result = await parseKml(prefixedKml);
    const markers: L.Layer[] = [];
    (result.layer as L.GeoJSON).eachLayer(layer => {
      if (layer instanceof L.Marker) markers.push(layer);
    });
    expect(markers).toHaveLength(0);
  });
});