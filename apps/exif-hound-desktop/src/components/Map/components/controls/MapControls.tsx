import React from 'react';
import { createControlComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-fullscreen';
import '../../styles/controls.css';

// Extend Control interface to include Fullscreen
declare module 'leaflet' {
  export interface FullscreenOptions extends L.ControlOptions {
    title?: {
      'false': string;
      'true': string;
    };
    forceSeparateButton?: boolean;
    forcePseudoFullscreen?: boolean;
  }
}

// Add Fullscreen to L.Control
declare global {
  namespace L {
    namespace Control {
      class Fullscreen extends Control {
        constructor(options?: FullscreenOptions);
      }
    }
  }
}

// Create fullscreen control component
const FullscreenControl = createControlComponent(
  () => {
    return new L.Control.Fullscreen({
      position: 'topleft',
      title: {
        'false': 'View Fullscreen',
        'true': 'Exit Fullscreen'
      }
    });
  }
);

interface MapControlsProps {
  showFullscreen?: boolean;
  showRoute?: boolean;
  showHeatmap?: boolean;
  showClusters?: boolean;
  showReticle?: boolean;
  onToggleRoute?: () => void;
  onToggleFullscreen?: () => void;
  onOpenImport?: () => void;
  onToggleHeatmap?: () => void;
  onToggleClusters?: () => void;
  onToggleReticle?: () => void;
  fullscreenPosition?: L.ControlPosition;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showFullscreen = true,
  showRoute = false,
  showHeatmap = false,
  showClusters = true,
  showReticle = false,
  onToggleRoute = () => {},
  onToggleFullscreen = () => {},
  onOpenImport = () => {},
  onToggleHeatmap = () => {},
  onToggleClusters = () => {},
  onToggleReticle = () => {},
  fullscreenPosition = 'topleft'
}) => {
  return (
    <>
      {showFullscreen && <FullscreenControl position={fullscreenPosition} />}
      
      {/* Custom controls for route toggle, import, etc. */}
      <div className="leaflet-control-container">
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar">
            <button 
              onClick={onToggleReticle}
              className={`border-b ${showReticle ? 'toggle-active' : 'toggle-inactive'}`}
              title={showReticle ? "Hide Reticle" : "Show Reticle"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </button>

            <button 
              onClick={onToggleRoute}
              className={`border-b ${showRoute ? 'toggle-active' : 'toggle-inactive'}`}
              title={showRoute ? "Hide Route" : "Show Route"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </button>
            
            <button 
              onClick={onToggleHeatmap}
              className={`border-b ${showHeatmap ? 'toggle-active' : 'toggle-inactive'}`}
              title={showHeatmap ? "Show Markers" : "Show Heatmap"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v20M2 12h20" />
              </svg>
            </button>

            <button 
              onClick={onToggleClusters}
              className={`border-b ${showClusters ? 'toggle-active' : 'toggle-inactive'}`}
              title={showClusters ? "Show Individual Markers" : "Show Clusters"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="8" cy="8" r="3" />
                <circle cx="16" cy="16" r="3" />
                <circle cx="16" cy="8" r="3" />
                <circle cx="8" cy="16" r="3" />
              </svg>
            </button>

            <button 
              onClick={onOpenImport}
              className="toggle-inactive"
              title="Import Data"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 