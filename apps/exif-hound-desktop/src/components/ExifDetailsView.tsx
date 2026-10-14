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
    <div
      data-testid="exif-sidebar-chrome"
      className="flex-none z-10 border-b border-app-gray-light/40 bg-app-dark"
    >
      <div className="flex flex-col gap-3">
        <h3 className="font-medium text-app-white flex items-center gap-2 px-4 pt-4">
          <ImageIcon className="w-4 h-4 text-app-accent" />
          <span className="truncate selectable-value">{image.file.name}</span>
        </h3>
        <div
          data-testid="exif-sidebar-preview"
          className="relative w-full aspect-video overflow-hidden border-y border-app-gray-light/30"
        >
          <ProjectImage
            image={image}
            alt="Selected"
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
          />
        </div>
        <div className="px-4 pb-4">
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
