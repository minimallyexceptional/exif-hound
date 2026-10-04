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
import ReticleLayer from './components/layers/ReticleLayer';

// Lazy load CSS imports only when Map component is loaded
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './styles/popup.css';
import './styles/controls.css';

interface MapProps {
  images: (ImageData | ImportedPoint)[];
  selectedImage: ImageData | null;
  gallerySelectionRequest?: number;
  showRoute?: boolean;
  onToggleRoute: () => void;
  onSelectImage: (image: ImageData) => void;
  onOpenImport: () => void;
  importedData?: ImportedData;
}

// Add a new component to handle map interactions
const MapInteractionHandler: React.FC<{ 
  selectedImage: ImageData | null;
  fromReticle?: boolean;
  gallerySelectionRequest: number;
  reticleVisible: boolean;
  onReticleVisibilityChange: (visible: boolean) => void;
}> = ({ selectedImage, fromReticle, gallerySelectionRequest, reticleVisible, onReticleVisibilityChange }) => {
  const map = useMap();
  const previousGalleryRequest = React.useRef(gallerySelectionRequest);
  const galleryHandledImageId = React.useRef<string | null>(null);

  useEffect(() => {
    if (!gallerySelectionRequest || previousGalleryRequest.current === gallerySelectionRequest || !selectedImage) return;
    previousGalleryRequest.current = gallerySelectionRequest;

    const { latitude, longitude } = selectedImage.exif;
    if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const shouldRestoreReticle = reticleVisible;
    galleryHandledImageId.current = selectedImage.id;
    if (shouldRestoreReticle) onReticleVisibilityChange(false);

    if (!shouldRestoreReticle) {
      map.flyTo([latitude, longitude], 16, { duration: 0.3, easeLinearity: 0.25 });
      return;
    }

    const restoreReticle = () => {
      clearTimeout(restoreTimer);
      map.off('moveend', restoreReticle);
      onReticleVisibilityChange(true);
    };
    map.once('moveend', restoreReticle);
    const restoreTimer: ReturnType<typeof setTimeout> = setTimeout(restoreReticle, 1000);
    map.flyTo([latitude, longitude], 16, { duration: 0.3, easeLinearity: 0.25 });

    return () => {
      if (restoreTimer) clearTimeout(restoreTimer);
      map.off('moveend', restoreReticle);
      onReticleVisibilityChange(true);
    };
  }, [gallerySelectionRequest, map, onReticleVisibilityChange, reticleVisible, selectedImage]);

  useEffect(() => {
    if (selectedImage && selectedImage.exif.latitude != null && selectedImage.exif.longitude != null && !fromReticle) {
      if (galleryHandledImageId.current === selectedImage.id) {
        galleryHandledImageId.current = null;
        return;
      }
      map.flyTo(
        [selectedImage.exif.latitude, selectedImage.exif.longitude],
        16, // Zoom level
        {
          duration: 0.3, // Animation duration in seconds
          easeLinearity: 0.25
        }
      );
    }
  }, [selectedImage, map, fromReticle]);

  return null;
};

const Map: React.FC<MapProps> = ({
  images,
  selectedImage,
  gallerySelectionRequest = 0,
  showRoute = false,
  onToggleRoute,
  onSelectImage,
  onOpenImport,
  importedData
}) => {
  const { imagesWithLocation, sortedImages } = useMapImages(images);
  const { center, isFullscreen, setIsFullscreen } = useMapCenter(selectedImage, imagesWithLocation);
  const [showHeatmap, setShowHeatmap] = React.useState(false);
  const [showClusters, setShowClusters] = React.useState(false);
  const [showReticle, setShowReticle] = React.useState(true);
  const [isReticleTemporarilyHidden, setIsReticleTemporarilyHidden] = React.useState(false);
  const [fromReticle, setFromReticle] = React.useState(false);

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

  const handleReticleToggle = React.useCallback(() => setShowReticle(visible => !visible), []);
  const handleReticleVisibilityChange = React.useCallback((visible: boolean) => {
    setIsReticleTemporarilyHidden(!visible);
  }, []);

  const handleImageSelect = (image: ImageData, fromReticle?: boolean) => {
    setFromReticle(!!fromReticle);
    onSelectImage(image);
  };

  return (
    <MapErrorBoundary>
      <MapContainer
        center={center}
        zoom={13}
        className={`w-full h-full ${isFullscreen ? 'fullscreen' : ''}`}
      >
        <MapInteractionHandler
          selectedImage={selectedImage}
          fromReticle={fromReticle}
          gallerySelectionRequest={gallerySelectionRequest}
          reticleVisible={showReticle}
          onReticleVisibilityChange={handleReticleVisibilityChange}
        />
        <MapLayers 
          defaultLayer="OpenStreetMap"
          csvData={csvData}
          kmlData={importedData?.type === 'kml' ? importedData : undefined}
        />
        <MapControls
          showRoute={showRoute}
          showHeatmap={showHeatmap}
          showClusters={showClusters}
          showReticle={showReticle}
          onToggleRoute={handleRouteToggle}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onOpenImport={onOpenImport}
          onToggleHeatmap={handleHeatmapToggle}
          onToggleClusters={handleClusterToggle}
          onToggleReticle={handleReticleToggle}
        />
        
        <MapZoomHandler showRoute={showRoute} images={sortedImages} />
        
        {showHeatmap ? (
          <ImageHeatmap images={imagesWithLocation} />
        ) : (
          <ImageCluster
            images={imagesWithLocation}
            onSelectImage={handleImageSelect}
            enableClustering={showClusters}
          />
        )}

        {showRoute && sortedImages.length > 1 && (
          <ImageRoute images={sortedImages} />
        )}

        {showReticle && !isReticleTemporarilyHidden && (
          <ReticleLayer 
            images={imagesWithLocation}
            onSelectImage={handleImageSelect}
          />
        )}
      </MapContainer>
    </MapErrorBoundary>
  );
};

export default Map;
