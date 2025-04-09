import { MapStyle } from '../types';

export const MAP_STYLES: MapStyle[] = [
  {
    id: 'osm-standard',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    preview: 'https://tile.openstreetmap.org/13/1308/3166.png'
  },
  {
    id: 'osm-humanitarian',
    name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
    preview: 'https://a.tile.openstreetmap.fr/hot/13/1308/3166.png'
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    preview: 'https://tile.opentopomap.org/13/1308/3166.png'
  },
  {
    id: 'classic',
    name: 'Classic Inverted',
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: 'https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/13/1308/3166.png'
  },
  {
    id: 'grey-matter',
    name: 'Grey Matter',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: 'https://a.basemaps.cartocdn.com/light_all/13/1308/3166.png'
  },
  {
    id: 'fiord',
    name: 'Fiord',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    preview: 'https://a.basemaps.cartocdn.com/dark_all/13/1308/3166.png'
  }
];