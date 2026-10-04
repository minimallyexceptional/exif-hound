import { ImageData } from '../types';
import L from 'leaflet';
import { kml as kmlToGeoJSON } from '@tmcw/togeojson';

const KML_NAMESPACE = 'http://www.opengis.net/kml/2.2';
const KML_NAMESPACES = new Set([
  KML_NAMESPACE,
  'http://www.opengis.net/kml/2.3',
  'http://earth.google.com/kml/2.2',
  'http://earth.google.com/kml/2.1',
  'http://earth.google.com/kml/2.0',
]);

function isKmlNamespace(ns: string | null): boolean {
  return !!ns && KML_NAMESPACES.has(ns);
}

/**
 * Cheap pre-check used by the import modal: does the text look like KML at all?
 * Accepts documents with or without an XML declaration and with or without a
 * namespace prefix (`<kml>` as well as `<kml:kml>`). Definitive validation
 * happens in parseImportData via DOMParser.
 */
export function looksLikeKml(text: string): boolean {
  return /<(?:[a-z0-9-]+:)?kml[\s>]/i.test(text);
}

/**
 * `getElementsByTagName('Placemark')` does not match prefix-qualified elements
 * like `<kml:Placemark>` (verified in Chromium and jsdom), which would make
 * prefixed KML parse to an empty FeatureCollection. Rebuild the document with
 * KML-namespace elements renamed to their unprefixed local names so standard
 * tag-name lookups work. Other namespaces (e.g. gx:) are preserved so
 * extension-element matching still applies.
 */
function normalizeKmlNamespaces(doc: Document): Document {
  const root = doc.documentElement;
  if (!root) return doc;

  const hasPrefixedKmlElement = Array.from(root.getElementsByTagName('*')).some(
    el => isKmlNamespace(el.namespaceURI) && !!el.prefix
  );
  if (!hasPrefixedKmlElement) return doc;

  const normalized = doc.implementation.createDocument(KML_NAMESPACE, root.localName || 'kml');

  const cloneInto = (source: Node, parent: Node): void => {
    for (const child of Array.from(source.childNodes)) {
      if (child.nodeType === child.ELEMENT_NODE) {
        const el = child as Element;
        const newEl = el.namespaceURI
          ? normalized.createElementNS(
              isKmlNamespace(el.namespaceURI) ? KML_NAMESPACE : el.namespaceURI,
              isKmlNamespace(el.namespaceURI) ? el.localName || el.tagName : el.tagName
            )
          : normalized.createElement(el.localName || el.tagName);
        for (const attr of Array.from(el.attributes)) {
          if (attr.name.startsWith('xmlns')) continue;
          newEl.setAttribute(attr.name, attr.value);
        }
        parent.appendChild(newEl);
        cloneInto(el, newEl);
      } else if (
        child.nodeType === child.TEXT_NODE ||
        child.nodeType === child.CDATA_SECTION_NODE ||
        child.nodeType === child.COMMENT_NODE
      ) {
        parent.appendChild(normalized.importNode(child, false));
      }
    }
  };

  cloneInto(root, normalized.documentElement);
  return normalized;
}

function parseKmlToLayer(text: string): L.GeoJSON {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(text, 'text/xml');
  } catch {
    throw new Error('The KML file could not be parsed. It may be corrupted or not valid XML.');
  }

  if (
    !doc.documentElement ||
    doc.getElementsByTagName('parsererror').length > 0 ||
    doc.documentElement.nodeName === 'parsererror'
  ) {
    throw new Error('The KML file could not be parsed. It may be corrupted or not valid XML.');
  }

  const root = doc.documentElement;
  const isKmlRoot = root.localName.toLowerCase() === 'kml';
  const hasKmlPlacemarks = Array.from(root.getElementsByTagName('*')).some(
    el => el.localName === 'Placemark' && (isKmlNamespace(el.namespaceURI) || !el.namespaceURI)
  );
  if (!isKmlRoot && !hasKmlPlacemarks) {
    throw new Error('No KML content was found in the file.');
  }

  const geojson = kmlToGeoJSON(normalizeKmlNamespaces(doc), { skipNullGeometry: true });
  if (!geojson.features || geojson.features.length === 0) {
    throw new Error('No KML content was found in the file.');
  }

  // Rendered by the map layer component's <GeoJSON>. Leaflet's default
  // pointToLayer creates default marker icons for Point features, so points
  // are mapped to unstyled circleMarkers instead: no marker icons are created,
  // bounds stay correct, and the map component owns the rendering style.
  return L.geoJSON(geojson, {
    pointToLayer: (_feature, latlng) => L.circleMarker(latlng)
  });
}

export interface ImportedPoint extends ImageData {
  hasImage: boolean;
}

export interface ImportedData {
  type: 'kml' | 'csv';
  data: string;
  layer?: L.Layer;
  points?: ImportedPoint[];
}

export function parseImportData(data: { type: 'kml' | 'csv', data: string }): Promise<ImportedData> {
  return new Promise((resolve, reject) => {
    try {
      if (data.type === 'kml') {
        const kmlLayer = parseKmlToLayer(data.data);
        resolve({
          type: 'kml',
          data: data.data,
          layer: kmlLayer
        });
      } else {
        // Parse CSV data
        const lines = data.data.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const validImages: ImportedPoint[] = [];
        
        lines.slice(1).forEach((line, index) => {
          const values = line.split(',');
          const row: Record<string, string> = {};
          
          headers.forEach((header, i) => {
            row[header] = values[i]?.trim() || '';
          });
          
          // Check if we have coordinates
          const lat = parseFloat(row['latitude']);
          const lon = parseFloat(row['longitude']);
          if (isNaN(lat) || isNaN(lon)) {
            return;
          }
          
          const imageUrl = row['url'] || row['image url'];
          
          validImages.push({
            id: Math.random().toString(36).substr(2, 9),
            url: imageUrl || '',
            hasImage: !!imageUrl,
            file: {
              name: row['file name'] || `Imported Point ${index + 1}`,
              type: row['file type'] || '',
              size: parseInt(row['file size (bytes)']) || 0,
              lastModified: Date.now()
            },
            exif: {
              latitude: lat,
              longitude: lon,
              dateTimeOriginal: row['date taken'] || new Date().toISOString(),
              make: row['make'] || '',
              model: row['model'] || '',
              exposureTime: row['exposure time'] || '',
              fNumber: row['f-number'] || '',
              iso: row['iso'] || '',
              focalLength: row['focal length'] ? parseFloat(row['focal length']) : null,
              gpsAltitude: parseFloat(row['gps altitude']),
              gpsAltitudeRef: row['gps altitude ref'] || '',
              imageWidth: parseInt(row['image width']),
              imageHeight: parseInt(row['image height']),
              orientation: parseInt(row['orientation']),
              software: row['software'] || '',
              artist: row['artist'] || '',
              copyright: row['copyright'] || '',
              description: row['description'] || '',
              lensModel: row['lens model'] || '',
              flash: row['flash'] || '',
              meteringMode: row['metering mode'] || '',
              whiteBalance: row['white balance'] || '',
              imageDescription: row['image description'] || '',
              userComment: row['user comment'] || ''
            }
          });
        });
        
        resolve({
          type: 'csv',
          data: data.data,
          points: validImages
        });
      }
    } catch (error) {
      reject(error);
    }
  });
} 