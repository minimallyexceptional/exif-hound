import React, { useState } from 'react';
import { ImageData } from '../types';
import { Button } from './common/Button';
import { X } from 'lucide-react';
import { generateJson } from '../utils/jsonExport';

interface ExportModalProps {
  images: ImageData[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ images, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let content: string;
      let defaultFilename: string;

      if (exportFormat === 'csv') {
        // Create CSV content
        const headers = [
          'Filename',
          'Latitude',
          'Longitude',
          'Date Taken',
          'Camera Make',
          'Camera Model',
          'Exposure Time',
          'F-Number',
          'ISO',
          'Focal Length',
          'GPS Altitude',
          'Lens Model'
        ];

        const rows = images.map(image => [
          image.file.name,
          image.exif.latitude || '',
          image.exif.longitude || '',
          image.exif.dateTimeOriginal || '',
          image.exif.make || '',
          image.exif.model || '',
          image.exif.exposureTime || '',
          image.exif.fNumber || '',
          image.exif.iso || '',
          image.exif.focalLength || '',
          image.exif.gpsAltitude || '',
          image.exif.lensModel || ''
        ]);

        content = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        defaultFilename = 'exif_data.csv';
      } else {
        // Create JSON content
        content = generateJson(images);
        defaultFilename = 'exif_data.json';
      }

      // Save the file using the file dialog
      const result = await window.api.saveFile({
        content,
        defaultFilename,
        filters: [
          { name: exportFormat === 'csv' ? 'CSV Files' : 'JSON Files', extensions: [exportFormat] }
        ]
      });

      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-app-gray rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-app-white">Export Data</h2>
          <Button
            variant="ghost"
            className="!p-0"
            onClick={onClose}
          >
            <X className="w-5 h-5 text-app-white" />
          </Button>
        </div>
        <p className="text-app-gray-lighter mb-4">
          Export EXIF data for {images.length} image{images.length !== 1 ? 's' : ''}
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-app-white mb-2">Export Format</label>
          <div className="flex gap-4">
            <Button
              variant={exportFormat === 'csv' ? 'primary' : 'secondary'}
              onClick={() => setExportFormat('csv')}
              className="flex-1"
            >
              CSV
            </Button>
            <Button
              variant={exportFormat === 'json' ? 'primary' : 'secondary'}
              onClick={() => setExportFormat('json')}
              className="flex-1"
            >
              JSON
            </Button>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </div>
  );
};