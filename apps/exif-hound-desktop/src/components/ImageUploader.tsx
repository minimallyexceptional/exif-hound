import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { ImageData } from '../types';
import { useExifData } from '../hooks/useExifData';

interface Props {
  onImageUpload: (imageData: ImageData) => void;
  inputId?: string;
  hideDropZone?: boolean;
}

const ImageUploader: React.FC<Props> = ({ onImageUpload, inputId = 'fileInput', hideDropZone = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { processExifData } = useExifData({ fetchLocation: true });

  const processFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        try {
          const exif = await processExifData(file);
          const url = URL.createObjectURL(file);
          onImageUpload({
            id: Math.random().toString(36).substring(7),
            file,
            url,
            exif,
            isProcessing: false
          });
          
          console.log(`Processed image: ${file.name}`, { 
            hasLocation: !!exif.location,
            coordinates: `${exif.latitude}, ${exif.longitude}`
          });
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    }
    setIsProcessing(false);
  }, [onImageUpload, processExifData]);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  }, [processFiles]);

  if (hideDropZone) {
    return (
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        id={inputId}
      />
    );
  }

  return (
    <div
      className={`border-2 border-dashed border-app-gray-light rounded-lg p-8 text-center cursor-pointer hover:border-app-white transition-colors ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        id={inputId}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        <Upload className="w-12 h-12 mx-auto mb-4 text-app-accent-dim" />
        <p className="text-lg font-medium text-app-white">
          {isProcessing ? 'Processing images...' : 'Drop your images here or click to upload'}
        </p>
        <p className="text-sm text-app-accent-dim mt-2">
          Upload multiple images at once
        </p>
      </label>
    </div>
  );
};

export default ImageUploader;