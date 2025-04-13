import React, { useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { scaleTime } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Tooltip, defaultStyles } from '@visx/tooltip';
import { Zoom } from '@visx/zoom';
import { Camera, MapPin, ZoomIn, ZoomOut, RotateCcw, Filter } from 'lucide-react';
import { formatDateTime } from '../../../utils/date';
import { useTimelineNodes } from './hooks/useTimelineNodes';
import type { ImageData } from '../../../types';
import StatsSidebar from '../StatsSidebar';

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
  const [visibleImages, setVisibleImages] = useState<Set<string>>(
    new Set(images.map(img => img.file.name))
  );
  
  const margin = { 
    top: 30, 
    right: 40, 
    bottom: 60, 
    left: 40 
  };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Use our custom hook to get the timeline data
  const timelineResult = useTimelineNodes(
    images.filter(img => visibleImages.has(img.file.name))
  );
  
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
    <div className="w-full h-full relative">
      {/* Main Content */}
      <div className={`h-full transition-[padding] duration-300 ${showStatsPanel ? 'pr-64' : ''}`}>
        <div className="p-4 h-full">
          <Zoom<SVGSVGElement>
            width={width}
            height={height - 32} // Adjust for padding
            scaleXMin={0.5}
            scaleXMax={4}
            scaleYMin={1}
            scaleYMax={1}
          >
            {(zoom) => (
              <div className="relative w-full h-full">
                <svg
                  width={width}
                  height={height}
                  style={{ cursor: zoom.isDragging ? 'grabbing' : 'grab' }}
                  ref={zoom.containerRef}
                >
                  <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
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
                        stroke="#4A5568"
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
                            fill="#4A90E2"
                            opacity={0.6}
                          />
                          <line
                            x1={0}
                            x2={0}
                            y1={-40}
                            y2={40}
                            stroke="#4A5568"
                            strokeWidth={1}
                            strokeOpacity={0.2}
                          />
                          <text
                            dy={i % 2 === 0 ? "-45" : "60"}
                            dx={0}
                            fontSize={9}
                            textAnchor="middle"
                            fill="#E0E0E0"
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
                        stroke="#718096"
                        tickStroke="#718096"
                        tickLabelProps={{
                          fill: '#A0AEC0',
                          fontSize: 10,
                          textAnchor: 'middle'
                        }}
                      />
                    </Group>
                  ) : (
                    <text
                      x={width / 2}
                      y={height / 2}
                      textAnchor="middle"
                      fill="#718096"
                      fontSize={14}
                    >
                      No images selected to display
                    </text>
                  )}
                </svg>

                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className="p-2 rounded-full bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors"
                    title="Filter images"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  {timeScale && nodes.length > 0 && (
                    <>
                      <button
                        onClick={() => zoom.scale({ scaleX: zoom.transformMatrix.scaleX * 1.2 })}
                        className="p-2 rounded-full bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => zoom.scale({ scaleX: zoom.transformMatrix.scaleX / 1.2 })}
                        className="p-2 rounded-full bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-5 h-5" />
                      </button>
                      <button
                        onClick={zoom.reset}
                        className="p-2 rounded-full bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors"
                        title="Reset zoom"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {showFilterPanel && (
                  <div className="absolute top-4 right-4 w-64 bg-app-gray-dark border border-app-gray-light rounded-lg shadow-lg z-20">
                    <div className="p-3 border-b border-app-gray-light">
                      <h3 className="text-sm font-medium text-app-white">Filter Images</h3>
                      <p className="text-xs text-app-accent-dim mt-1">
                        {visibleImages.size === 0 ? 'No images selected' : `${visibleImages.size} images selected`}
                      </p>
                    </div>
                    <div className="p-2 max-h-[300px] overflow-y-auto">
                      {images.map(img => (
                        <label
                          key={img.file.name}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-app-gray rounded cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={visibleImages.has(img.file.name)}
                            onChange={(e) => {
                              const newVisibleImages = new Set(visibleImages);
                              if (e.target.checked) {
                                newVisibleImages.add(img.file.name);
                              } else {
                                newVisibleImages.delete(img.file.name);
                              }
                              setVisibleImages(newVisibleImages);
                            }}
                            className="rounded border-app-gray-light"
                          />
                          <span className="text-sm text-app-white group-hover:text-app-accent truncate">{img.file.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="p-2 border-t border-app-gray-light">
                      <div className="flex justify-between gap-2">
                        <button
                          onClick={() => setVisibleImages(new Set())}
                          className="px-2 py-1 text-xs bg-app-gray hover:bg-app-gray-light text-app-white rounded"
                        >
                          Deselect All
                        </button>
                        <button
                          onClick={() => setVisibleImages(new Set(images.map(img => img.file.name)))}
                          className="px-2 py-1 text-xs bg-app-gray hover:bg-app-gray-light text-app-white rounded"
                        >
                          Select All
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tooltipData && (
                  <Tooltip
                    style={{
                      ...defaultStyles,
                      backgroundColor: '#1A202C',
                      color: '#E2E8F0',
                      border: '1px solid #2D3748',
                    }}
                    top={margin.top + tooltipData.y - 120}
                    left={margin.left + tooltipData.x * zoom.transformMatrix.scaleX + zoom.transformMatrix.translateX}
                  >
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-4 h-4 text-app-accent" />
                        <span className="font-medium">{tooltipData.image.file.name}</span>
                      </div>
                      <div className="text-sm text-app-accent-dim mb-1">
                        {tooltipData.image.exif.dateTimeOriginal && formatDateTime(tooltipData.image.exif.dateTimeOriginal)}
                      </div>
                      {tooltipData.image.exif.latitude && tooltipData.image.exif.longitude && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-app-accent" />
                          <span>
                            {tooltipData.image.exif.latitude.toFixed(6)}°, {tooltipData.image.exif.longitude.toFixed(6)}°
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
        <div className="p-4">
          <h3 className="text-lg font-medium text-app-white mb-4">Timeline Stats</h3>
          <div className="space-y-4">
            <div className="glass-panel p-3 rounded-lg">
              <div className="text-xs text-app-accent-dim">Images</div>
              <div className="text-lg font-semibold text-app-white">{timeStats.total}</div>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="text-xs text-app-accent-dim">Earliest</div>
              <div className="text-sm font-semibold text-app-white">
                {timeStats.earliestDate ? formatDateTime(timeStats.earliestDate.toISOString()) : '-'}
              </div>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="text-xs text-app-accent-dim">Latest</div>
              <div className="text-sm font-semibold text-app-white">
                {timeStats.latestDate ? formatDateTime(timeStats.latestDate.toISOString()) : '-'}
              </div>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="text-xs text-app-accent-dim">Time Span</div>
              <div className="text-sm font-semibold text-app-white">{timeStats.timeSpan || '-'}</div>
            </div>
          </div>
        </div>
      </StatsSidebar>
    </div>
  );
};

TimelineAnalysis.defaultProps = {
  showStats: true
};

export default TimelineAnalysis; 