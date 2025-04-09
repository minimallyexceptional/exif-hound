import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './common/Modal';
import ExifReader from 'exifreader';
import { ImageData } from '../types';
import { ArrowLeftRight } from 'lucide-react';
import { ImageContainer } from './common/ImageContainer';

interface ImageComparisonProps {
  image: ImageData;
  onClose: () => void;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({ image, onClose }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<number>(0.5);

  useEffect(() => {
    const extractThumbnail = async () => {
      try {
        // Convert the file to an ArrayBuffer
        const response = await fetch(image.url);
        const buffer = await response.arrayBuffer();
        
        const tags = await ExifReader.load(buffer);
        if (tags.Thumbnail && 'value' in tags.Thumbnail && tags.Thumbnail.value instanceof ArrayBuffer) {
          const blob = new Blob([tags.Thumbnail.value], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          setThumbnail(url);
        } else {
          setError('No thumbnail found in EXIF data');
        }
      } catch (err) {
        setError('Failed to extract thumbnail from EXIF data');
        console.error('Error extracting thumbnail:', err);
      } finally {
        setIsLoading(false);
      }
    };

    extractThumbnail();
  }, [image.url]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    setMousePosition(Math.max(0, Math.min(1, x)));
  };

  const handleMouseLeave = () => {
    setMousePosition(0.5);
  };

  return (
    <Modal title="Image Comparison" onClose={onClose}>
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
          </div>
        ) : error ? (
          <div className="text-app-accent-dim text-center">{error}</div>
        ) : (
          <div
            ref={containerRef}
            className="relative h-64 w-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={image.url}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain"
            />
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Thumbnail"
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  clipPath: `inset(0 ${(1 - mousePosition) * 100}% 0 0)`,
                }}
              />
            )}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-app-accent"
              style={{ left: `${mousePosition * 100}%` }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};