import React, { useState } from 'react';
import { ImageData } from '../../../types';
import { MapPin, AlertTriangle, Filter, Info, Clock } from 'lucide-react';
import { formatDateTime } from '../../../utils/date';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStats } from './hooks/useLocationStats';
import { useFilteredClusters, TimeRange } from './hooks/useFilteredClusters';
import { useMapBounds } from './hooks/useMapBounds';

// Create custom camera icon
const cameraIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="black" stroke="white" stroke-width="2"/>
      <path d="M22 12h-2l-2-2h-4l-2 2h-2c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-6 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface Props {
  images: ImageData[];
  showStats?: boolean;
}

const GeographicalAnalysis: React.FC<Props> = ({ images, showStats = true }) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>([null, null]);

  // Use our custom hooks
  const locationStats = useLocationStats(images);
  const filteredClusters = useFilteredClusters(locationStats.clusters, selectedTimeRange);
  const mapBounds = useMapBounds(filteredClusters);

  return (
    <div className="w-full h-full relative p-4">
      {/* Stats Overview - Only show when showStats is true */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-app-accent" />
              <h3 className="text-sm font-medium text-app-white">Images with Location</h3>
            </div>
            <p className="text-2xl font-semibold text-app-white">{locationStats.totalWithLocation}</p>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-app-accent" />
              <h3 className="text-sm font-medium text-app-white">Unique Locations</h3>
            </div>
            <p className="text-2xl font-semibold text-app-white">{locationStats.uniqueLocations}</p>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-app-accent" />
              <h3 className="text-sm font-medium text-app-white">Time Span</h3>
            </div>
            <p className="text-sm text-app-white">
              {locationStats.timeSpan.start && locationStats.timeSpan.end ? (
                <>
                  {formatDateTime(locationStats.timeSpan.start.toISOString())}
                  <br />
                  to
                  <br />
                  {formatDateTime(locationStats.timeSpan.end.toISOString())}
                </>
              ) : (
                'No temporal data'
              )}
            </p>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-app-accent" />
              <h3 className="text-sm font-medium text-app-white">Missing Location</h3>
            </div>
            <p className="text-2xl font-semibold text-app-white">
              {images.length - locationStats.totalWithLocation}
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-app-white">Geographical Analysis</h3>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="p-2 rounded-lg bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filter Time Range</span>
        </button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="absolute top-4 right-4 w-64 bg-app-gray-dark border border-app-gray-light rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-app-gray-light">
            <h3 className="text-sm font-medium text-app-white">Filter by Time Range</h3>
          </div>
          <div className="p-3">
            <div className="mb-3">
              <label className="text-xs text-app-accent-dim block mb-1">Start Date</label>
              <input
                type="datetime-local"
                className="w-full bg-app-gray rounded border border-app-gray-light p-1 text-sm text-app-white"
                value={selectedTimeRange[0]?.toISOString().slice(0, 16) || ''}
                onChange={(e) => setSelectedTimeRange([new Date(e.target.value), selectedTimeRange[1]])}
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-app-accent-dim block mb-1">End Date</label>
              <input
                type="datetime-local"
                className="w-full bg-app-gray rounded border border-app-gray-light p-1 text-sm text-app-white"
                value={selectedTimeRange[1]?.toISOString().slice(0, 16) || ''}
                onChange={(e) => setSelectedTimeRange([selectedTimeRange[0], new Date(e.target.value)])}
              />
            </div>
            <button
              onClick={() => setSelectedTimeRange([null, null])}
              className="w-full p-2 bg-app-gray hover:bg-app-gray-light text-app-white rounded text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Map View */}
      <div className="glass-panel rounded-lg overflow-hidden" style={{ height: 'calc(100% - 200px)' }}>
        {mapBounds ? (
          <MapContainer
            bounds={mapBounds}
            className="w-full h-full"
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredClusters.map((cluster, index) => (
              <Marker
                key={index}
                position={[cluster.latitude, cluster.longitude]}
                icon={cameraIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-medium text-sm mb-1">Location Cluster</h4>
                    <p className="text-xs mb-1">{cluster.count} images</p>
                    <p className="text-xs mb-1">
                      {cluster.latitude.toFixed(6)}°, {cluster.longitude.toFixed(6)}°
                    </p>
                    <p className="text-xs text-gray-600">
                      Time range:<br />
                      {formatDateTime(cluster.timeRange.earliest.toISOString())} to<br />
                      {formatDateTime(cluster.timeRange.latest.toISOString())}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-app-accent-dim">No location data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

GeographicalAnalysis.defaultProps = {
  showStats: true
};

export default GeographicalAnalysis; 