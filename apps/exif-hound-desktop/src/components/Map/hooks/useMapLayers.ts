import { useState } from 'react';
import { Feature } from 'geojson';
import { ImportedLayer } from '../types';
import { createLayer } from '../utils/layerUtils';

export const useMapLayers = () => {
  const [importedLayers, setImportedLayers] = useState<ImportedLayer[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [nextLayerId, setNextLayerId] = useState(1);
  const [pendingKmlData, setPendingKmlData] = useState<{ data: string; layerId: string; name: string } | null>(null);
  const [pendingCsvData, setPendingCsvData] = useState<{ data: string; layerId: string; name: string } | null>(null);

  const handleLayerReady = (layerId: string, name: string, type: 'kml' | 'csv', features: Feature[]) => {
    setImportedLayers(prev => [...prev, createLayer(type, features, nextLayerId)]);
    setNextLayerId(prev => prev + 1);
  };

  const toggleLayerVisibility = (layerId: string) => {
    setImportedLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const clearImportedLayers = () => {
    setImportedLayers([]);
    setImportError(null);
  };

  const addPendingKmlData = (data: string) => {
    setPendingKmlData({ 
      data,
      layerId: `kml-${nextLayerId}`,
      name: `KML Layer ${nextLayerId}`
    });
  };

  const addPendingCsvData = (data: string) => {
    setPendingCsvData({ 
      data,
      layerId: `csv-${nextLayerId}`,
      name: `CSV Layer ${nextLayerId}`
    });
  };

  return {
    importedLayers,
    importError,
    setImportError,
    pendingKmlData,
    pendingCsvData,
    setPendingKmlData,
    setPendingCsvData,
    handleLayerReady,
    toggleLayerVisibility,
    clearImportedLayers,
    addPendingKmlData,
    addPendingCsvData
  };
}; 