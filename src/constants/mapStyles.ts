import { MapStyle } from '../types';

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'osm-standard',
    name: 'Standard',
    url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    preview: 'https://a.tile.openstreetmap.org/7/63/42.png'
  },
  {
    id: 'osm-humanitarian',
    name: 'Humanitarian',
    url: 'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
    preview: 'https://a.tile.openstreetmap.fr/hot/7/63/42.png'
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    preview: 'https://a.tile.opentopomap.org/7/63/42.png'
  }
];