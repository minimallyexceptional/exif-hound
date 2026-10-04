import React, { useState, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { Search, Map, Calendar, Database, ArrowLeft, Maximize2, Minimize2, ChevronRight, Images } from 'lucide-react';
import DeviceDendrogram from './analysis/DeviceDendrogram';
import TimelineAnalysis from './analysis/TimelineAnalysis';
import SoftwareProcessingAnalysis from './analysis/SoftwareProcessingAnalysis';
import GeographicalAnalysis from './analysis/GeographicalAnalysis';

interface Props {
  images: ImageData[];
}

type AnalysisTool = 'pattern' | 'geolocation' | 'timeline' | 'software' | null;

interface ToolDefinition {
  id: AnalysisTool;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const Investigation: React.FC<Props> = ({ images }) => {
  const [selectedTool, setSelectedTool] = useState<AnalysisTool>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  // Only real images with capture dates feed the temporal tools; the
  // dataset is never augmented with synthetic entries.
  const imagesWithDates = images.filter(img => img.exif.dateTimeOriginal);

  // Define all tools with consistent structure
  const tools: ToolDefinition[] = [
    {
      id: 'pattern',
      name: 'Pattern Analysis',
      icon: <Search className="w-5 h-5" />,
      description: 'Identify patterns and connections across image metadata'
    },
    {
      id: 'geolocation',
      name: 'Geolocation Analysis',
      icon: <Map className="w-5 h-5" />,
      description: 'Map and analyze geographical data from images'
    },
    {
      id: 'timeline',
      name: 'Timeline Analysis',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Visualize temporal relationships between images'
    },
    {
      id: 'software',
      name: 'Software Processing',
      icon: <Database className="w-5 h-5" />,
      description: 'Analyze software editing patterns and metadata anomalies'
    }
  ];

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight - (selectedTool ? 40 : 150) // Less chrome when tool active
        });
      }
    };

    updateDimensions();

    // Coalesce resize bursts into a single measurement per animation frame
    let rafId = 0;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateDimensions);
    };

    window.addEventListener('resize', handleResize);

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [selectedTool, fullscreen]);

  const renderAnalysis = () => {
    if (!selectedTool) return null;

    // Common props for all analysis tools
    const commonProps = {
      images: imagesWithDates,
      width: dimensions.width,
      height: dimensions.height,
    };

    switch (selectedTool) {
      case 'pattern':
        return <DeviceDendrogram {...commonProps} />;
      case 'timeline':
        return <TimelineAnalysis {...commonProps} />;
      case 'software':
        return <SoftwareProcessingAnalysis images={imagesWithDates} />;
      case 'geolocation':
        return <GeographicalAnalysis images={imagesWithDates} />;
      default:
        return null;
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  const activeTool = selectedTool ? tools.find(t => t.id === selectedTool) : null;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full overflow-hidden ${
        fullscreen ? 'fixed inset-0 z-50 bg-app-black' : ''
      }`}
    >
      {!selectedTool ? (
        // Tool selection view
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-app-white">Investigation Dashboard</h2>
              <p className="text-app-accent-dim text-sm mt-1">
                Analyze and correlate data from your images
              </p>
            </div>
            <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full shrink-0">
              <Images className="w-4 h-4 text-app-accent" />
              <span className="text-sm font-medium text-app-white tabular-nums">
                {images.length} image{images.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tools.map(tool => (
              <button
                key={tool.id}
                className="glass-panel group p-4 rounded-lg text-left transition-all duration-200 hover:bg-app-gray-light hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent disabled:opacity-40 disabled:pointer-events-none"
                onClick={() => setSelectedTool(tool.id)}
                aria-label={`Open ${tool.name}`}
                disabled={images.length === 0}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-app-accent">
                    {tool.icon}
                    <h3 className="text-base font-medium text-app-white">{tool.name}</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-app-accent-dim transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-app-accent" />
                </div>
                <p className="text-xs text-app-accent-dim leading-relaxed">{tool.description}</p>
              </button>
            ))}
          </div>

          {images.length === 0 && (
            <div className="glass-panel mt-6 p-8 rounded-lg text-center">
              <Images className="w-10 h-10 text-app-accent-dim mx-auto mb-3" />
              <h3 className="text-base font-medium text-app-white mb-1">No images loaded</h3>
              <p className="text-sm text-app-accent-dim">
                Upload images to begin your investigation
              </p>
            </div>
          )}
        </div>
      ) : (
        // Tool view with minimal chrome
        <div className="flex flex-col h-full">
          {/* Compact header */}
          <div className="flex items-center justify-between gap-3 border-b border-app-gray-light/20 py-2 px-4 bg-app-dark/60">
            <button
              className="flex items-center gap-2 text-app-accent hover:text-app-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded px-1"
              onClick={() => setSelectedTool(null)}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-base font-medium text-app-white truncate">
              {activeTool?.name}
            </h2>
            <button
              className="p-1.5 rounded text-app-accent hover:text-app-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={fullscreen}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Tool container - full remaining height without padding */}
          <div className="flex-1 overflow-auto">
            {renderAnalysis()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Investigation;
