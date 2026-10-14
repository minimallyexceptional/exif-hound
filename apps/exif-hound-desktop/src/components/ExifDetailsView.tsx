import React from 'react';
import { ImageIcon, Images } from 'lucide-react';
import { ImageData } from '../types';
import { Button } from './common/Button';
import { ProjectImage } from './ProjectImage';

interface Props {
  image: ImageData;
  onShowComparison: (image: ImageData) => void;
}

export function ExifDetailsView({ image, onShowComparison }: Props) {
  return (
    <div className="flex-none p-4 border-b border-app-gray-light/30">
      <div className="flex gap-4">
        <div className="flex-none w-32 h-32">
          <div className="relative w-full h-full rounded-lg overflow-hidden border border-app-gray-light/30">
            <ProjectImage
              image={image}
              alt="Selected"
              className="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-app-white flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-app-accent" />
            <span className="truncate selectable-value">{image.file.name}</span>
          </h3>
          <Button
            variant="secondary"
            onClick={() => onShowComparison(image)}
            className="w-full flex items-center justify-center gap-2 py-1.5"
            icon={<Images className="w-4 h-4" />}
          >
            Compare with EXIF Thumbnail
          </Button>
        </div>
      </div>
    </div>
  );
}
