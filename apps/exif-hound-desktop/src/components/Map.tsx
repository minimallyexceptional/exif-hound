import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from 'react-leaflet';
import { ImageData } from '../types';
import { useSettings } from '../context/SettingsContext';
import { MAP_STYLES } from '../constants/mapStyles';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Maximize2, X, ZapOff as MapOff, Route as RouteIcon, Upload } from 'lucide-react';
import { formatShortDateTime } from '../utils/date';
import * as geolib from 'geolib';
import { fixCoordinates, isWesternHemisphere } from '../utils/diagnostics';
import { formatShortLocation } from '../utils/geocoding';
import ImportModal from './ImportModal';
import * as omnivore from '@mapbox/leaflet-omnivore';
import * as L from 'leaflet';

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

// Create custom camera icon
const cameraIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
  <svg width="492" height="492" viewBox="0 0 492 492" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="246" cy="246" r="234.666" fill="#111111" stroke="white" stroke-width="22.6677"/>
    <path d="M272.942 159.789H219.06L192.119 192.118H159.789C154.073 192.118 148.591 194.389 144.549 198.431C140.507 202.473 138.236 207.955 138.236 213.671V310.659C138.236 316.375 140.507 321.857 144.549 325.899C148.591 329.941 154.073 332.212 159.789 332.212H332.212C337.928 332.212 343.41 329.941 347.452 325.899C351.494 321.857 353.765 316.375 353.765 310.659V213.671C353.765 207.955 351.494 202.473 347.452 198.431C343.41 194.389 337.928 192.118 332.212 192.118H299.883L272.942 159.789Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M245.999 289.106C263.854 289.106 278.329 274.632 278.329 256.777C278.329 238.922 263.854 224.447 245.999 224.447C228.144 224.447 213.67 238.922 213.67 256.777C213.67 274.632 228.144 289.106 245.999 289.106Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Highlighted camera icon (larger size)
const highlightedCameraIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
  <svg width="492" height="492" viewBox="0 0 492 492" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="246" cy="246" r="234.666" fill="white" stroke="black" stroke-width="22.6677"/>
    <path d="M272.942 159.789H219.06L192.119 192.118H159.789C154.073 192.118 148.591 194.389 144.549 198.431C140.507 202.473 138.236 207.955 138.236 213.671V310.659C138.236 316.375 140.507 321.857 144.549 325.899C148.591 329.941 154.073 332.212 159.789 332.212H332.212C337.928 332.212 343.41 329.941 347.452 325.899C351.494 321.857 353.765 316.375 353.765 310.659V213.671C353.765 207.955 351.494 202.473 347.452 198.431C343.41 194.389 337.928 192.118 332.212 192.118H299.883L272.942 159.789Z" stroke="black" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M245.999 289.106C263.854 289.106 278.329 274.632 278.329 256.777C278.329 238.922 263.854 224.447 245.999 224.447C228.144 224.447 213.67 238.922 213.67 256.777C213.67 274.632 228.144 289.106 245.999 289.106Z" stroke="black" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

interface Props {
  images: ImageData[];
  selectedImage: ImageData | null;
  showRoute?: boolean;
  onToggleRoute: () => void;
  onSelectImage: (image: ImageData) => void;
}

interface ImportedLayer {
  id: string;
  name: string;
  type: 'kml' | 'csv';
  layer: L.Layer;
  visible: boolean;
}

const isValidCoordinate = (coord: number | null | undefined): coord is number => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

// Auto pan component that handles map movement
function MapUpdater({ selectedImage }: { selectedImage: ImageData | null }) {
  const map = useMap();
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  
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
        marker.setIcon(cameraIcon);
        marker.closePopup();
      });

      // Highlight the selected marker and open its popup
      const selectedMarker = selectedImage && markersRef.current[selectedImage.id];
      if (selectedMarker) {
        selectedMarker.setIcon(highlightedCameraIcon);
        selectedMarker.openPopup();
      }
    }
  }, [selectedImage, map]);

  return null;
}

// Add MapSetup component at the top level
function MapSetup() {
  const map = useMap();
  
  useEffect(() => {
    if (!map.getPane('markersPane')) {
      map.createPane('markersPane');
      map.getPane('markersPane')!.style.zIndex = '600';
    }
  }, [map]);

  return null;
}

function KMLLayer({ data }: { data: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    console.log('Creating KML layer...');
    
    // Parse KML string directly
    const layer = omnivore.kml.parse(data)
      .on('ready', function(this: L.GeoJSON) {
        console.log('KML layer ready');
        
        // Get the features
        const features = this.getLayers();
        console.log('Number of features:', features.length);
        
        // Add markers for each feature
        features.forEach((feature, i) => {
          if (feature instanceof L.Marker) {
            const pos = feature.getLatLng();
            console.log(`Feature ${i} position:`, pos);
            
            // Create a circle marker
            const marker = L.circleMarker(pos, {
              radius: 20,
              fillColor: '#ff0000',
              color: '#000',
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(map);
            
            // Add popup if available
            const popup = feature.getPopup();
            if (popup) {
              marker.bindPopup(popup);
            }
          }
        });
        
        // Fit bounds if we have features
        if (features.length > 0) {
          const bounds = this.getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      })
      .on('error', function(e) {
        console.error('Error parsing KML:', e);
      });
    
    // Add the base layer to the map
    layer.addTo(map);
    
    return () => {
      map.removeLayer(layer);
    };
  }, [map, data]);
  
  return null;
}

const Map: React.FC<Props> = ({ images, selectedImage, showRoute = false, onToggleRoute, onSelectImage }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedLayers, setImportedLayers] = useState<ImportedLayer[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingKmlData, setPendingKmlData] = useState<{ data: string; blobUrl: string } | null>(null);
  const defaultPosition: [number, number] = [0, 0];
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
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

  // Initialize custom pane when map is ready
  useEffect(() => {
    if (mapRef.current && !mapRef.current.getPane('markersPane')) {
      mapRef.current.createPane('markersPane');
      mapRef.current.getPane('markersPane')!.style.zIndex = '600';
    }
  }, [mapRef.current]);

  const handleImport = async (data: { type: 'kml' | 'csv', data: string }) => {
    if (!mapRef.current) return;
    setImportError(null);

    try {
      if (data.type === 'kml') {
        // Log the KML content for debugging
        console.log('Raw KML content (first 500 chars):', data.data.substring(0, 500));
        
        // Enhanced KML validation
        if (!data.data.includes('<?xml')) {
          setImportError('Missing XML declaration');
          return;
        }
        if (!data.data.includes('<kml')) {
          setImportError('Missing KML root element');
          return;
        }
        if (!data.data.includes('<Placemark>')) {
          setImportError('No Placemark elements found in KML');
          return;
        }

        // Store the KML data
        setPendingKmlData({ data: data.data, blobUrl: '' });
      }
    } catch (err) {
      console.error('Error importing data:', err);
      setImportError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    setImportedLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        if (layer.visible) {
          mapRef.current?.removeLayer(layer.layer);
        } else {
          layer.layer.addTo(mapRef.current!);
        }
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    }));
  };

  const clearImportedLayers = () => {
    importedLayers.forEach(({ layer }) => {
      if (layer instanceof L.LayerGroup) {
        layer.clearLayers();
      }
      layer.remove();
    });
    setImportedLayers([]);
    setImportError(null);
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
      <MapSetup />
      {pendingKmlData && <KMLLayer data={pendingKmlData.data} />}
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
        
        const [lat, lng] = fixCoordinates(origLat, origLng) as [number, number];
        
        const isValid = geolib.isValidCoordinate({ 
          latitude: lat, 
          longitude: lng 
        });

        return (
          <Marker
            key={image.id}
            position={[lat, lng]}
            icon={image.id === selectedImage?.id ? highlightedCameraIcon : cameraIcon}
            eventHandlers={{
              click: () => {
                onSelectImage(image);
              }
            }}
            ref={(ref) => {
              if (ref) {
                markersRef.current[image.id] = ref;
              }
            }}
            zIndexOffset={1000} // Ensure markers are always on top
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
      {/* Top controls */}
      <div className="absolute top-4 right-4 z-[9000] flex gap-2">
        <button
          onClick={() => setShowImportModal(true)}
          className="bg-app-gray p-2 rounded-lg shadow-lg hover:bg-app-gray-light transition-colors"
          aria-label="Import locations"
        >
          <Upload className="w-5 h-5 text-app-white" />
        </button>
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

      {/* Map */}
      <div className="relative w-full h-full z-[1]">
        <MapContent />
      </div>

      {/* Layer control panel */}
      {(importedLayers.length > 0 || importError) && (
        <div className="absolute bottom-4 right-4 z-[9000] bg-app-gray p-2 rounded-lg shadow-lg min-w-[200px]">
          <div className="relative">
            {importError && (
              <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-500">
                {importError}
              </div>
            )}
            {importedLayers.map(layer => (
              <div key={layer.id} className="flex items-center gap-2 mb-2 last:mb-0">
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className={`flex items-center gap-2 text-sm ${
                    layer.visible ? 'text-app-white' : 'text-app-accent-dim'
                  } hover:text-app-accent transition-colors`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    layer.visible ? 'bg-app-accent' : 'bg-app-gray-light'
                  }`} />
                  {layer.name}
                </button>
              </div>
            ))}
            {importedLayers.length > 0 && (
              <button
                onClick={clearImportedLayers}
                className="mt-2 w-full p-1 border border-app-gray-light rounded text-sm text-app-white hover:bg-app-gray-light/30 transition-colors"
              >
                Clear All Layers
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overlays */}
      {hasNoLocationData && (
        <div className="absolute inset-0 z-[9999] bg-app-black/90 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
          <NoLocationOverlay />
        </div>
      )}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
};

export default Map;