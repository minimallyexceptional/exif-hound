import React, { useEffect, useRef, useState } from 'react';
import { ImageData } from '../types';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from '../context/ThemeContext';
import { formatShortDateTime } from '../utils/date';

interface Props {
  images: ImageData[];
  selectedImage: ImageData | null;
  onSelect: (image: ImageData) => void;
}

const ImageGallery: React.FC<Props> = ({ images, selectedImage, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      const currentIndex = images.findIndex(img => img.id === selectedImage.id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowUp' && currentIndex > 0) {
        onSelect(images[currentIndex - 1]);
      } else if (e.key === 'ArrowDown' && currentIndex < images.length - 1) {
        onSelect(images[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [images, selectedImage, onSelect]);

  useEffect(() => {
    if (selectedImage && containerRef.current) {
      const selectedElement = containerRef.current.querySelector(`[data-image-id="${selectedImage.id}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedImage]);

  const handlePrevious = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex > 0) {
      onSelect(images[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex < images.length - 1) {
      onSelect(images[currentIndex + 1]);
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="relative group h-full py-12">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth px-4"
      >
        <div className="flex flex-col gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              data-image-id={image.id}
              className="flex-none"
              onClick={() => onSelect(image)}
            >
              <div className={`relative cursor-pointer transition-transform duration-200 ${
                selectedImage?.id === image.id ? 'scale-[1.02]' : 'hover:scale-[1.02]'
              }`}>
                {image.isProcessing ? (
                  <Skeleton height={160} className="rounded-lg" />
                ) : (
                  <>
                    <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                      <img
                        src={image.url}
                        alt={image.file.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 ${
                        selectedImage?.id === image.id 
                          ? 'ring-2 ring-app-accent' 
                          : 'group-hover:bg-app-black/10'
                      } transition-all duration-200`} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className={`${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} rounded-lg px-3 py-2 shadow-lg`}>
                        <p className="text-sm font-medium truncate">
                          {image.file.name}
                        </p>
                        <p className={`text-xs mt-0.5 truncate ${theme === 'dark' ? 'text-white/70' : 'text-black/70'}`}>
                          {image.exif.dateTimeOriginal ? formatShortDateTime(image.exif.dateTimeOriginal) : 'No date available'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className={`absolute top-2 left-1/2 -translate-x-1/2 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
            } shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:${
              theme === 'dark' ? 'bg-black/95' : 'bg-white/95'
            } disabled:opacity-30`}
            aria-label="Previous image"
            disabled={!selectedImage || images.indexOf(selectedImage) === 0}
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
            } shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:${
              theme === 'dark' ? 'bg-black/95' : 'bg-white/95'
            } disabled:opacity-30`}
            aria-label="Next image"
            disabled={!selectedImage || images.indexOf(selectedImage) === images.length - 1}
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </>
      )}

      {images.length > 1 && showTooltip && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2">
          <div className={`text-sm ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} px-4 py-2 rounded-full shadow-lg opacity-100 transition-opacity duration-300`}>
            Use ↑ ↓ arrow keys to navigate
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;