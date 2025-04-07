import React, { useCallback, useState } from 'react';
import { MapContainer } from 'react-leaflet';
import { ImageData } from '../../types';
import { MapLayers } from './components/layers/MapLayers';
import { MapControls } from './components/controls/MapControls';
import { ImageMarkers } from './components/layers/ImageMarkers';
import { ImageRoute } from './components/layers/ImageRoute';
import { ImageCluster } from './components/layers/ImageCluster';
import { fixCoordinates } from '../../utils/diagnostics';
import * as geolib from 'geolib';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

interface MapProps {
  images: ImageData[];
  selectedImage: ImageData | null;
  showRoute?: boolean;
  onToggleRoute: () => void;
  onSelectImage: (image: ImageData) => void;
}

export const Map: React.FC<MapProps> = ({
  images,
  selectedImage,
  showRoute = false,
  onToggleRoute,
  onSelectImage
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showClusters] = useState(true);
  
  // Filter images to only include those with valid GPS coordinates
  const imagesWithLocation = images.filter(img => {
    if (img.exif.latitude == null || img.exif.longitude == null) return false;
    
    // Final validation with geolib
    return geolib.isValidCoordinate({
      latitude: img.exif.latitude as number,
      longitude: img.exif.longitude as number
    });
  });

  // Sort images by date for route drawing
  const sortedImages = [...imagesWithLocation].sort((a, b) => {
    const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
    const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
    return dateA - dateB;
  });

  // Calculate initial map center based on selected image or first image with location
  const getInitialCenter = useCallback((): [number, number] => {
    if (selectedImage?.exif.latitude != null && selectedImage?.exif.longitude != null) {
      return fixCoordinates(selectedImage.exif.latitude, selectedImage.exif.longitude) as [number, number];
    }
    
    if (imagesWithLocation.length > 0) {
      return fixCoordinates(
        imagesWithLocation[0].exif.latitude!,
        imagesWithLocation[0].exif.longitude!
      ) as [number, number];
    }
    
    return [0, 0]; // Default center if no valid coordinates
  }, [selectedImage, imagesWithLocation]);

  return (
    <MapContainer
      center={getInitialCenter()}
      zoom={13}
      className={`w-full h-full ${isFullscreen ? 'fullscreen' : ''}`}
    >
      <MapLayers defaultLayer="OpenStreetMap" />
      <MapControls
        showRoute={showRoute}
        onToggleRoute={onToggleRoute}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onOpenImport={() => {}}
      />
      
      {showClusters ? (
        <ImageCluster
          images={imagesWithLocation}
          onSelectImage={onSelectImage}
        />
      ) : (
        <ImageMarkers
          images={imagesWithLocation}
          selectedImage={selectedImage}
          onSelectImage={onSelectImage}
        />
      )}

      {showRoute && sortedImages.length > 1 && (
        <ImageRoute images={sortedImages} />
      )}
    </MapContainer>
  );
}; 