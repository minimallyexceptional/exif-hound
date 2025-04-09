import React from 'react';
import { ZoomControl } from 'react-leaflet';
import { createControlComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-fullscreen';

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
  showZoom?: boolean;
  showFullscreen?: boolean;
  showRoute?: boolean;
  onToggleRoute?: () => void;
  onToggleFullscreen?: () => void;
  onOpenImport?: () => void;
  zoomPosition?: L.ControlPosition;
  fullscreenPosition?: L.ControlPosition;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showZoom = true,
  showFullscreen = true,
  showRoute = false,
  onToggleRoute = () => {},
  onToggleFullscreen = () => {},
  onOpenImport = () => {},
  zoomPosition = 'topleft',
  fullscreenPosition = 'topleft'
}) => {
  return (
    <>
      {showZoom && <ZoomControl position={zoomPosition} />}
      {showFullscreen && <FullscreenControl position={fullscreenPosition} />}
      
      {/* Custom controls for route toggle, import, etc. */}
      <div className="leaflet-control-container">
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar">
            <button 
              onClick={onToggleRoute}
              className="p-2 bg-white hover:bg-gray-100 border-b"
              title={showRoute ? "Hide Route" : "Show Route"}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </button>
            
            <button 
              onClick={onToggleFullscreen}
              className="p-2 bg-white hover:bg-gray-100 border-b"
              title="Toggle Fullscreen"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
            
            <button 
              onClick={onOpenImport}
              className="p-2 bg-white hover:bg-gray-100"
              title="Import Data"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}; 