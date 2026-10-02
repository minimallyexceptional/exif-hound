import React, { useState, Suspense, lazy } from 'react';
import { ImageData } from '../types';
import { Camera, Clock, MapPin, Images, FileText, Image as ImageIcon } from 'lucide-react';
import { ImageComparison } from './ImageComparison';
import { ExifDetailsView } from './ExifDetailsView';
import { Panel } from './common/Panel';

// Lazy load FullExifView to reduce initial bundle size
const FullExifView = lazy(() => import('./FullExifView'));

interface Props {
  image: ImageData;
  onShowComparison: (image: ImageData) => void;
}

export default function ExifPanel({ image, onShowComparison }: Props) {
  const { exif } = image;
  const [showComparison, setShowComparison] = useState(false);
  const [showFullExif, setShowFullExif] = useState(false);
  const [rawExif, setRawExif] = useState<any>(null);

  const hasValidCoordinates = 
    typeof exif.latitude === 'number' && 
    typeof exif.longitude === 'number' && 
    !isNaN(exif.latitude) && 
    !isNaN(exif.longitude);

  const formatCoordinates = () => {
    if (!hasValidCoordinates || exif.latitude == null || exif.longitude == null) {
      return 'No location data available';
    }
    return `${exif.latitude.toFixed(6)}, ${exif.longitude.toFixed(6)}`;
  };

  const handleViewFullExif = async () => {
    if (!rawExif) {
      try {
        // Dynamically import ExifReader when needed
        const ExifReaderModule = await import('exifreader');
        const ExifReader = ExifReaderModule.default;
        const tags = await ExifReader.load(image.file as any, { expanded: true });
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