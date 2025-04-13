import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Group } from '@visx/group';
import { Cluster } from '@visx/hierarchy';
import { LinkHorizontal } from '@visx/shape';
import { hierarchy } from 'd3-hierarchy';
import { ImageData } from '../../../types';
import { CircuitBoard, Smartphone, Image, Filter, X, ImageOff, Layers } from 'lucide-react';
import { useDeviceHierarchy } from './hooks/useDeviceHierarchy';
import { useDeviceStats } from './hooks/useDeviceStats';
import StatsSidebar from '../StatsSidebar';

interface Props {
  images: ImageData[];
  width: number;
  height: number;
  showStats?: boolean;
}

interface FilterState {
  devices: string[];
  showUnknown: boolean;
}

// Define DendrogramVisualization outside the main component
// This prevents it from being redefined on every render
const DendrogramVisualization = React.memo(({ 
  data, 
  dimensions, 
  defaultColor, 
  defaultNodeColor,
  filterKey
}: { 
  data: any, 
  dimensions: any, 
  defaultColor: string, 
  defaultNodeColor: string,
  filterKey: string
}) => {
  console.log("Rendering visualization with key:", filterKey);
  
  return (
    <svg 
      width={dimensions.width - 32}
      height={dimensions.height - 32}
      className="overflow-visible"
      style={{ transform: 'translateY(-5%)' }}
    >
      <Group top={dimensions.margin.top} left={dimensions.margin.left}>
        <Cluster<typeof data>
          root={hierarchy(data)}
          size={[dimensions.innerHeight, dimensions.innerWidth]}
          separation={(a, b) => (a.parent === b.parent ? 2 : 3)}
        >
          {(cluster) => (
            <Group>
              {cluster.links().map((link, i) => (
                <LinkHorizontal
                  key={`link-${i}`}
                  data={link}
                  stroke={defaultColor}
                  strokeWidth={1}
                  strokeOpacity={0.2}
                  fill="none"
                />
              ))}
              
              {cluster.descendants().map((node, i) => (
                <Group key={`node-${i}`}>
                  <circle
                    cx={node.y}
                    cy={node.x}
                    r={node.data.image ? 8 : 4}
                    fill={node.data.image ? defaultNodeColor : defaultColor}
                    fillOpacity={0.8}
                  />
                  {node.data.name && (
                    <text
                      x={node.y + 12}
                      y={node.x + 4}
                      fontSize={12}
                      fill="#718096"
                      className="select-none"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.data.name}
                    </text>
                  )}
                </Group>
              ))}
            </Group>
          )}
        </Cluster>
      </Group>
    </svg>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if filterKey changes
  if (prevProps.filterKey !== nextProps.filterKey) {
    console.log("DendrogramVisualization will update due to filterKey change");
    return false; // Do not prevent update
  }
  return true; // Prevent update
});

// Main component
const DeviceDendrogram: React.FC<Props> = ({ images, width, height, showStats = true }) => {
  const [showStatsPanel, setShowStatsPanel] = useState(showStats);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Use a ref to track filter changes
  const filtersRef = React.useRef({
    devices: [] as string[],
    showUnknown: true
  });
  
  // Use state for the UI
  const [filters, setFilters] = useState<FilterState>({
    devices: [], // Initially empty, will be populated with all devices
    showUnknown: true
  });
  
  // Simple counter to force updates
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Force an update on this component
  const forceUpdate = useCallback(() => {
    console.log("Force update triggered");
    setUpdateTrigger(prev => prev + 1);
  }, []);
  
  // Update filters ref when filters state changes
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  // Filter images based on current filter state - use filtersRef for computation
  const filteredImages = useMemo(() => {
    console.log("Recalculating filtered images. Update trigger:", updateTrigger);
    console.log("Current filters:", filters.devices.length, "devices,", filters.showUnknown ? "showing" : "hiding", "unknown");

    // If no specific devices are selected, show all devices 
    // (this provides a better default experience)
    if (filters.devices.length === 0) {
      // Show all images, but still respect the unknown devices filter
      return images.filter(img => {
        const deviceName = img.exif.make && img.exif.model
          ? `${img.exif.make} ${img.exif.model}`.trim()
          : 'Unknown Device';
        
        if (deviceName === 'Unknown Device') {
          return filters.showUnknown;
        }
        
        // Show all known devices when no specific ones are selected
        return true;
      });
    }

    // If specific devices are selected, filter according to the selected criteria
    return images.filter(img => {
      const deviceName = img.exif.make && img.exif.model
        ? `${img.exif.make} ${img.exif.model}`.trim()
        : 'Unknown Device';
      
      // Handle unknown devices first
      if (deviceName === 'Unknown Device') {
        return filters.showUnknown;
      }
      
      // For known devices, check if they're in the selected devices list
      return filters.devices.includes(deviceName);
    });
  }, [images, filters.devices, filters.showUnknown, updateTrigger]);

  // Calculate dimensions based on stats panel visibility
  const dimensions = useMemo(() => {
    const statsWidth = showStatsPanel ? 256 : 0;
    const filterWidth = showFilterPanel ? 256 : 0;
    const availableWidth = Math.max(containerWidth || width - statsWidth - filterWidth, 100);
    
    const margin = {
      top: Math.max(40, height * 0.1),
      left: Math.max(30, availableWidth * 0.05),
      right: Math.max(120, availableWidth * 0.15),
      bottom: Math.max(40, height * 0.1)
    };

    const innerWidth = availableWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    return {
      width: availableWidth,
      height,
      margin,
      innerWidth,
      innerHeight
    };
  }, [width, height, showStatsPanel, showFilterPanel, containerWidth]);

  // Get unique devices for filter panel
  const uniqueDevices = useMemo(() => {
    const devices = new Set<string>();
    images.forEach(img => {
      if (img.exif.make && img.exif.model) {
        devices.add(`${img.exif.make} ${img.exif.model}`.trim());
      }
    });
    return Array.from(devices).sort();
  }, [images]);

  // Use our custom hooks with filtered images
  const data = useDeviceHierarchy(filteredImages);
  const deviceStats = useDeviceStats(filteredImages, data);

  const defaultColor = '#26A69A';
  const defaultNodeColor = '#4A90E2';

  // Update container width after stats panel transition
  useEffect(() => {
    const container = document.querySelector('.dendrogram-container');
    if (container) {
      const updateWidth = () => {
        const newWidth = container.getBoundingClientRect().width;
        setContainerWidth(newWidth);
      };

      updateWidth();
      const timer = setTimeout(updateWidth, 300);

      return () => clearTimeout(timer);
    }
  }, [showStatsPanel, showFilterPanel]);

  // Whether any filters are active
  const hasActiveFilters = filters.devices.length > 0 || !filters.showUnknown;
  
  // Whether the user has deselected everything (no devices selected and unknown hidden)
  const hasNothingSelected = filters.devices.length === 0 && !filters.showUnknown;

  // Whether no specific devices are selected (but "Show All Devices" might be checked)
  const noSpecificDevicesSelected = filters.devices.length === 0;

  // Create a stable filter key that changes reliably when filter criteria change
  const filterKey = useMemo(() => {
    // Generate hash based on active filters 
    const devicesKey = filters.devices.sort().join(',');
    const unknownKey = filters.showUnknown ? 'unknown-yes' : 'unknown-no';
    const imageCount = filteredImages.length;
    
    return `filters-${devicesKey}-${unknownKey}-images-${imageCount}-update-${updateTrigger}`;
  }, [filters.devices, filters.showUnknown, filteredImages.length, updateTrigger]);

  // Log key changes
  useEffect(() => {
    console.log("Filter key updated:", filterKey);
  }, [filterKey]);

  // Stable callbacks for filter changes
  const toggleDeviceFilter = useCallback((device: string, checked: boolean) => {
    console.log('Toggling device filter:', device, checked);
    
    setFilters(currentFilters => {
      // Create a new array to ensure reference change
      const newDevices = [...currentFilters.devices];
      
      if (checked) {
        // Add device if not already present
        if (!newDevices.includes(device)) {
          newDevices.push(device);
        }
      } else {
        // Remove device
        const index = newDevices.indexOf(device);
        if (index !== -1) {
          newDevices.splice(index, 1);
        }
      }
      
      // Only update if there's an actual change
      if (currentFilters.devices.length !== newDevices.length || 
          currentFilters.devices.some((d, i) => d !== newDevices[i])) {
        return {
          ...currentFilters,
          devices: newDevices
        };
      }
      
      // No change needed
      return currentFilters;
    });
    
    // Always force a re-render after a small delay to ensure state is updated
    setTimeout(forceUpdate, 0);
  }, [forceUpdate]);
  
  // Toggle unknown devices filter
  const toggleUnknownDevices = useCallback((checked: boolean) => {
    console.log('Toggling unknown devices:', checked);
    
    setFilters(currentFilters => {
      if (currentFilters.showUnknown === checked) {
        return currentFilters; // No change needed
      }
      
      return {
        ...currentFilters,
        showUnknown: checked
      };
    });
    
    // Always force a re-render after a small delay to ensure state is updated
    setTimeout(forceUpdate, 0);
  }, [forceUpdate]);
  
  // Toggle all devices
  const toggleAllDevices = useCallback((selectAll: boolean) => {
    console.log('Toggling all devices:', selectAll ? 'select all' : 'deselect all');
    
    setFilters(currentFilters => {
      // Note: This only affects the "devices" filter list, not the "showUnknown" setting
      const newDevices = selectAll ? [...uniqueDevices] : [];
      
      // Only update if there's an actual change
      if (currentFilters.devices.length !== newDevices.length || 
          currentFilters.devices.some((d, i) => d !== newDevices[i])) {
        return {
          ...currentFilters,
          devices: newDevices
          // showUnknown remains unchanged
        };
      }
      
      // No change needed
      return currentFilters;
    });
    
    // Always force a re-render after a small delay to ensure state is updated
    setTimeout(forceUpdate, 0);
  }, [uniqueDevices, forceUpdate]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    console.log('Clearing all filters');
    
    setFilters({
      devices: [],
      showUnknown: true
    });
    
    // Always force a re-render after a small delay to ensure state is updated
    setTimeout(forceUpdate, 0);
  }, [forceUpdate]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Stats Sidebar */}
      <StatsSidebar isOpen={showStatsPanel} onToggle={() => setShowStatsPanel(!showStatsPanel)}>
        <div className="p-4">
          <h3 className="text-lg font-medium text-app-white mb-4">Device Stats</h3>
          <div className="space-y-4">
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CircuitBoard className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
                <div className="text-xs text-app-accent-dim">Unique Devices</div>
              </div>
              <div className="text-lg font-semibold text-app-white">
                {deviceStats.uniqueDeviceCount}
              </div>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
                <div className="text-xs text-app-accent-dim">Most Common</div>
              </div>
              <div className="text-sm font-semibold text-app-white">
                {deviceStats.mostCommonDevice || 'None'}
              </div>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
                <div className="text-xs text-app-accent-dim">Total Images</div>
              </div>
              <div className="text-lg font-semibold text-app-white">
                {deviceStats.totalImages}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="glass-panel p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
                  <div className="text-xs text-app-accent-dim">Active Filters</div>
                </div>
                <div className="text-sm font-semibold text-app-white">
                  {filteredImages.length} of {images.length} images
                </div>
              </div>
            )}
          </div>
        </div>
      </StatsSidebar>

      {/* Filter Panel */}
      <div 
        className={`fixed top-0 right-0 w-64 h-full filter-panel transform transition-transform duration-300 z-30 ${
          showFilterPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="filter-panel-header p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white">Filters</h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-1.5 rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <X className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
              </button>
            </div>

            {/* Filter Stats */}
            <div className="filter-stats p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Images</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{filteredImages.length} / {images.length}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Unknown Device Filter */}
              <div className="glass-panel p-3 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showUnknown}
                    onChange={(e) => toggleUnknownDevices(e.target.checked)}
                    className="filter-checkbox"
                  />
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
                    <span className="text-sm text-gray-800 dark:text-white">Show All Devices</span>
                  </div>
                </label>
                {filters.devices.length === 0 && filters.showUnknown && uniqueDevices.length > 0 && (
                  <div className="mt-2 text-xs text-app-accent-dim">
                    Showing all devices. <span className="text-app-accent">Select specific devices below to filter results.</span>
                  </div>
                )}
              </div>

              {/* Device Filters */}
              <div className="glass-panel p-3 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-app-accent dark:text-app-accent-bright" />
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      Devices
                      {filters.devices.length > 0 && (
                        <span className="ml-1 text-xs text-app-accent dark:text-app-accent-bright">
                          ({filters.devices.length}/{uniqueDevices.length})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleAllDevices(true)}
                      className="text-xs text-app-accent dark:text-app-accent-bright hover:underline"
                      title="Select all devices"
                    >
                      All
                    </button>
                    <span className="text-gray-400 dark:text-gray-500">|</span>
                    <button 
                      onClick={() => toggleAllDevices(false)}
                      className="text-xs text-app-accent dark:text-app-accent-bright hover:underline"
                      title="Deselect all devices"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {uniqueDevices.map(device => (
                    <label key={device} className="flex items-center gap-3 cursor-pointer filter-item p-1.5 rounded-md">
                      <input
                        type="checkbox"
                        checked={filters.devices.includes(device)}
                        onChange={(e) => toggleDeviceFilter(device, e.target.checked)}
                        className="filter-checkbox"
                      />
                      <span className="text-sm text-gray-800 dark:text-white">{device}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="filter-panel-footer p-4">
            {hasNothingSelected ? (
              <button
                onClick={clearFilters}
                className="w-full p-2 rounded-md bg-gray-200 dark:bg-black hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors text-sm font-medium text-gray-800 dark:text-white"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="w-full p-2 rounded-md bg-gray-200 dark:bg-black hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors text-sm font-medium text-gray-800 dark:text-white"
                disabled={!hasActiveFilters}
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`dendrogram-container h-full transition-all duration-300 overflow-hidden ${showStatsPanel ? 'pr-64' : ''} ${showFilterPanel ? 'pr-64' : ''}`}>
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors flex items-center gap-2 z-20 
            ${
              hasActiveFilters 
                ? 'glass-panel border border-app-accent/50' 
                : 'glass-panel'
            }
          `}
        >
          <Filter className={`w-4 h-4 ${
            hasNothingSelected || noSpecificDevicesSelected 
              ? 'text-app-accent'
              : hasActiveFilters 
                ? 'text-app-accent' 
                : 'text-app-accent-dim'
          }`} />
          <span className="text-sm font-medium text-app-white">
            Filter
          </span>
          {hasActiveFilters && !hasNothingSelected && (
            <span className="px-1.5 py-0.5 text-xs rounded-full font-medium bg-app-accent text-app-black">
              {filteredImages.length}
            </span>
          )}
        </button>

        <div className="w-full h-full flex items-center justify-center">
          {filteredImages.length === 0 ? (
            <div className="text-center p-8 max-w-md">
              <Filter className="w-12 h-12 text-gray-700 dark:text-white mx-auto mb-4 opacity-70" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                {hasNothingSelected ? 
                  "No device types selected" : 
                  "No images match your filters"
                }
              </h3>
              <p className="text-sm text-gray-700 dark:text-white mb-4">
                {hasNothingSelected ? (
                  "Please select at least one device type or enable unknown devices to see images."
                ) : !filters.showUnknown && filters.devices.length === 0 ? (
                  "You've hidden unknown devices and no known devices were found in your images."
                ) : filters.devices.length > 0 && !filters.showUnknown ? (
                  "No images from selected devices found. Try enabling 'Show All Devices' as well."
                ) : filters.devices.length === 0 && filters.showUnknown ? (
                  "No devices found in your images. Try uploading images with device metadata."
                ) : (
                  "Try adjusting your filters or resetting them to see all images."
                )}
              </p>
              <div className="flex gap-2 justify-center">
                {hasNothingSelected ? (
                  <>
                    <button
                      onClick={() => toggleAllDevices(true)}
                      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-black hover:bg-gray-300 dark:hover:bg-gray-900 text-gray-800 dark:text-white font-medium transition-colors"
                    >
                      Select All Devices
                    </button>
                    <button
                      onClick={() => toggleUnknownDevices(true)}
                      className="px-4 py-2 rounded-md bg-gray-600 dark:bg-black hover:bg-gray-700 dark:hover:bg-gray-900 text-white dark:text-white font-medium transition-colors"
                    >
                      Show All Devices
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-black hover:bg-gray-300 dark:hover:bg-gray-900 text-gray-800 dark:text-white font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                    {!filters.showUnknown && (
                      <button
                        onClick={() => toggleUnknownDevices(true)}
                        className="px-4 py-2 rounded-md bg-gray-600 dark:bg-black hover:bg-gray-700 dark:hover:bg-gray-900 text-white dark:text-white font-medium transition-colors"
                      >
                        Show All Devices
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : hasNothingSelected ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-8 max-w-md glass-panel rounded-lg">
                <Smartphone className="w-16 h-16 text-app-accent mx-auto mb-4" />
                <h3 className="text-xl font-medium text-app-white mb-2">
                  No Devices Selected
                </h3>
                <p className="text-sm text-app-accent-dim mb-6">
                  Please select "Show All Devices" or specific device types in the filter panel to view the pattern analysis visualization.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => toggleUnknownDevices(true)}
                    className="px-4 py-2 rounded-md bg-app-accent text-app-black font-medium transition-colors hover:bg-app-accent-dim"
                  >
                    Show All Devices
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(true)}
                    className="px-4 py-2 rounded-md bg-app-gray-light hover:bg-app-gray-lighter text-app-white font-medium transition-colors"
                  >
                    Open Filters
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <React.Fragment key={filterKey}>
              <DendrogramVisualization
                data={data}
                dimensions={dimensions}
                defaultColor={defaultColor}
                defaultNodeColor={defaultNodeColor}
                filterKey={filterKey}
              />
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
};

DeviceDendrogram.defaultProps = {
  showStats: true
};

export default DeviceDendrogram; 