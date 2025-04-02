import React, { useState } from 'react';
import { ImageData } from '../types';
import { Camera, Clock, MapPin, Images, FileText, Image as ImageIcon } from 'lucide-react';
import ImageComparison from './ImageComparison';
import FullExifView from './FullExifView';
import ExifReader from 'exifreader';
import { ExifDetailsView } from './ExifDetailsView';
import { Panel } from './common/Panel';

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
        const tags = await ExifReader.load(image.file, { expanded: true });
        console.log('Full EXIF tags:', tags);
        setRawExif(tags);
      } catch (error) {
        console.error('Error loading EXIF data:', error);
        return;
      }
    }
    setShowFullExif(true);
  };

  return (
    <Panel className="h-full">
      {showFullExif && rawExif ? (
        <FullExifView
          image={image}
          rawExif={rawExif}
          onBack={() => setShowFullExif(false)}
        />
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