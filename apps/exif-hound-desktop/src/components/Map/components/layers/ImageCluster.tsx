import { createLayerComponent, LayerProps } from '@react-leaflet/core';
import L from 'leaflet';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';
import 'leaflet.markercluster';

// Extend Leaflet types to include MarkerCluster
declare module 'leaflet' {
  export interface MarkerCluster extends L.Layer {
    getChildCount(): number;
  }

  export interface MarkerClusterGroupOptions extends L.LayerOptions {
    chunkedLoading?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon;
  }

  export class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
  }

  export interface MarkerClusterStatic {
    markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
  }
}

interface ImageClusterProps extends LayerProps {
  images: ImageData[];
  onSelectImage: (image: ImageData) => void;
}

// Create custom cluster icon
const createClusterIcon = (cluster: L.MarkerCluster) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
  const sizeMap = {
    small: 35,
    medium: 45,
    large: 55
  };

  return L.divIcon({
    html: `
      <div class="bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg" 
           style="width: ${sizeMap[size]}px; height: ${sizeMap[size]}px;">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(sizeMap[size], sizeMap[size]),
    iconAnchor: [sizeMap[size] / 2, sizeMap[size] / 2]
  });
};

// Create the cluster layer component
export const ImageCluster = createLayerComponent<L.MarkerClusterGroup, ImageClusterProps>(
  ({ images, onSelectImage }, context) => {
    const instance = (L as unknown as L.MarkerClusterStatic).markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 40,
      iconCreateFunction: createClusterIcon
    });

    // Add markers to the cluster group
    images.forEach(image => {
      const [lat, lng] = fixCoordinates(image.exif.latitude!, image.exif.longitude!) as [number, number];
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `
            <div class="bg-gray-900 rounded-full p-2 shadow-lg">
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm8 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
              </svg>
            </div>
          `,
          className: 'custom-marker-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      });

      marker.on('click', () => {
        onSelectImage(image);
      });

      instance.addLayer(marker);
    });

    return { instance, context };
  }
); 