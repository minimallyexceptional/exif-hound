import React, { useState, useEffect, useRef } from 'react';
import { ImageData } from '../types';
import { ArrowLeftRight } from 'lucide-react';
import ExifReader from 'exifreader';
import { Modal } from './common/Modal';
import { ImageContainer } from './common/ImageContainer';

interface Props {
  image: ImageData;
  onClose: () => void;
}

const ImageComparison: React.FC<Props> = ({ image, onClose }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const extractThumbnail = async () => {
      try {
        const tags = await ExifReader.load(image.file, { expanded: true });
        
        if (tags.Thumbnail?.image) {
          const uint8Array = new Uint8Array(tags.Thumbnail.image);
          const base64String = btoa(
            uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const dataUrl = `data:image/jpeg;base64,${base64String}`;
          setThumbnailUrl(dataUrl);
        } else {
          setError('No EXIF thumbnail found in this image');
        }
      } catch (err) {
        setError('Failed to extract EXIF thumbnail');
        console.error('Error extracting thumbnail:', err);
      }
    };

    extractThumbnail();
  }, [image]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  return (
    <Modal 
      title="Image Comparison" 
      onClose={onClose} 
      showFullscreenToggle
      size="lg"
    >
      <div className="p-6">
        {error ? (
          <div className="text-center text-red-500 dark:text-red-400 p-4">
            {error}
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <ImageContainer
              src={image.url}
              alt="Original"
              aspectRatio="16/9"
              className="bg-gray-100 dark:bg-gray-700"
            />
            
            {thumbnailUrl && (
              <div
                className="absolute inset-0"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                }}
              >
                <ImageContainer
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  aspectRatio="16/9"
                />
              </div>
            )}

            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-gray-600" />
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              Original
            </div>
            {thumbnailUrl && (
              <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                Thumbnail
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImageComparison;