import React, { useState } from 'react';
import { FileJson, FileSpreadsheet, Loader } from 'lucide-react';
import { ImageData } from '../types';
import { generateCsv } from '../utils/csvExport';
import { generateJson } from '../utils/jsonExport';
import { saveJsonFile, saveCsvFile } from '../utils/fileSystem';
import { redactGpsFromExif } from '../utils/exifRedaction';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { notify } from '../feedback';

interface Props {
  images: ImageData[];
  onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ images, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json', redactGps = false) => {
    setIsExporting(true);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `exif-hound-data-${redactGps ? 'redacted-' : ''}${timestamp}`;
    const payload = redactGps
      ? images.map(image => ({ ...image, exif: redactGpsFromExif(image.exif) }))
      : images;
    
    try {
      let success = false;
      
      if (format === 'csv') {
        success = await saveCsvFile(generateCsv(payload), filename);
      } else {
        success = await saveJsonFile(generateJson(payload), filename);
      }
      
      if (success) {
        notify.success(format === 'csv' ? 'Exported CSV' : 'Exported JSON');
        onClose();
      } else {
        notify.error(`Failed to save ${format.toUpperCase()} file. Please try again.`);
      }
    } catch (error) {
      if (__DEV__) console.error(`Error during ${format} export:`, error);
      notify.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal 
      title="Export Data" 
      onClose={onClose} 
      size="sm"
      className="export-modal"
    >
      <div className="flex flex-col gap-6 p-6">
        <Button
          fullWidth
          variant="secondary"
          className="py-3 hover:translate-y-[-2px] transition-all duration-200 ease-in-out"
          icon={isExporting ? <Loader className="w-5 h-5 animate-spin" /> : <FileJson className="w-5 h-5" />}
          onClick={() => handleExport('json')}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export as JSON'}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          className="py-3 hover:translate-y-[-2px] transition-all duration-200 ease-in-out"
          icon={isExporting ? <Loader className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export as CSV'}
        </Button>

        <div className="border-t border-app-gray-light/30 pt-4 space-y-3">
          <p className="text-xs text-app-accent-dim">
            Redacted exports remove GPS coordinates from exported metadata only. Original project images on disk are unchanged.
          </p>
          <Button
            fullWidth
            variant="ghost"
            onClick={() => handleExport('json', true)}
            disabled={isExporting}
          >
            Export redacted JSON (no GPS fields)
          </Button>
          <Button
            fullWidth
            variant="ghost"
            onClick={() => handleExport('csv', true)}
            disabled={isExporting}
          >
            Export redacted CSV (no GPS fields)
          </Button>
        </div>
        
        <div className="text-xs text-app-accent-dim text-center mt-2">
          Export includes metadata from {images.length} images
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;