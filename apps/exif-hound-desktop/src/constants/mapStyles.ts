import { MapStyle } from '../types';
import previewOsmStandard from '../assets/map-previews/osm-standard.svg';
import previewOsmHumanitarian from '../assets/map-previews/osm-humanitarian.svg';
import previewTerrain from '../assets/map-previews/terrain.svg';

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'osm-standard',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    preview: previewOsmStandard
  },
  {
    id: 'osm-humanitarian',
    name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    preview: previewOsmHumanitarian
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    preview: previewTerrain
  }
];