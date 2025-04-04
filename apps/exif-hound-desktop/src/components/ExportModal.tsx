import React from 'react';
import { FileJson, FileSpreadsheet } from 'lucide-react';
import { ImageData } from '../types';
import { generateCsv, downloadCsv } from '../utils/csvExport';
import { generateJson, downloadJson } from '../utils/jsonExport';
import { Modal } from './common/Modal';
import { Button } from './common/Button';

interface Props {
  images: ImageData[];
  onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ images, onClose }) => {
  const handleExport = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'csv') {
      const csvContent = generateCsv(images);
      downloadCsv(csvContent, `exif-hound-data-${timestamp}.csv`);
    } else {
      const jsonContent = generateJson(images);
      downloadJson(jsonContent, `exif-hound-data-${timestamp}.json`);
    }
    
    onClose();
  };

  return (
    <Modal title="Export Data" onClose={onClose} size="sm">
      <div className="p-6 space-y-4">
        <Button
          fullWidth
          variant="secondary"
          icon={<FileJson className="w-5 h-5" />}
          onClick={() => handleExport('json')}
        >
          Export as JSON
        </Button>
        <Button
          fullWidth
          variant="secondary"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          onClick={() => handleExport('csv')}
        >
          Export as CSV
        </Button>
      </div>
    </Modal>
  );
};

export default ExportModal;