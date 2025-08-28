import React, { useState, useEffect, useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleTime } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Tooltip, defaultStyles } from '@visx/tooltip';
import { Zoom } from '@visx/zoom';
import { Camera, MapPin, Filter } from 'lucide-react';
import { formatDateTime } from '../../../utils/date';
import { useTimelineNodes } from './hooks/useTimelineNodes';
import type { ImageData } from '../../../types';
import StatsSidebar from '../StatsSidebar';
import FilterPanel from '../../common/FilterPanel';
 interface Props {
  images: ImageData[];
  width: number;
  height: number;
  showStats?: boolean;
}

interface TooltipNode {
  image: ImageData;
  date: Date;
  x: number;
  y: number;
}

const TimelineAnalysis: React.FC<Props> = ({ images, width, height, showStats = true }) => {
  console.log('TimelineAnalysis rendering with props:', { 
    imageCount: images.length, 
    width, 
    height, 
    showStats 
  });
  
  useEffect(() => {
    console.log('Images data:', images);
  }, [images]);
  
  const [tooltipData, setTooltipData] = useState<TooltipNode | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(showStats);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({
    images: new Set(images.map(img => img.file.name))
  });
  
  // Use the set of selected images as a filter
  const filteredImages = useMemo(() => {
    const selectedImageIds = selectedFilters.images || new Set();
    return images.filter(img => selectedImageIds.has(img.file.name));
  }, [images, selectedFilters.images]);
  
  // Create filter configuration
  const filterGroups = useMemo(() => [
    {
      id: 'images',
      title: 'Images',
      icon: <Camera className="w-4 h-4" />,
      showCount: true,
      options: images.map(img => ({
        id: img.file.name,
        label: img.file.name
      }))
    }
  ], [images]);
  
  // Handle filter changes
  const handleFilterChange = (groupId: string, selectedOptions: Set<string>) => {
    setSelectedFilters(prev => ({
      ...prev,
      [groupId]: selectedOptions
    }));
  };
  
  // Handle reset all filters
  const handleResetAll = () => {
    setSelectedFilters({
      images: new Set(images.map(img => img.file.name))
    });
  };

  const margin = { 
    top: 30, 
    right: 40, 
    bottom: 60, 
    left: 40 
  };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Use our custom hook to get the timeline data with filtered images
  const timelineResult = useTimelineNodes(filteredImages);
  
  console.log('TimelineResult:', timelineResult);

  const timeStats = {
    total: timelineResult.totalImagesWithDate,
    earliestDate: timelineResult.startDate,
    latestDate: timelineResult.endDate,
    timeSpan: timelineResult.timespan ? 
      `${timelineResult.timespan}d` : 
      null
  };

  const timeScale = timelineResult.nodes.length > 0 && timelineResult.startDate && timelineResult.endDate 
    ? scaleTime({
        domain: [timelineResult.startDate, timelineResult.endDate],
        range: [0, innerWidth],
        nice: true
      })
    : null;

  const nodeRadius = 6;
  const nodes: TooltipNode[] = timelineResult.nodes.map((node) => ({
    image: node.images[0], // Use the first image from each node
    date: node.date,
    x: timeScale ? timeScale(node.date) : 0,
    y: innerHeight / 2
  }));

  console.log('Nodes prepared for rendering:', nodes);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Main Content */}
      <div className={`h-full transition-[padding] duration-300 ${showStatsPanel ? 'pr-64' : ''} ${showFilterPanel ? 'pr-64' : ''} overflow-hidden`}>
        <div className="p-4 h-full overflow-hidden">
          {/* Controls */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-app-white">Timeline Analysis</h3>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="p-2 rounded-lg bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter Images</span>
            </button>
          </div>

          <Zoom<SVGSVGElement>
            width={width}
            height={height - 80} // Adjust for padding and controls
            scaleXMin={0.5}
            scaleXMax={4}
            scaleYMin={1}
            scaleYMax={1}
          >
            {(zoom) => (
              <div className="relative w-full h-full overflow-hidden">
                <svg
                  width={width}
                  height={height - 80}
                  style={{ cursor: zoom.isDragging ? 'grabbing' : 'grab' }}
                  ref={zoom.containerRef}
                >
                  <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height - 80}
                    fill="transparent"
                    onTouchStart={zoom.dragStart}
                    onTouchMove={zoom.dragMove}
                    onTouchEnd={zoom.dragEnd}
                    onMouseDown={zoom.dragStart}
                    onMouseMove={zoom.dragMove}
                    onMouseUp={zoom.dragEnd}
                    onMouseLeave={() => {
                      if (zoom.isDragging) zoom.dragEnd();
                    }}
                  />
                  {timeScale && nodes.length > 0 ? (
                    <Group
                      transform={zoom.toString()}
                      top={margin.top}
                      left={margin.left}
                    >
                      <line
                        x1={0}
                        x2={innerWidth}
                        y1={innerHeight / 2}
                        y2={innerHeight / 2}
                        stroke="var(--app-gray-light)"
                        strokeWidth={2}
                        strokeOpacity={0.3}
                      />

                      {nodes.map((node, i) => (
                        <Group
                          key={`node-${i}`}
                          top={node.y}
                          left={node.x}
                          onMouseEnter={() => setTooltipData(node)}
                          onMouseLeave={() => setTooltipData(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          <circle
                            r={nodeRadius}
                            fill="var(--app-accent)"
                            opacity={0.6}
                          />
                          <line
                            x1={0}
                            x2={0}
                            y1={-40}
                            y2={40}
                            stroke="var(--app-gray-light)"
                            strokeWidth={1}
                            strokeOpacity={0.2}
                          />
                          <text
                            dy={i % 2 === 0 ? "-45" : "60"}
                            dx={0}
                            fontSize={9}
                            textAnchor="middle"
                            fill="var(--app-white)"
                            style={{
                              pointerEvents: 'none',
                              userSelect: 'none'
                            }}
                          >
                            {node.image.file.name}
                          </text>
                        </Group>
                      ))}

                      <AxisBottom
                        top={innerHeight}
                        scale={timeScale}
                        stroke="var(--app-gray-light)"
                        tickStroke="var(--app-gray-light)"
                        tickLabelProps={{
                          fill: 'var(--app-accent-dim)',
                          fontSize: 10,
                          textAnchor: 'middle'
                        }}
                      />
                    </Group>
                  ) : (
                    <foreignObject 
                      x={0} 
                      y={0} 
                      width={width} 
                      height={height - 80}
                    >
                      <div className="h-full w-full flex items-center justify-center">
                        <div className="glass-panel rounded-lg p-8 max-w-md text-center">
                          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4 border-2 border-app-accent rounded-lg">
                            <Camera className="w-8 h-8 text-app-white" />
                          </div>
                          
                          <h2 className="text-xl font-semibold text-app-white mb-2">
                            No Images Selected
                          </h2>
                          
                          <p className="text-app-accent-dim mb-6">
                            Please select "Show All Images" or specific image files in the
                            filter panel to view the timeline analysis visualization.
                          </p>
                          
                          <div className="flex gap-4 justify-center">
                            <button
                              onClick={() => handleFilterChange('images', new Set(images.map(img => img.file.name)))}
                              className="py-2 px-4 bg-app-accent text-app-black font-medium rounded-lg hover:bg-app-accent/90 transition-colors"
                            >
                              Show All Images
                            </button>
                            
                            <button
                              onClick={() => setShowFilterPanel(true)}
                              className="py-2 px-4 bg-app-gray-light/30 text-app-white font-medium rounded-lg hover:bg-app-gray-light/50 transition-colors"
                            >
                              Open Filters
                            </button>
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </svg>

                {tooltipData && (
                  <Tooltip
                    top={tooltipData.y + margin.top - 10}
                    left={tooltipData.x + margin.left + 10}
                    style={{
                      ...defaultStyles,
                      background: "var(--app-gray-dark)",
                      border: "1px solid var(--app-gray-light)",
                      color: "var(--app-white)",
                      fontSize: 12
                    }}
                  >
                    <div className="p-1">
                      <div className="font-medium">{tooltipData.image.file.name}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-app-accent" />
                        <span>{formatDateTime(tooltipData.image.exif.dateTimeOriginal || "")}</span>
                      </div>
                      {tooltipData.image.exif.latitude && tooltipData.image.exif.longitude && (
                        <div className="mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-app-accent" />
                          <span>
                            {tooltipData.image.exif.latitude.toFixed(4)},
                            {tooltipData.image.exif.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                )}
              </div>
            )}
          </Zoom>
        </div>
      </div>

      {/* Stats Sidebar */}
      <StatsSidebar isOpen={showStatsPanel} onToggle={() => setShowStatsPanel(!showStatsPanel)}>
        <div className="p-4 overflow-hidden">
          <h3 className="text-lg font-medium text-app-white mb-4">Timeline Stats</h3>
          <div className="space-y-4">
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Images with Dates</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{timeStats.total}</p>
            </div>
            {timeStats.earliestDate && (
              <div className="glass-panel p-3 rounded-lg">
                <h3 className="text-sm font-medium text-app-white mb-2">Earliest Date</h3>
                <p className="text-md font-medium text-app-white">
                  {formatDateTime(timeStats.earliestDate.toISOString())}
                </p>
              </div>
            )}
            {timeStats.latestDate && (
              <div className="glass-panel p-3 rounded-lg">
                <h3 className="text-sm font-medium text-app-white mb-2">Latest Date</h3>
                <p className="text-md font-medium text-app-white">
                  {formatDateTime(timeStats.latestDate.toISOString())}
                </p>
              </div>
            )}
            {timeStats.timeSpan && (
              <div className="glass-panel p-3 rounded-lg">
                <h3 className="text-sm font-medium text-app-white mb-2">Time Span</h3>
                <p className="text-md font-medium text-app-white">{timeStats.timeSpan}</p>
              </div>
            )}
          </div>
        </div>
      </StatsSidebar>

      {/* Filter Panel */}
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
            current: selectedFilters.images?.size || 0,
            total: images.length
          }}
          showAllToggle={{
            isChecked: selectedFilters.images?.size === images.length,
            onChange: (checked) => {
              if (checked) {
                handleFilterChange('images', new Set(images.map(img => img.file.name)));
              } else {
                handleFilterChange('images', new Set());
              }
            },
            label: "Show All Images",
            description: selectedFilters.images?.size === images.length 
              ? "Showing all images." 
              : "Select specific images below to filter results."
          }}
        />
      )}
    </div>
  );
};

export default TimelineAnalysis; 