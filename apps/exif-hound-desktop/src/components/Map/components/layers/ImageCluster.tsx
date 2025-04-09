import React from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { ImageData } from '../../../../types';
import { ImageMarker } from './ImageMarker';

interface ImageClusterProps {
  images: ImageData[];
  onSelectImage: (image: ImageData) => void;
}

export const ImageCluster: React.FC<ImageClusterProps> = ({ images, onSelectImage }) => {
  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={80}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
      zoomToBoundsOnClick={true}
    >
      {images.map((image) => (
        <ImageMarker
          key={image.id}
          image={image}
          onClick={() => onSelectImage(image)}
        />
      ))}
    </MarkerClusterGroup>
  );
}; 