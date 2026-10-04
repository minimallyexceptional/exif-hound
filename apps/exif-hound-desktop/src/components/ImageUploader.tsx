import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { ImageData } from '../types';
import { useExifData } from '../hooks/useExifData';

// Utility for limiting concurrent operations
class ConcurrencyLimiter {
  private queue: (() => Promise<unknown>)[] = [];
  private running = 0;

  constructor(private maxConcurrency: number = 3) {}

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const operation = this.queue.shift()!;
    
    try {
      await operation();
    } finally {
      this.running--;
      this.process();
    }
  }
}

interface Props {
  onImageUpload: (imageData: ImageData) => void;
  inputId?: string;
  hideDropZone?: boolean;
}

const ImageUploader: React.FC<Props> = ({ onImageUpload, inputId = 'fileInput', hideDropZone = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const { processExifData } = useExifData({ fetchLocation: false }); // Don't await location in initial processing

  // Create concurrency limiter for EXIF processing
  const concurrencyLimiter = useCallback(() => new ConcurrencyLimiter(3), []);

  const processFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) return;

    setIsProcessing(true);
    setProcessingCount(fileArray.length);

    // Process all files concurrently, bounded by a shared concurrency limiter
    const limiter = concurrencyLimiter();
    const processingPromises = fileArray.map(file => 
      limiter.add(async () => {
        const imageId = Math.random().toString(36).substring(7);
        const url = URL.createObjectURL(file);
        try {
          // Create image immediately with loading state
          // Add image with loading state first (immediate UI feedback)
          const initialImage: ImageData = {
            id: imageId,
            file,
            url,
            exif: {
              // Set loading state for location
              location: { loading: true }
            },
            isProcessing: true
          };
          
          onImageUpload(initialImage);

          // Process EXIF data in background
          const exif = await processExifData(file);
          
          // Update with EXIF data
          const updatedImage: ImageData = {
            id: imageId,
            file,
            url,
            exif,
            isProcessing: false
          };
          
          if (__DEV__) {
            console.log(`Processed image: ${file.name}`, { 
              hasLocation: !!exif.location,
              coordinates: `${exif.latitude}, ${exif.longitude}`
            });
          }
          return updatedImage;
        } catch (error) {
          if (__DEV__) {
            console.error('Error processing image:', error);
          }
          
          // Create image with error state
          const errorImage: ImageData = {
            id: imageId,
            file,
            url,
            exif: {
              error: 'Failed to process image'
            },
            isProcessing: false
          };
          
          return errorImage;
        } finally {
          setProcessingCount(prev => prev - 1);
        }
      })
    );

    // Wait for all processing to complete
    // Publish completed records in input order even though extraction itself
    // runs concurrently. This keeps the last uploaded file selected instead
    // of letting worker timing choose the final selection.
    const completedImages = await Promise.all(processingPromises);
    completedImages.forEach(onImageUpload);
    setIsProcessing(false);
    setProcessingCount(0);
  }, [onImageUpload, processExifData, concurrencyLimiter]);

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
          {isProcessing 
            ? `Processing images... (${processingCount} remaining)` 
            : 'Drop your images here or click to upload'
          }
        </p>
        <p className="text-sm text-app-accent-dim mt-2">
          {isProcessing 
            ? 'Images are being processed concurrently for faster upload'
            : 'Upload multiple images at once'
          }
        </p>
      </label>
    </div>
  );
};

export default ImageUploader;
