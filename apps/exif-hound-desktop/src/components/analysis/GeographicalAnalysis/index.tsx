import React, { useState, useMemo, ReactNode } from 'react';
import { ImageData } from '../../../types';
import { MapPin, AlertTriangle, Filter, Info, Clock, Calendar } from 'lucide-react';
import { formatDateTime } from '../../../utils/date';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStats } from './hooks/useLocationStats';
import { useFilteredClusters, TimeRange } from './hooks/useFilteredClusters';
import { useMapBounds } from './hooks/useMapBounds';
import StatsSidebar from '../StatsSidebar';
import FilterPanel, { FilterPanelProps } from '../../common/FilterPanel';

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

// Extended FilterPanel that supports custom content
interface CustomFilterPanelProps extends Omit<FilterPanelProps, 'children'> {
  children?: ReactNode;
}

const CustomFilterPanel: React.FC<CustomFilterPanelProps> = ({ children, ...props }) => {
  return (
    <div className="flex flex-col shadow-lg z-20 h-full" style={{ 
      backgroundColor: 'var(--app-dark)',
      background: 'var(--app-dark)',
      ...props.style
    }}>
      <FilterPanel {...props} />
      {children && (
        <div className="px-4 py-3 flex-1" style={{ backgroundColor: 'var(--app-dark)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

interface Props {
  images: ImageData[];
  showStats?: boolean;
}

const GeographicalAnalysis: React.FC<Props> = ({ images, showStats = true }) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(showStats);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>([null, null]);

  // Use our custom hooks
  const locationStats = useLocationStats(images);
  const filteredClusters = useFilteredClusters(locationStats.clusters, selectedTimeRange);
  const mapBounds = useMapBounds(filteredClusters);

  // Determine if filters are active
  const hasActiveFilters = selectedTimeRange[0] !== null || selectedTimeRange[1] !== null;
  const hasNoData = filteredClusters.length === 0 && locationStats.totalWithLocation > 0;

  // Format date for inputs
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().slice(0, 16);
  };

  // Custom filter component for the date range
  const TimeRangeFilterContent = () => (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-app-accent-dim block mb-1">Start Date</label>
        <input
          type="datetime-local"
          className="w-full bg-app-gray rounded border border-app-gray-light p-2 text-sm text-app-white"
          value={formatDateForInput(selectedTimeRange[0])}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            setSelectedTimeRange([newDate, selectedTimeRange[1]]);
          }}
        />
      </div>
      
      <div>
        <label className="text-xs text-app-accent-dim block mb-1">End Date</label>
        <input
          type="datetime-local"
          className="w-full bg-app-gray rounded border border-app-gray-light p-2 text-sm text-app-white"
          value={formatDateForInput(selectedTimeRange[1])}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            setSelectedTimeRange([selectedTimeRange[0], newDate]);
          }}
        />
      </div>
    </div>
  );

  // Empty state content
  const EmptyStateContent = () => (
    <div className="text-center p-8 max-w-md glass-panel rounded-lg">
      <Calendar className="w-16 h-16 text-app-accent mx-auto mb-4" />
      <h3 className="text-xl font-medium text-app-white mb-2">
        No Locations In Time Range
      </h3>
      <p className="text-sm text-app-accent-dim mb-6">
        No images match your selected time range. Try adjusting the dates or clearing the filters.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setSelectedTimeRange([null, null])}
          className="px-4 py-2 rounded-md bg-app-accent text-app-black font-medium transition-colors hover:bg-app-accent-dim"
        >
          Clear Time Filters
        </button>
        <button
          onClick={() => setShowFilterPanel(true)}
          className="px-4 py-2 rounded-md bg-app-gray-light hover:bg-app-gray-lighter text-app-white font-medium transition-colors"
        >
          Open Filters
        </button>
      </div>
    </div>
  );

  // Handle reset all filters
  const handleResetAll = () => {
    setSelectedTimeRange([null, null]);
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Main Content */}
      <div className={`h-full transition-[padding] duration-300 ${showStatsPanel ? 'pr-64' : ''} ${showFilterPanel ? 'pr-64' : ''}`}>
        <div className="p-4 h-full flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-app-white">Geographical Analysis</h3>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 z-20 
                ${
                  hasActiveFilters 
                    ? 'glass-panel border border-app-accent/50' 
                    : 'glass-panel'
                }
              `}
            >
              <Filter className={`w-4 h-4 ${
                hasActiveFilters 
                  ? 'text-app-accent' 
                  : 'text-app-accent-dim'
              }`} />
              <span className="text-sm font-medium text-app-white">
                Filter
              </span>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 text-xs rounded-full font-medium bg-app-accent text-app-black">
                  Active
                </span>
              )}
            </button>
          </div>

          {/* Map View */}
          <div className="flex-1 bg-app-gray-dark rounded-lg overflow-hidden">
            {hasNoData ? (
              <div className="w-full h-full flex items-center justify-center">
                <EmptyStateContent />
              </div>
            ) : !mapBounds ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-8 max-w-md glass-panel rounded-lg">
                  <MapPin className="w-16 h-16 text-app-accent mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-app-white mb-2">
                    No Location Data Available
                  </h3>
                  <p className="text-sm text-app-accent-dim">
                    None of your images have geo-location metadata.
                  </p>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {/* Stats Sidebar */}
      <StatsSidebar isOpen={showStatsPanel} onToggle={() => setShowStatsPanel(!showStatsPanel)}>
        <div className="p-4">
          <h3 className="text-lg font-medium text-app-white mb-4">Location Stats</h3>
          <div className="space-y-4">
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Images with Location</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{locationStats.totalWithLocation}</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Unique Locations</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{locationStats.uniqueLocations}</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
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
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Missing Location</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">
                {images.length - locationStats.totalWithLocation}
              </p>
            </div>
            {hasActiveFilters && (
              <div className="glass-panel p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-5 h-5 text-app-accent" />
                  <h3 className="text-sm font-medium text-app-white">Time Filter</h3>
                </div>
                <p className="text-sm text-app-white">
                  {selectedTimeRange[0] && (
                    <>
                      From: {formatDateTime(selectedTimeRange[0].toISOString())}
                      <br />
                    </>
                  )}
                  {selectedTimeRange[1] && (
                    <>
                      To: {formatDateTime(selectedTimeRange[1].toISOString())}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </StatsSidebar>

      {/* Filter Panel using our custom wrapper component */}
      {showFilterPanel && (
        <div className="absolute top-0 right-0 h-full z-20" style={{ width: "16rem" }}>
          <CustomFilterPanel
            title="Time Filters"
            filterGroups={[]}
            selectedFilters={{}}
            onFilterChange={() => {}}
            onResetAll={handleResetAll}
            onClose={() => setShowFilterPanel(false)}
            className="h-full"
            totalCount={{
              current: filteredClusters.length,
              total: locationStats.totalWithLocation
            }}
            showAllToggle={{
              isChecked: !hasActiveFilters,
              onChange: (checked) => {
                if (checked) {
                  setSelectedTimeRange([null, null]);
                }
              },
              label: "Show All Time Periods",
              description: hasActiveFilters 
                ? "Filter is active. Clear to show all time periods." 
                : "Showing all time periods."
            }}
          >
            <TimeRangeFilterContent />
          </CustomFilterPanel>
        </div>
      )}
    </div>
  );
};

GeographicalAnalysis.defaultProps = {
  showStats: true
};

export default GeographicalAnalysis; 