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
      console.log(`[ExportModal] Starting ${format} export...`);
      
      let success = false;
      
      if (format === 'csv') {
        const csvContent = generateCsv(images);
        console.log(`[ExportModal] Generated CSV content (${csvContent.length} bytes)`);
        success = await saveCsvFile(csvContent, filename);
      } else {
        const jsonContent = generateJson(images);
        console.log(`[ExportModal] Generated JSON content (${jsonContent.length} bytes)`);
        success = await saveJsonFile(jsonContent, filename);
      }
      
      if (success) {
        onClose();
      } else {
        setExportError(`Failed to save ${format.toUpperCase()} file. Please try again.`);
      }
    } catch (error) {
      console.error(`[ExportModal] Error during ${format} export:`, error);
      setExportError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal title="Export Data" onClose={onClose} size="sm">
      <div className="p-6 space-y-4">
        {exportError && (
          <div className="bg-red-900/30 p-3 rounded-md text-red-300 flex items-start gap-2 mb-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{exportError}</div>
          </div>
        )}
        
        <Button
          fullWidth
          variant="secondary"
          icon={isExporting ? <Loader className="w-5 h-5 animate-spin" /> : <FileJson className="w-5 h-5" />}
          onClick={() => handleExport('json')}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export as JSON'}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          icon={isExporting ? <Loader className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
          onClick={() => handleExport('csv')}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : 'Export as CSV'}
        </Button>
      </div>
    </Modal>
  );
};

export default ExportModal;