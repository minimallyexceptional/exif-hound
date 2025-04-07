import { ImageData } from '../../../types';
import { Feature } from 'geojson';

export interface MapProps {
  images: ImageData[];
  selectedImage: ImageData | null;
  showRoute?: boolean;
  onToggleRoute: () => void;
  onSelectImage: (image: ImageData) => void;
}

export interface ImportedLayer {
  id: string;
  name: string;
  type: 'kml' | 'csv';
  visible: boolean;
  features: Feature[];
}

export interface KMLLayerProps {
  data: string;
  onLayerReady?: (features: Feature[]) => void;
}

export interface CSVLayerProps {
  data: string;
  onLayerReady?: (features: Feature[]) => void;
}

export interface LayerControlProps {
  layers: ImportedLayer[];
  onToggleLayer: (layerId: string) => void;
  onClearLayers: () => void;
  importError: string | null;
}

export interface MapControlsProps {
  onToggleRoute: () => void;
  onToggleFullscreen: () => void;
  onOpenImport: () => void;
  showRoute: boolean;
}

export interface MapContentProps {
  center: [number, number];
  selectedImage: ImageData | null;
  showRoute: boolean;
  routeCoordinates: [number, number][];
  onSelectImage: (image: ImageData) => void;
  importedLayers: ImportedLayer[];
  pendingKmlData: { data: string; layerId: string; name: string } | null;
  pendingCsvData: { data: string; layerId: string; name: string } | null;
} 