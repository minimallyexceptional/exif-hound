declare module '@mapbox/leaflet-omnivore' {
  import * as L from 'leaflet';

  interface ParseOptions {
    style?: L.PathOptions;
    filter?: (feature: GeoJSON.Feature) => boolean;
    customLayer?: (geojson: GeoJSON.FeatureCollection, options?: L.GeoJSONOptions) => L.GeoJSON;
  }

  export function kml(url: string): L.GeoJSON;
  export function gpx(url: string): L.GeoJSON;
  export function csv(url: string): L.GeoJSON;
  export function wkt(url: string): L.GeoJSON;
  export function topojson(url: string): L.GeoJSON;
  
  export namespace kml {
    export function parse(str: string, options?: ParseOptions): L.GeoJSON;
  }
  
  export namespace gpx {
    export function parse(str: string, options?: ParseOptions): L.GeoJSON;
  }
  
  export namespace csv {
    export function parse(str: string, options?: ParseOptions): L.GeoJSON;
  }
  
  export namespace wkt {
    export function parse(str: string, options?: ParseOptions): L.GeoJSON;
  }
  
  export namespace topojson {
    export function parse(str: string, options?: ParseOptions): L.GeoJSON;
  }
} 