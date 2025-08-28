import React, { useEffect, useRef, useState } from 'react';
import { ImageData } from '../types';
import { ChevronUp, ChevronDown, Camera } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from '../context/ThemeContext';
import { formatShortDateTime } from '../utils/date';
import { ImportedPoint } from '../utils/importData';

interface Props {
  images: (ImageData | ImportedPoint)[];
  selectedImage: ImageData | null;
  onSelect: (image: ImageData) => void;
}

const ImageGallery: React.FC<Props> = ({ images, selectedImage, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();

  // Filter out items without valid images
  const imagesWithImages = images.filter(image => {
    const isImportedPoint = 'hasImage' in image;
    return isImportedPoint ? image.hasImage : true;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToImage = (imageId: string) => {
    const container = containerRef.current;
    if (!container) return;

    const imageElement = container.querySelector(`[data-image-id="${imageId}"]`);
    if (imageElement) {
      imageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (selectedImage) {
      scrollToImage(selectedImage.id);
    }
  }, [selectedImage]);

  if (imagesWithImages.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-app-white" />
          <p className="text-app-white">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group h-full">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth px-4 pt-12 pb-12"
      >
        <div className="flex flex-col gap-4">
          {imagesWithImages.map((image) => (
            <div
              key={image.id}
              data-image-id={image.id}
              className="flex-none"
              onClick={() => onSelect(image)}
            >
              <div className={`relative cursor-pointer transition-transform duration-200 ${
                selectedImage?.id === image.id ? 'scale-[1.02]' : 'hover:scale-[1.02]'
              }`}>
                <div className="aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={image.url}
                    alt={image.file.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Hide the image if it fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                      }
                    }}
                  />
                  <div className={`absolute inset-0 ${
                    selectedImage?.id === image.id 
                      ? 'ring-2 ring-app-accent' 
                      : 'group-hover:bg-app-black/10'
                  } transition-all duration-200`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicators (non-obstructive) */}
      <div className={`pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-app-black to-transparent transition-opacity duration-200 ${
        isScrolled ? 'opacity-100' : 'opacity-0'
      }`} aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-app-black to-transparent" aria-hidden="true" />
    </div>
  );
};

export default ImageGallery;