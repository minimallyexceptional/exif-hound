import React, { useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
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
import { ImportedPoint, ImportedData } from '../../utils/importData';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './styles/popup.css';
import './styles/controls.css';

interface MapProps {
  images: (ImageData | ImportedPoint)[];
  selectedImage: ImageData | null;
  showRoute?: boolean;
  onToggleRoute: () => void;
  onSelectImage: (image: ImageData) => void;
  onOpenImport: () => void;
  importedData?: ImportedData;
}

// Add a new component to handle map interactions
const MapInteractionHandler: React.FC<{ selectedImage: ImageData | null }> = ({ selectedImage }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedImage && selectedImage.exif.latitude && selectedImage.exif.longitude) {
      map.flyTo(
        [selectedImage.exif.latitude, selectedImage.exif.longitude],
        16, // Zoom level
        {
          duration: 1.5, // Animation duration in seconds
          easeLinearity: 0.25
        }
      );
    }
  }, [selectedImage, map]);

  return null;
};

const Map: React.FC<MapProps> = ({
  images,
  selectedImage,
  showRoute = false,
  onToggleRoute,
  onSelectImage,
  onOpenImport,
  importedData
}) => {
  const { imagesWithLocation, sortedImages } = useMapImages(images);
  const { center, isFullscreen, setIsFullscreen } = useMapCenter(selectedImage, imagesWithLocation);
  const [showHeatmap, setShowHeatmap] = React.useState(false);
  const [showClusters, setShowClusters] = React.useState(true);

  // Separate CSV data
  const csvData = images.filter((image): image is ImportedPoint => 
    'hasImage' in image && !image.hasImage && !image.file.name.includes('.kml')
  );

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
        <MapInteractionHandler selectedImage={selectedImage} />
        <MapLayers 
          defaultLayer="OpenStreetMap"
          csvData={csvData}
          kmlData={importedData?.type === 'kml' ? importedData : undefined}
        />
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