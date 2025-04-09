import React from 'react';
import { MapContainer } from 'react-leaflet';
import { ImageData } from '../../types';
import { MapLayers } from './components/layers/MapLayers';
import { MapControls } from './components/controls/MapControls';
import { ImageRoute } from './components/layers/ImageRoute';
import { ImageCluster } from './components/layers/ImageCluster';
import { ImageHeatmap } from './components/layers/HeatmapLayer';
import { MapZoomHandler } from './components/controls/MapZoomHandler';
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
  const [showHeatmap, setShowHeatmap] = React.useState(false);
  const [showClusters, setShowClusters] = React.useState(true);

  const handleHeatmapToggle = () => {
    setShowHeatmap(!showHeatmap);
    if (!showHeatmap && showRoute) {
      onToggleRoute(); // Turn off route if turning on heatmap
    }
  };

  const handleRouteToggle = () => {
    if (showHeatmap) {
      setShowHeatmap(false); // Turn off heatmap if turning on route
    }
    onToggleRoute();
  };

  const handleClusterToggle = () => {
    setShowClusters(!showClusters);
  };

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
          showHeatmap={showHeatmap}
          showClusters={showClusters}
          onToggleRoute={handleRouteToggle}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onOpenImport={onOpenImport}
          onToggleHeatmap={handleHeatmapToggle}
          onToggleClusters={handleClusterToggle}
        />
        
        <MapZoomHandler showRoute={showRoute} images={sortedImages} />
        
        {showHeatmap ? (
          <ImageHeatmap images={imagesWithLocation} />
        ) : (
          <ImageCluster
            images={imagesWithLocation}
            onSelectImage={onSelectImage}
            enableClustering={showClusters}
          />
        )}

        {showRoute && sortedImages.length > 1 && (
          <ImageRoute images={sortedImages} />
        )}
      </MapContainer>
    </MapErrorBoundary>
  );
};

export default Map; 