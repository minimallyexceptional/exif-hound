import React, { useState, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { Search, Map, Calendar, Database, ArrowLeft, Maximize2, Minimize2, Images } from 'lucide-react';
import DeviceDendrogram from './analysis/DeviceDendrogram';
import TimelineAnalysis from './analysis/TimelineAnalysis';
import SoftwareProcessingAnalysis from './analysis/SoftwareProcessingAnalysis';
import GeographicalAnalysis from './analysis/GeographicalAnalysis';

interface Props {
  images: ImageData[];
}

type AnalysisTool = 'pattern' | 'geolocation' | 'timeline' | 'software' | null;

interface ToolDefinition {
  id: Exclude<AnalysisTool, null>;
  name: string;
  icon: React.ReactNode;
  description: string;
}

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

const Investigation: React.FC<Props> = ({ images }) => {
  const [selectedTool, setSelectedTool] = useState<AnalysisTool>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Measure the analysis viewport itself (not the window) so tab
  // switches, fullscreen toggles, and panel resizes all stay correct.
  useEffect(() => {
    const el = analysisRef.current;
    if (!el) return undefined;

    const update = () => {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [selectedTool]);

  // Escape exits fullscreen. Functional update keeps the listener
  // mounted once, regardless of state changes.
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(prev => (prev ? false : prev));
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const hasImages = images.length > 0;
  const activeTool = tools.find(t => t.id === selectedTool);

  const renderAnalysis = () => {
    if (!selectedTool) return null;

    // Tools that take explicit dimensions get the measured viewport;
    // others lay themselves out.
    switch (selectedTool) {
      case 'pattern':
        return <DeviceDendrogram images={images} width={dimensions.width} height={dimensions.height} />;
      case 'timeline':
        return <TimelineAnalysis images={images} width={dimensions.width} height={dimensions.height} />;
      case 'software':
        return <SoftwareProcessingAnalysis images={images} />;
      case 'geolocation':
        return <GeographicalAnalysis images={images} />;
      default:
        return null;
    }
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
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-app-white">Investigation Dashboard</h2>
            {hasImages ? (
              <p className="text-app-accent-dim text-sm">
                Analyze and correlate data from{' '}
                <span className="text-app-white font-medium">{images.length}</span>{' '}
                {images.length === 1 ? 'image' : 'images'}
              </p>
            ) : (
              <p className="text-app-accent-dim text-sm">Select a tool once your library has images</p>
            )}
          </div>

          {hasImages ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  className="glass-panel p-3 rounded-lg text-left transition-all hover:bg-app-gray-light hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
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
          ) : (
            <div
              className="glass-panel rounded-lg px-6 py-12 flex flex-col items-center text-center gap-3"
              role="status"
            >
              <Images className="w-10 h-10 text-app-accent-dim" aria-hidden="true" />
              <h3 className="text-base font-medium text-app-white">No images to investigate yet</h3>
              <p className="text-sm text-app-accent-dim max-w-sm">
                Add images from the gallery, then return here to run pattern, timeline,
                geolocation, and software analysis across them.
              </p>
            </div>
          )}
        </div>
      ) : (
        // Tool view with minimal chrome
        <div className="flex flex-col h-full">
          {/* Compact header */}
          <div className="flex items-center justify-between gap-3 border-b border-app-gray-light/20 py-2 px-4 bg-app-gray/60">
            <button
              className="flex items-center gap-2 text-app-accent hover:text-app-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent p-1 -m-1"
              onClick={() => setSelectedTool(null)}
              aria-label="Back to investigation tools"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-base font-medium text-app-white truncate">{activeTool?.name}</h2>
            <button
              className="text-app-accent hover:text-app-white transition-colors rounded p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
              onClick={() => setFullscreen(prev => !prev)}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-pressed={fullscreen}
            >
              {fullscreen ? (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Analysis viewport — measured, not estimated */}
          <div ref={analysisRef} className="flex-1 min-h-0 overflow-auto relative">
            {renderAnalysis()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Investigation;