import React, { useState, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { Search, Map, Calendar, Database } from 'lucide-react';
import DeviceDendrogram from './analysis/DeviceDendrogram';
import TimelineAnalysis from './analysis/TimelineAnalysis';
import SoftwareProcessingAnalysis from './analysis/SoftwareProcessingAnalysis';

interface Props {
  images: ImageData[];
}

type AnalysisTool = 'pattern' | 'geolocation' | 'timeline' | 'software' | null;

const Investigation: React.FC<Props> = ({ images }) => {
  const [selectedTool, setSelectedTool] = useState<AnalysisTool>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight - 200 // Account for header and padding
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const renderAnalysis = () => {
    if (!selectedTool) return null;

    switch (selectedTool) {
      case 'pattern':
        return (
          <div className="h-full">
            <DeviceDendrogram 
              images={images}
              width={dimensions.width}
              height={dimensions.height}
            />
          </div>
        );
      case 'timeline':
        return (
          <div className="h-full">
            <TimelineAnalysis
              images={images}
              width={dimensions.width}
              height={dimensions.height}
            />
          </div>
        );
      case 'software':
        return (
          <div className="h-full">
            <SoftwareProcessingAnalysis
              images={images}
              width={dimensions.width}
              height={dimensions.height}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-app-white mb-2">Investigation Dashboard</h2>
        <p className="text-app-accent-dim">Analyze and correlate data from {images.length} images</p>
      </div>

      {!selectedTool ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* Analysis Cards */}
          <button 
            className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10"
            onClick={() => setSelectedTool('pattern')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-app-accent" />
              <h3 className="text-lg font-medium text-app-white">Pattern Analysis</h3>
            </div>
            <p className="text-sm text-app-accent-dim">
              Identify patterns and connections across image metadata
            </p>
          </button>

          <button 
            className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10"
            onClick={() => setSelectedTool('geolocation')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Map className="w-5 h-5 text-app-accent" />
              <h3 className="text-lg font-medium text-app-white">Geolocation Analysis</h3>
            </div>
            <p className="text-sm text-app-accent-dim">
              Map and analyze geographical data from images
            </p>
          </button>

          <button 
            className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10"
            onClick={() => setSelectedTool('timeline')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-app-accent" />
              <h3 className="text-lg font-medium text-app-white">Timeline Analysis</h3>
            </div>
            <p className="text-sm text-app-accent-dim">
              Visualize temporal relationships between images
            </p>
          </button>

          <button 
            className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10"
            onClick={() => setSelectedTool('software')}
          >
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-app-accent" />
              <h3 className="text-lg font-medium text-app-white">Software Processing</h3>
            </div>
            <p className="text-sm text-app-accent-dim">
              Analyze software editing patterns and metadata anomalies
            </p>
          </button>
        </div>
      ) : (
        <div className="h-[calc(100%-100px)]">
          <div className="flex items-center justify-between mb-6">
            <button
              className="text-app-accent hover:text-app-accent-bright transition-colors"
              onClick={() => setSelectedTool(null)}
            >
              ← Back to Tools
            </button>
          </div>
          {renderAnalysis()}
        </div>
      )}

      {images.length === 0 && !selectedTool && (
        <div className="glass-panel p-6 rounded-lg">
          <p className="text-center text-app-accent-dim">
            Upload images to begin your investigation
          </p>
        </div>
      )}
    </div>
  );
};

export default Investigation; 