import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './common/Modal';
import ExifReader from 'exifreader';
import { ImageData } from '../types';
import { ArrowLeftRight } from 'lucide-react';

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
    let thumbnailUrl: string | null = null;

    const extractThumbnail = async () => {
      try {
        // Convert the file to an ArrayBuffer
        const response = await fetch(image.url);
        const buffer = await response.arrayBuffer();
        
        const tags = await ExifReader.load(buffer);
        
        const thumbnailTag = tags.Thumbnail;

        // Check if we have a base64 thumbnail
        if (thumbnailTag && thumbnailTag.image && thumbnailTag.base64) {
          const base64String = thumbnailTag.base64;
          const dataUrl = `data:image/jpeg;base64,${base64String}`;
          setThumbnail(dataUrl);
          return;
        }

        // If no base64, try the other methods
        // Helper function to safely extract thumbnail data
        const getThumbnailData = (tag: any, tagName: string) => {
          try {
            if (!tag) {
              return undefined;
            }
            
            // Handle JPEGInterchangeFormat format
            if ('JPEGInterchangeFormat' in tag && 'JPEGInterchangeFormatLength' in tag) {
              const offset = tag.JPEGInterchangeFormat.value;
              const length = tag.JPEGInterchangeFormatLength.value;
              
              if (offset && length) {
                // Extract the thumbnail data from the buffer
                return buffer.slice(offset, offset + length);
              }
            }
            
            // Check if the tag has base64 property
            if ('base64' in tag && typeof tag.base64 === 'string') {
              // Convert base64 string to ArrayBuffer
              const binaryString = atob(tag.base64);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              return bytes.buffer as ArrayBuffer;
            }
            
            // Check if the tag has a value property
            if ('value' in tag) {
              const value = tag.value;
              
              // Handle different types of values
              if (value instanceof ArrayBuffer) {
                return value;
              } else if (typeof value === 'string') {
                // Convert base64 string to ArrayBuffer
                const binaryString = atob(value);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes.buffer as ArrayBuffer;
              } else if (value instanceof Uint8Array) {
                return value.buffer as ArrayBuffer;
              }
            }
            
            return undefined;
          } catch (err) {
            if (__DEV__) console.warn(`Error processing ${tagName} tag:`, err);
            return undefined;
          }
        };

        // Try different thumbnail tags in order of preference
        const thumbnailData = getThumbnailData(tags.Thumbnail, 'Thumbnail') ||
                       getThumbnailData(tags['ThumbnailImage'], 'ThumbnailImage') ||
                       getThumbnailData(tags['PreviewImage'], 'PreviewImage') ||
                       getThumbnailData(tags['JPEGThumbnail'], 'JPEGThumbnail');

        if (thumbnailData) {
          // Create a Uint8Array from the ArrayBuffer to ensure proper binary data handling
          const uint8Array = new Uint8Array(thumbnailData);
          // Create a Blob with explicit JPEG MIME type and proper binary data
          const blob = new Blob([uint8Array], { type: 'image/jpeg' });
          thumbnailUrl = URL.createObjectURL(blob);
          setThumbnail(thumbnailUrl);
        } else {
          setError('No thumbnail found in EXIF data');
        }
      } catch (err) {
        if (__DEV__) console.error('Error extracting thumbnail:', err);
        setError('Failed to extract thumbnail from EXIF data');
      } finally {
        setIsLoading(false);
      }
    };

    extractThumbnail();

    // Cleanup function to revoke the object URL when component unmounts or image changes
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
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
      <div className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-accent"></div>
          </div>
        ) : error ? (
          <div className="text-app-accent-dim text-center h-80 flex items-center justify-center">
            {error}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative h-80 w-full cursor-crosshair bg-app-background/20 rounded-lg overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Base layer - Thumbnail */}
            {thumbnail && (
              <img
                src={thumbnail}
                alt="Thumbnail"
                className="absolute inset-0 h-full w-full object-contain bg-black/5"
                onError={(e) => {
                  if (__DEV__) console.error('Thumbnail failed to load:', e);
                  setError('Failed to load thumbnail');
                }}
              />
            )}

            {/* Top layer - Original image with clip path */}
            <img
              src={image.url}
              alt="Original"
              className="absolute inset-0 h-full w-full object-contain bg-black/5"
              style={{
                clipPath: `inset(0 0 0 ${mousePosition * 100}%)`
              }}
            />

            {/* Slider */}
            <div 
              className="absolute inset-y-0 flex items-center justify-center z-10"
              style={{ 
                left: `${mousePosition * 100}%`, 
                transform: 'translateX(-50%)',
                width: '32px'
              }}
            >
              <div className="h-full w-0.5 bg-black/50"></div>
              <div className="absolute bg-white/80 rounded-full p-1.5 shadow-lg">
                <ArrowLeftRight className="w-4 h-4 text-black" />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};