import React, { useMemo, useState } from 'react';
import { ImageData } from '../../types';
import { MapPin, AlertTriangle, Filter, Info, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/date';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  images: ImageData[];
}

interface LocationCluster {
  latitude: number;
  longitude: number;
  count: number;
  images: ImageData[];
  timeRange: {
    earliest: Date;
    latest: Date;
  };
}

interface LocationStats {
  totalWithLocation: number;
  uniqueLocations: number;
  clusters: LocationCluster[];
  timeSpan: {
    start: Date | null;
    end: Date | null;
  };
}

const CLUSTER_RADIUS_KM = 1; // Images within 1km are considered in the same cluster
const KM_TO_DEG = 1 / 111; // Rough conversion from kilometers to degrees

const GeographicalAnalysis: React.FC<Props> = ({ images }) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[Date | null, Date | null]>([null, null]);

  // Process location data and create clusters
  const locationStats = useMemo<LocationStats>(() => {
    const imagesWithLocation = images.filter(
      img => img.exif.latitude != null && img.exif.longitude != null
    );

    const clusters: LocationCluster[] = [];
    const processedCoords = new Set<string>();

    imagesWithLocation.forEach(img => {
      const lat = img.exif.latitude!;
      const lng = img.exif.longitude!;
      const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

      if (processedCoords.has(coordKey)) return;
      processedCoords.add(coordKey);

      // Find nearby images
      const nearbyImages = imagesWithLocation.filter(other => {
        if (!other.exif.latitude || !other.exif.longitude) return false;
        const dlat = Math.abs(other.exif.latitude - lat);
        const dlng = Math.abs(other.exif.longitude - lng);
        return dlat < CLUSTER_RADIUS_KM * KM_TO_DEG && dlng < CLUSTER_RADIUS_KM * KM_TO_DEG;
      });

      if (nearbyImages.length > 0) {
        // Calculate time range for the cluster
        const dates = nearbyImages
          .map(img => img.exif.dateTimeOriginal)
          .filter((date): date is string => date !== null)
          .map(date => new Date(date));

        const timeRange = {
          earliest: dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
          latest: dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
        };

        clusters.push({
          latitude: lat,
          longitude: lng,
          count: nearbyImages.length,
          images: nearbyImages,
          timeRange
        });
      }
    });

    // Calculate overall time span
    const allDates = imagesWithLocation
      .map(img => img.exif.dateTimeOriginal)
      .filter((date): date is string => date !== null)
      .map(date => new Date(date));

    const timeSpan = {
      start: allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : null,
      end: allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null
    };

    return {
      totalWithLocation: imagesWithLocation.length,
      uniqueLocations: clusters.length,
      clusters,
      timeSpan
    };
  }, [images]);

  // Filter clusters based on time range
  const filteredClusters = useMemo(() => {
    if (!selectedTimeRange[0] || !selectedTimeRange[1]) return locationStats.clusters;

    return locationStats.clusters.filter(cluster => {
      const clusterStart = cluster.timeRange.earliest;
      const clusterEnd = cluster.timeRange.latest;
      return clusterStart >= selectedTimeRange[0]! && clusterEnd <= selectedTimeRange[1]!;
    });
  }, [locationStats.clusters, selectedTimeRange]);

  // Calculate map bounds
  const mapBounds = useMemo(() => {
    if (filteredClusters.length === 0) return null;

    const lats = filteredClusters.map(c => c.latitude);
    const lngs = filteredClusters.map(c => c.longitude);
    return [
      [Math.min(...lats) - 0.1, Math.min(...lngs) - 0.1],
      [Math.max(...lats) + 0.1, Math.max(...lngs) + 0.1]
    ] as [[number, number], [number, number]];
  }, [filteredClusters]);

  return (
    <div className="w-full h-full relative p-4">
      {/* Stats Overview */}
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
              <CircleMarker
                key={index}
                center={[cluster.latitude, cluster.longitude]}
                radius={Math.min(20, Math.max(8, Math.sqrt(cluster.count) * 5))}
                fillColor="#4A90E2"
                color="#2171C7"
                weight={2}
                opacity={0.8}
                fillOpacity={0.4}
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
              </CircleMarker>
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

export default GeographicalAnalysis; 