import React, { useState, Suspense, lazy } from 'react';
import type { ExpandedTags } from 'exif-hound-core';
import { ImageData } from '../types';
import { useCore } from '../core/CoreContext';
import { ExifDetailsView } from './ExifDetailsView';
import { Panel } from './common/Panel';

// Lazy load FullExifView to reduce initial bundle size
const FullExifView = lazy(() => import('./FullExifView'));

interface Props {
  image: ImageData;
  onShowComparison: (image: ImageData) => void;
}

export default function ExifPanel({ image, onShowComparison }: Props) {
  const core = useCore();
  const [showFullExif, setShowFullExif] = useState(false);
  const [rawExif, setRawExif] = useState<ExpandedTags | null>(null);

  const handleViewFullExif = async () => {
    if (!rawExif) {
      if (!(image.file instanceof File)) {
        return;
      }
      try {
        const buffer = await image.file.arrayBuffer();
        const tags = await core.middleware.exif.loadExifReaderTags(buffer, { expanded: true });
        if (__DEV__) {
          console.log('Full EXIF tags:', tags);
        }
        setRawExif(tags);
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading EXIF data:', error);
        }
        return;
      }
    }
    setShowFullExif(true);
  };

  return (
    <Panel className="h-full">
      {showFullExif && rawExif ? (
        <Suspense fallback={<div className="flex items-center justify-center h-full">
          <div className="text-app-white">Loading EXIF viewer...</div>
        </div>}>
          <FullExifView
            image={image}
            rawExif={rawExif}
            onBack={() => setShowFullExif(false)}
          />
        </Suspense>
      ) : (
        <ExifDetailsView
          image={image}
          onViewFullExif={handleViewFullExif}
          onShowComparison={onShowComparison}
        />
      )}
    </Panel>
  );
}
