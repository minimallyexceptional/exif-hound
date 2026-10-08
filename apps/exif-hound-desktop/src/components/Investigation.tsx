import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { InsightsEngine } from 'exif-insights';
import type { InsightImage } from 'exif-insights';
import { ImageData } from '../types';
import DeviceDendrogram from './analysis/DeviceDendrogram';
import TimelineAnalysis from './analysis/TimelineAnalysis';
import SoftwareProcessingAnalysis from './analysis/SoftwareProcessingAnalysis';
import GeographicalAnalysis from './analysis/GeographicalAnalysis';
import InvestigationDashboard from './investigation/InvestigationDashboard';
import type { AnalysisTool } from './investigation/AnalysisTool';

interface Props {
  images: ImageData[];
  /** Tool restored from the project store; applied on first mount. */
  initialTool?: string | null;
  /** Notified when the user selects/deselects an analysis tool (persistence hook). */
  onToolChange?: (tool: string | null) => void;
}

/** Shared, stateless insights engine. */
const insightsEngine = new InsightsEngine();

interface ToolDefinition {
  id: Exclude<AnalysisTool, null>;
  name: string;
  description: string;
}

/** Adapt the app's ImageData records to the exif-insights input shape. */
function toInsightImage(image: ImageData): InsightImage {
  const { exif } = image;
  return {
    id: image.id,
    isProcessing: image.isProcessing,
    latitude: exif.latitude,
    longitude: exif.longitude,
    gpsAltitude: exif.gpsAltitude,
    dateTimeOriginal: exif.dateTimeOriginal,
    make: exif.make,
    model: exif.model,
    lensModel: exif.lensModel,
    software: exif.software,
    artist: exif.artist,
    copyright: exif.copyright,
    imageWidth: exif.imageWidth,
    imageHeight: exif.imageHeight,
    orientation: exif.orientation,
    location: exif.location
      ? {
          formatted: exif.location.formatted,
          country: exif.location.country,
          state: exif.location.state,
          city: exif.location.city,
          town: exif.location.town,
          village: exif.location.village,
          suburb: exif.location.suburb,
          road: exif.location.road
        }
      : null
  };
}

const Investigation: React.FC<Props> = ({ images, initialTool = null, onToolChange }) => {
  const [selectedTool, setSelectedTool] = useState<AnalysisTool>(
    (initialTool as AnalysisTool) ?? null
  );
  // Persistence hook: notify the app whenever the tool selection changes.
  useEffect(() => {
    onToolChange?.(selectedTool);
  }, [selectedTool, onToolChange]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  // Insights aggregate in the background from the already-parsed EXIF
  // records and refresh automatically as the dataset changes.
  const insightImages = useMemo(() => images.map(toInsightImage), [images]);
  const insights = useMemo(() => insightsEngine.compute(insightImages), [insightImages]);

  // Only real images with capture dates feed the temporal tools; the
  // dataset is never augmented with synthetic entries.
  const imagesWithDates = images.filter(img => img.exif.dateTimeOriginal);

  const tools: ToolDefinition[] = [
    {
      id: 'pattern',
      name: 'Pattern Analysis',
      description: 'Identify patterns and connections across image metadata'
    },
    {
      id: 'geolocation',
      name: 'Geolocation Analysis',
      description: 'Map and analyze geographical data from images'
    },
    {
      id: 'timeline',
      name: 'Timeline Analysis',
      description: 'Visualize temporal relationships between images'
    },
    {
      id: 'software',
      name: 'Software Processing',
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
        // Insights dashboard
        <InvestigationDashboard
          images={images}
          insights={insights}
          onOpenTool={setSelectedTool}
        />
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
