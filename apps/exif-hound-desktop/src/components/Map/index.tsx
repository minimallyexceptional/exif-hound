import React from 'react';
import { MapContainer } from 'react-leaflet';
import { ImageData } from '../../types';
import { MapLayers } from './components/layers/MapLayers';
import { MapControls } from './components/controls/MapControls';
import { ImageRoute } from './components/layers/ImageRoute';
import { ImageCluster } from './components/layers/ImageCluster';
import { useMapCenter } from './hooks/useMapCenter';
import { useMapImages } from './hooks/useMapImages';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './styles/popup.css';
import './styles/controls.css';

interface MapProps {
  images: ImageData[];
  selectedImage: ImageData | null;
  showRoute?: boolean;
  onToggleRoute: () => void;
  onSelectImage: (image: ImageData) => void;
  onOpenImport: () => void;
}

const Map: React.FC<MapProps> = ({
  images,
  selectedImage,
  showRoute = false,
  onToggleRoute,
  onSelectImage,
  onOpenImport
}) => {
  const { imagesWithLocation, sortedImages } = useMapImages(images);
  const { center, isFullscreen, setIsFullscreen } = useMapCenter(selectedImage, imagesWithLocation);

  return (
    <MapErrorBoundary>
      <MapContainer
        center={center}
        zoom={13}
        className={`w-full h-full ${isFullscreen ? 'fullscreen' : ''}`}
      >
        <MapLayers defaultLayer="OpenStreetMap" />
        <MapControls
          showRoute={showRoute}
          onToggleRoute={onToggleRoute}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onOpenImport={onOpenImport}
        />
        
        <ImageCluster
          images={imagesWithLocation}
          onSelectImage={onSelectImage}
        />

        {showRoute && sortedImages.length > 1 && (
          <ImageRoute images={sortedImages} />
        )}
      </MapContainer>
    </MapErrorBoundary>
  );
};

export default Map; 