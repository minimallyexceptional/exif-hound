import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { Button } from './common/Button';
import { ImportData } from '../types';

interface Props {
  onClose: () => void;
  onImport: (data: ImportData) => void;
}

const ImportModal: React.FC<Props> = ({ onClose, onImport }) => {
  const [selectedFormat, setSelectedFormat] = useState<'kml' | 'csv'>('kml');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      
      if (selectedFormat === 'kml') {
        // Basic validation for KML
        if (!text.includes('<?xml') || !text.includes('<kml')) {
          throw new Error('Invalid KML file format');
        }
        // TODO: Add proper KML parsing
        onImport({ type: 'kml', data: text });
      } else {
        // Basic CSV validation and parsing
        const lines = text.split('\n');
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }
        
        const headers = lines[0].split(',');
        if (!headers.includes('latitude') || !headers.includes('longitude')) {
          throw new Error('CSV must contain "latitude" and "longitude" columns');
        }
        
        // TODO: Add proper CSV parsing
        onImport({ type: 'csv', data: text });
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-app-gray rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-gray-light">
          <h2 className="text-lg font-semibold text-app-white">Import Location Data</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-app-gray-light rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-app-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-app-white mb-2">
              Import Format
            </label>
            <div className="flex gap-4">
              <button
                className={`flex-1 p-3 rounded-lg border ${
                  selectedFormat === 'kml'
                    ? 'border-app-accent bg-app-accent/10 text-app-white'
                    : 'border-app-gray-light text-app-accent-dim hover:bg-app-gray-light/30'
                } transition-colors`}
                onClick={() => setSelectedFormat('kml')}
              >
                KML
              </button>
              <button
                className={`flex-1 p-3 rounded-lg border ${
                  selectedFormat === 'csv'
                    ? 'border-app-accent bg-app-accent/10 text-app-white'
                    : 'border-app-gray-light text-app-accent-dim hover:bg-app-gray-light/30'
                } transition-colors`}
                onClick={() => setSelectedFormat('csv')}
              >
                CSV
              </button>
            </div>
          </div>

          {/* Format specific instructions */}
          <div className="mb-4 p-3 bg-app-black/30 rounded-lg text-sm text-app-accent-dim">
            {selectedFormat === 'kml' ? (
              <p>Upload a KML file containing location data. The file should include placemarks with coordinates.</p>
            ) : (
              <p>Upload a CSV file with "latitude" and "longitude" columns. Additional columns will be imported as metadata.</p>
            )}
          </div>

          {/* File input */}
          <div className="mb-4">
            <input
              type="file"
              accept={selectedFormat === 'kml' ? '.kml' : '.csv'}
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="block w-full p-4 border-2 border-dashed border-app-gray-light rounded-lg text-center cursor-pointer hover:bg-app-gray-light/10 transition-colors"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-app-accent" />
              <span className="text-app-white">
                {isLoading ? 'Processing...' : 'Click to select file'}
              </span>
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-none mt-0.5" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-app-gray-light">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal; 