import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ImageData } from '../types';
import { Camera } from 'lucide-react';
import { ImportedPoint } from '../utils/importData';

interface Props {
  images: (ImageData | ImportedPoint)[];
  selectedImage: ImageData | null;
  onSelect: (image: ImageData) => void;
  orientation?: 'vertical' | 'horizontal';
}

// Memoized gallery item component to prevent unnecessary re-renders
const GalleryItem = React.memo<{
  image: ImageData;
  isSelected: boolean;
  onSelect: (image: ImageData) => void;
  orientation: 'vertical' | 'horizontal';
}>(({ image, isSelected, onSelect, orientation }) => (
  <button
    type="button"
    className="block w-full flex-none text-left"
    data-testid="gallery-item"
    data-file-name={image.file.name}
    data-processing={String(image.isProcessing ?? false)}
    aria-label={`Select ${image.file.name}`}
    aria-pressed={isSelected}
    onClick={() => onSelect(image)}
    onKeyDown={(event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect(image);
      }
    }}
  >
    <div className={`relative cursor-pointer transition-transform duration-200 ${orientation === 'vertical' ? 'w-full' : 'w-[148px]'} ${
      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02]'
    }`}>
      <div className="aspect-[3/2] w-full rounded-lg overflow-hidden shadow-lg">
        <img
          src={image.url}
          alt={image.file.name}
          className={`h-full w-full object-cover transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-70'}`}
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
        <div className={`pointer-events-none absolute inset-0 rounded-lg ${
          isSelected 
            ? 'ring-[3px] ring-app-accent'
            : 'group-hover:bg-app-black/10'
        } transition-all duration-200`} />
      </div>
    </div>
  </button>
));

GalleryItem.displayName = 'GalleryItem';

const ImageGallery: React.FC<Props> = ({ images, selectedImage, onSelect, orientation = 'vertical' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Filter out items without valid images - memoized
  const imagesWithImages = useMemo(() => {
    return images.filter(image => {
      const isImportedPoint = 'hasImage' in image;
      return isImportedPoint ? image.hasImage : true;
    });
  }, [images]);

  const isHorizontal = orientation === 'horizontal';

  const virtualizer = useVirtualizer({
    count: imagesWithImages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => isHorizontal ? 164 : 200,
    horizontal: isHorizontal,
    overscan: 3,
  });

  // Memoized select handler
  const handleSelect = useCallback((image: ImageData) => {
    onSelect(image);
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(isHorizontal ? container.scrollLeft > 0 : container.scrollTop > 0);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isHorizontal]);

  const scrollToImage = useCallback((imageId: string) => {
    const imageIndex = imagesWithImages.findIndex(img => img.id === imageId);
    if (imageIndex !== -1) {
      virtualizer.scrollToIndex(imageIndex, { align: 'center' });
    }
  }, [imagesWithImages, virtualizer]);

  useEffect(() => {
    if (selectedImage) {
      scrollToImage(selectedImage.id);
    }
  }, [selectedImage, scrollToImage]);

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
        className={`h-full scroll-smooth ${isHorizontal
          ? 'overflow-x-auto overflow-y-hidden px-3 py-2'
          : 'overflow-y-auto overflow-x-hidden px-4 pt-12 pb-12'}`}
      >
        {/* Virtualized list container */}
        <div
          style={{
            height: isHorizontal ? '100%' : `${virtualizer.getTotalSize()}px`,
            width: isHorizontal ? `${virtualizer.getTotalSize()}px` : '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const image = imagesWithImages[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-image-id={image.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: isHorizontal ? `${virtualItem.size}px` : '100%',
                  height: isHorizontal ? '100%' : `${virtualItem.size}px`,
                  transform: isHorizontal
                    ? `translateX(${virtualItem.start}px)`
                    : `translateY(${virtualItem.start}px)`,
                  paddingRight: isHorizontal ? '16px' : undefined,
                  paddingBottom: isHorizontal ? undefined : '16px',
                }}
              >
                <GalleryItem
                  image={image}
                  isSelected={selectedImage?.id === image.id}
                  onSelect={handleSelect}
                  orientation={orientation}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll indicators (non-obstructive) */}
      {!isHorizontal && <div className={`pointer-events-none absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-app-black to-transparent transition-opacity duration-200 ${
        isScrolled ? 'opacity-100' : 'opacity-0'
      }`} aria-hidden="true" />}
      {isHorizontal && isScrolled && <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r from-app-gray to-transparent" aria-hidden="true" />}
      {isHorizontal
        ? <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l from-app-gray to-transparent" aria-hidden="true" />
        : <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-app-black to-transparent" aria-hidden="true" />}
    </div>
  );
};

export default ImageGallery;
