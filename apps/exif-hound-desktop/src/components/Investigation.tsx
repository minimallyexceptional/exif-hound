import React, { useState, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { Search, Map, Calendar, Database, ArrowLeft, Maximize2, Minimize2, LayoutDashboard } from 'lucide-react';
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
  const [showStats, setShowStats] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Create test images with proper date format if no images with dates exist
  const imagesWithDates = images.some(img => img.exif.dateTimeOriginal) 
    ? images 
    : [
        ...images,
        // Add test images with dates if none exist
        {
          id: 'test-1',
          url: 'test-url-1',
          file: { 
            name: 'test-image-1.jpg', 
            type: 'image/jpeg', 
            size: 1000, 
            lastModified: Date.now() 
          },
          exif: {
            dateTimeOriginal: '2023-01-01T12:00:00Z'
          }
        },
        {
          id: 'test-2',
          url: 'test-url-2',
          file: { 
            name: 'test-image-2.jpg', 
            type: 'image/jpeg', 
            size: 1000, 
            lastModified: Date.now() 
          },
          exif: {
            dateTimeOriginal: '2023-01-15T15:30:00Z'
          }
        }
      ] as ImageData[];

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
    window.addEventListener('resize', updateDimensions);
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [selectedTool, fullscreen]);

  const renderAnalysis = () => {
    if (!selectedTool) return null;
    
    console.log('Investigation renderAnalysis for tool:', selectedTool);
    console.log('Images available:', imagesWithDates.length);
    
    // Log sample image data
    if (imagesWithDates.length > 0) {
      console.log('Sample image data:', imagesWithDates[0]);
      console.log('Images with date info:', imagesWithDates.filter(img => img.exif.dateTimeOriginal).length);
    }
    
    // Common props for all analysis tools
    const commonProps = {
      images: imagesWithDates,
      width: dimensions.width,
      height: dimensions.height,
      showStats,
    };

    switch (selectedTool) {
      case 'pattern':
        return <DeviceDendrogram {...commonProps} />;
      case 'timeline':
        return <TimelineAnalysis {...commonProps} />;
      case 'software':
        return <SoftwareProcessingAnalysis images={imagesWithDates} showStats={showStats} />;
      case 'geolocation':
        return <GeographicalAnalysis images={imagesWithDates} showStats={showStats} />;
      default:
        return null;
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col h-full overflow-hidden ${
        fullscreen ? 'fixed inset-0 z-50 bg-app-black' : ''
      }`}
    >
      {!selectedTool ? (
        // Tool selection view
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-app-white">Investigation Dashboard</h2>
            <p className="text-app-accent-dim text-sm">Analyze and correlate data from {images.length} images</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tools.map(tool => (
              <button 
                key={tool.id}
                className="glass-panel p-3 rounded-lg text-left transition-colors hover:bg-app-gray-light/10 flex flex-col"
                onClick={() => setSelectedTool(tool.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-app-accent">{tool.icon}</div>
                  <h3 className="text-base font-medium text-app-white">{tool.name}</h3>
                </div>
                <p className="text-xs text-app-accent-dim">{tool.description}</p>
              </button>
            ))}
          </div>

          {images.length === 0 && (
            <div className="glass-panel mt-4 p-4 rounded-lg">
              <p className="text-center text-app-accent-dim">Upload images to begin your investigation</p>
            </div>
          )}
        </div>
      ) : (
        // Tool view with minimal chrome
        <div className="flex flex-col h-full">
          {/* Compact header */}
          <div className="flex items-center justify-between border-b border-app-gray-light/20 py-2 px-4 bg-app-gray-dark/60">
            <button
              className="flex items-center gap-2 text-app-accent hover:text-app-accent-bright transition-colors"
              onClick={() => setSelectedTool(null)}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-base font-medium text-app-white">
              {tools.find(t => t.id === selectedTool)?.name}
            </h2>
            <div className="flex gap-2">
              <button 
                className={`text-xs px-2 py-1 rounded ${showStats ? 'bg-app-accent' : 'text-app-accent border border-app-accent'}`}
                style={showStats ? { color: 'var(--app-black)' } : undefined}
                onClick={() => setShowStats(!showStats)}
                title={showStats ? "Hide statistics" : "Show statistics"}
              >
                <LayoutDashboard className="w-3 h-3" />
              </button>
              <button
                className="text-xs px-2 py-1 rounded text-app-accent border border-app-accent"
                onClick={toggleFullscreen}
                title={fullscreen ? "Exit fullscreen" : "Fullscreen mode"}
              >
                {fullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
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