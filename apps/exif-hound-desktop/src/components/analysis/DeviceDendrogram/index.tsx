import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Group } from '@visx/group';
import { Cluster } from '@visx/hierarchy';
import { LinkHorizontal } from '@visx/shape';
import { hierarchy } from 'd3-hierarchy';
import { ImageData } from '../../../types';
import { CircuitBoard, Smartphone, Image, Filter } from 'lucide-react';
import { TreeNode, useDeviceHierarchy } from './hooks/useDeviceHierarchy';
import { useDeviceStats } from './hooks/useDeviceStats';
import StatsSidebar from '../StatsSidebar';
import FilterPanel from '../../common/FilterPanel';

interface Props {
  images: ImageData[];
  width: number;
  height: number;
  showStats?: boolean;
}


interface Dimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  innerWidth: number;
  innerHeight: number;
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
  data: TreeNode, 
  dimensions: Dimensions, 
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
  
  // Convert filter state to use the reusable filter panel format
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({
    devices: new Set<string>(),
    showUnknownToggle: new Set<string>(["enabled"])
  });
  
  // Simple counter to force updates
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Force an update on this component
  const forceUpdate = useCallback(() => {
    console.log("Force update triggered");
    setUpdateTrigger(prev => prev + 1);
  }, []);
  
  // Get the filter state from the selectedFilters format
  const filters = useMemo(() => ({
    devices: Array.from(selectedFilters.devices || new Set<string>()),
    showUnknown: (selectedFilters.showUnknownToggle || new Set<string>()).has("enabled")
  }), [selectedFilters]);
  
  // Filter images based on current filter state
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

  // Handle device filter changes from the reusable filter panel
  const handleFilterChange = useCallback((groupId: string, selectedOptions: Set<string>) => {
    console.log('Filter change for group:', groupId, 'Selected options:', selectedOptions);
    
    setSelectedFilters(prev => ({
      ...prev,
      [groupId]: selectedOptions
    }));
    
    // Always force a re-render after a small delay to ensure state is updated
    setTimeout(forceUpdate, 0);
  }, [forceUpdate]);
  
  // Clear all filters
  const handleResetAll = useCallback(() => {
    console.log('Clearing all filters');
    
    setSelectedFilters({
      devices: new Set<string>(),
      showUnknownToggle: new Set<string>(["enabled"])
    });
    
    // Always force a re-render after a small delay to ensure state is updated
    setTimeout(forceUpdate, 0);
  }, [forceUpdate]);

  // Create filter configuration for the reusable filter panel
  const filterGroups = useMemo(() => [
    {
      id: 'devices',
      title: 'Devices',
      icon: <Smartphone className="w-4 h-4" />,
      showCount: true,
      options: uniqueDevices.map(device => ({
        id: device,
        label: device
      }))
    }
  ], [uniqueDevices]);

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

      {/* Filter Panel using the reusable component */}
      {showFilterPanel && (
        <FilterPanel
          title="Filters"
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetAll={handleResetAll}
          onClose={() => setShowFilterPanel(false)}
          className="absolute top-0 right-0 h-full"
          style={{ width: "16rem" }}
          totalCount={{
            current: filteredImages.length,
            total: images.length
          }}
          showAllToggle={{
            isChecked: filters.showUnknown,
            onChange: (checked) => {
              // Update the showUnknownToggle filter
              handleFilterChange('showUnknownToggle', checked ? new Set(["enabled"]) : new Set())
            },
            label: "Show All Devices",
            description: filters.showUnknown 
              ? "Showing all devices. Select specific devices below to filter results." 
              : "Check to include unknown devices in results."
          }}
        />
      )}

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
                      onClick={() => handleFilterChange('devices', new Set(uniqueDevices))}
                      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-black hover:bg-gray-300 dark:hover:bg-gray-900 text-gray-800 dark:text-white font-medium transition-colors"
                    >
                      Select All Devices
                    </button>
                    <button
                      onClick={() => handleFilterChange('showUnknownToggle', new Set(["enabled"]))}
                      className="px-4 py-2 rounded-md bg-gray-600 dark:bg-black hover:bg-gray-700 dark:hover:bg-gray-900 text-white dark:text-white font-medium transition-colors"
                    >
                      Show All Devices
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleResetAll}
                      className="px-4 py-2 rounded-md bg-gray-200 dark:bg-black hover:bg-gray-300 dark:hover:bg-gray-900 text-gray-800 dark:text-white font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                    {!filters.showUnknown && (
                      <button
                        onClick={() => handleFilterChange('showUnknownToggle', new Set(["enabled"]))}
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
                    onClick={() => handleFilterChange('showUnknownToggle', new Set(["enabled"]))}
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

export default DeviceDendrogram; 