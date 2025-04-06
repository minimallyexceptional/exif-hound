import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from 'react-leaflet';
import { ImageData } from '../types';
import { useSettings } from '../context/SettingsContext';
import { MAP_STYLES } from '../constants/mapStyles';
import 'leaflet/dist/leaflet.css';
import { Icon, Marker as LeafletMarker } from 'leaflet';
import { Maximize2, X, ZapOff as MapOff, Route as RouteIcon } from 'lucide-react';
import { formatShortDateTime } from '../utils/date';
import * as geolib from 'geolib';
import { fixCoordinates, isWesternHemisphere } from '../utils/diagnostics';
import { formatShortLocation } from '../utils/geocoding';

/**
 * Map Component
 * 
 * This component displays image locations on a Leaflet map.
 * 
 * IMPORTANT: This implementation relies on the EXIF middleware for coordinate
 * processing. The middleware handles all GPS coordinate extraction, validation,
 * and sign correction. The useExifData hook converts the middleware's metadata
 * format to the application's ExifData format.
 * 
 * Leaflet expects coordinates in [latitude, longitude] format.
 * The geolib package is used for additional validation and formatting.
 */

// Fix for default marker icon not showing up
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface Props {
  images: ImageData[];
  selectedImage: ImageData | null;
  showRoute?: boolean;
  onToggleRoute: () => void;
}

// Default marker icon
const defaultIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Highlighted marker icon
const highlightedIcon = new Icon({
  iconUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -41],
  shadowSize: [41, 41]
});

const isValidCoordinate = (coord: number | null | undefined): coord is number => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

// Auto pan component that handles map movement
function MapUpdater({ selectedImage }: { selectedImage: ImageData | null }) {
  const map = useMap();
  const markersRef = useRef<{ [key: string]: LeafletMarker }>({});
  
  useEffect(() => {
    const lat = selectedImage?.exif.latitude;
    const lng = selectedImage?.exif.longitude;

    if (isValidCoordinate(lat) && isValidCoordinate(lng)) {
      // Use the correct coordinate order for Leaflet [latitude, longitude]
      map.setView(
        [lat, lng],
        15,
        {
          animate: true,
          duration: 0.8
        }
      );

      // Reset all markers to default icon and close their popups
      Object.values(markersRef.current).forEach(marker => {
        marker.setIcon(defaultIcon);
        marker.closePopup();
      });

      // Highlight the selected marker and open its popup
      const selectedMarker = selectedImage && markersRef.current[selectedImage.id];
      if (selectedMarker) {
        selectedMarker.setIcon(highlightedIcon);
        selectedMarker.openPopup();
      }
    }
  }, [selectedImage, map]);

  return null;
}

const Map: React.FC<Props> = ({ images, selectedImage, showRoute = false, onToggleRoute }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const defaultPosition: [number, number] = [0, 0];
  const markersRef = useRef<{ [key: string]: LeafletMarker }>({});
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { mapSettings } = useSettings();
  
  const selectedStyle = MAP_STYLES.find(style => style.id === mapSettings.selectedStyle) || MAP_STYLES[0];
  
  // Filter images to only include those with valid GPS coordinates
  const imagesWithLocation = images.filter(img => {
    const hasCoordinates = isValidCoordinate(img.exif.latitude) && isValidCoordinate(img.exif.longitude);
    if (hasCoordinates) {
      // Final validation with geolib
      return geolib.isValidCoordinate({
        latitude: img.exif.latitude!,
        longitude: img.exif.longitude!
      });
    }
    return false;
  });

  const hasNoLocationData = selectedImage && 
    (!isValidCoordinate(selectedImage.exif.latitude) || !isValidCoordinate(selectedImage.exif.longitude));

  // Sort images by date for route drawing
  const sortedImages = [...imagesWithLocation].sort((a, b) => {
    const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
    const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
    return dateA - dateB;
  });

  // Create route coordinates - always using [latitude, longitude] format for Leaflet
  const routeCoordinates = sortedImages
    .map(img => [img.exif.latitude!, img.exif.longitude!] as [number, number]);

  // Set center point of map
  const center = imagesWithLocation.length > 0 && 
    isValidCoordinate(imagesWithLocation[0].exif.latitude) && 
    isValidCoordinate(imagesWithLocation[0].exif.longitude)
      ? [imagesWithLocation[0].exif.latitude!, imagesWithLocation[0].exif.longitude!] 
      : defaultPosition;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const NoLocationOverlay = () => (
    <div className="absolute inset-0 z-[9999] bg-app-black/90 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="text-center space-y-4 p-6 glass-panel rounded-lg w-full max-w-md mx-4">
        <MapOff className="w-16 h-16 mx-auto text-app-white" />
        <h3 className="text-xl font-semibold text-app-white">
          No Location Data Available
        </h3>
        <p className="text-app-white">
          {selectedImage?.exif.error || 'This image does not contain any GPS coordinates in its EXIF data.'}
        </p>
        {imagesWithLocation.length > 0 && (
          <p className="text-sm text-app-accent">
            {imagesWithLocation.length} other image{imagesWithLocation.length !== 1 ? 's have' : ' has'} location data
          </p>
        )}
      </div>
    </div>
  );

  const MapContent = () => (
    <MapContainer 
      center={center as [number, number]} 
      zoom={13} 
      className="w-full h-full"
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      ref={mapRef}
    >
      <ZoomControl position="bottomright" />
      <MapUpdater selectedImage={selectedImage} />
      <TileLayer
        url={selectedStyle.url}
        attribution={selectedStyle.attribution}
      />
      {showRoute && routeCoordinates.length > 1 && (
        <Polyline
          positions={routeCoordinates}
          color="#ff0000"
          weight={3}
          opacity={0.8}
          dashArray="10, 10"
        />
      )}
      {imagesWithLocation.map((image) => {
        const origLat = image.exif.latitude!;
        const origLng = image.exif.longitude!;
        
        // Apply coordinate fixes - both are already non-null due to the imagesWithLocation filter
        const [lat, lng] = fixCoordinates(origLat, origLng) as [number, number];
        
        // Validate coordinates using geolib
        const isValid = geolib.isValidCoordinate({ 
          latitude: lat, 
          longitude: lng 
        });
        
        // Log raw coordinates for debugging
        console.log(`MAP PIN DATA: ${image.file.name}`, {
          originalLat: origLat,
          originalLng: origLng,
          fixedLat: lat,
          fixedLng: lng,
          wasFixed: origLng !== lng,
          isWesternHemisphere: isWesternHemisphere(origLat, origLng),
          isValidCoordinate: isValid,
          formattedDMS: {
            latitude: geolib.decimalToSexagesimal(lat),
            longitude: geolib.decimalToSexagesimal(lng)
          }
        });

        return (
          <Marker
            key={image.id}
            position={[lat, lng]}
            icon={image.id === selectedImage?.id ? highlightedIcon : defaultIcon}
            ref={(ref) => {
              if (ref) {
                markersRef.current[image.id] = ref;
              }
            }}
          >
            <Popup>
              <div className="p-2">
                <img 
                  src={image.url} 
                  alt="Location" 
                  className="w-32 h-32 object-cover rounded mb-2"
                />
                <div className="text-sm">
                  <p><strong>Date:</strong> {image.exif.dateTimeOriginal ? formatShortDateTime(image.exif.dateTimeOriginal) : 'Not available'}</p>
                  <p><strong>Camera:</strong> {image.exif.make || 'Unknown'} {image.exif.model || ''}</p>
                  <div className="mt-1">
                    <p className="font-semibold">Location</p>
                    {image.exif.location && !image.exif.location.loading ? (
                      <p className="text-xs">{formatShortLocation(image.exif.location)}</p>
                    ) : image.exif.location?.loading ? (
                      <p className="text-xs text-gray-600">Loading location data...</p>
                    ) : null}
                    <p className="text-xs text-gray-600">Decimal: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
                    <p className="text-xs text-gray-600">DMS: {geolib.decimalToSexagesimal(lat)}, {geolib.decimalToSexagesimal(lng)}</p>
                    <p className="text-xs text-gray-600">Hemisphere: {lat >= 0 ? 'N' : 'S'}, {lng >= 0 ? 'E' : 'W'}</p>
                  </div>
                  {isWesternHemisphere(lat, lng) && lng > 0 && (
                    <p className="text-red-500 mt-1 text-xs">
                      Warning: Western hemisphere longitude should be negative!
                    </p>
                  )}
                  {!isValid && (
                    <p className="text-red-500 mt-1 text-xs">
                      Warning: These coordinates may not be valid!
                    </p>
                  )}
                  {image.exif.error && (
                    <p className="text-red-500 mt-1">{image.exif.error}</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9998] bg-app-black">
        <div className="absolute top-0 left-0 right-0 z-[10000] bg-gradient-to-b from-black/50 to-transparent p-4 flex justify-between items-center">
          <div className="text-app-white">
            <h2 className="text-lg font-semibold">Location Map</h2>
            <p className="text-sm opacity-80">
              {imagesWithLocation.length} location{imagesWithLocation.length !== 1 ? 's' : ''} plotted
            </p>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors text-app-white"
            aria-label="Exit fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute inset-0 h-screen w-screen" ref={mapContainerRef}>
          <MapContent />
          {hasNoLocationData && <NoLocationOverlay />}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10000] bg-black/30 text-app-white px-3 py-1.5 rounded-full text-sm">
          Press ESC to exit fullscreen
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-lg overflow-hidden" ref={mapContainerRef}>
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <button
          onClick={onToggleRoute}
          className="bg-app-gray p-2 rounded-lg shadow-lg hover:bg-app-gray-light transition-colors"
          aria-label={showRoute ? "Hide route" : "Show route"}
        >
          <RouteIcon className={`w-5 h-5 ${showRoute ? 'text-app-accent' : 'text-app-white'}`} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-app-gray p-2 rounded-lg shadow-lg hover:bg-app-gray-light transition-colors"
          aria-label="Enter fullscreen"
        >
          <Maximize2 className="w-5 h-5 text-app-white" />
        </button>
      </div>

      <MapContent />
      {hasNoLocationData && <NoLocationOverlay />}
    </div>
  );
};

export default Map;