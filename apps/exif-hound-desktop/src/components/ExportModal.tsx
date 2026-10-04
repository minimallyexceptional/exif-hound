import React, { useState } from 'react';
import { FileJson, FileSpreadsheet, Loader, AlertCircle } from 'lucide-react';
import { ImageData } from '../types';
import { generateCsv } from '../utils/csvExport';
import { generateJson } from '../utils/jsonExport';
import { saveJsonFile, saveCsvFile } from '../utils/fileSystem';
import { Modal } from './common/Modal';
import { Button } from './common/Button';

interface Props {
  images: ImageData[];
  onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ images, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'json') => {
    setExportError(null);
    setIsExporting(true);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `exif-hound-data-${timestamp}`;
    
    try {
      let success = false;
      
      if (format === 'csv') {
        success = await saveCsvFile(generateCsv(images), filename);
      } else {
        success = await saveJsonFile(generateJson(images), filename);
      }
      
      if (success) {
        onClose();
      } else {
        setExportError(`Failed to save ${format.toUpperCase()} file. Please try again.`);
      }
    } catch (error) {
      if (__DEV__) console.error(`Error during ${format} export:`, error);
      setExportError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      <div className="p-6 space-y-6">
        {exportError && (
          <div className="bg-red-900/30 p-3 rounded-md text-red-300 flex items-start gap-2 mb-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{exportError}</div>
          </div>
        )}
        
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
        
        <div className="text-xs text-app-accent-dim text-center mt-2">
          Export includes all metadata from {images.length} images
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;