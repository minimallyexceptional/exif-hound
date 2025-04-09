import React, { useMemo } from 'react';
import L from 'leaflet';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Marker, Circle, useMap } from 'react-leaflet';
import { ImagePopup } from './ImagePopup';
import { ImportedPoint } from '../../../../utils/importData';

interface ImageClusterProps {
  images: (ImageData | ImportedPoint)[];
  onSelectImage: (image: ImageData) => void;
  enableClustering?: boolean;
}

export const ImageCluster: React.FC<ImageClusterProps> = ({ 
  images, 
  onSelectImage,
  enableClustering = true
}) => {
  const map = useMap();

  // Create custom camera icon
  const cameraIcon = useMemo(() => {
    if (!map) return null;
    
    return new L.DivIcon({
      className: 'custom-marker',
      html: `
        <svg width="32" height="32" viewBox="0 0 492 492" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="246" cy="246" r="234.666" fill="#111111" stroke="white" stroke-width="22.6677"/>
          <path d="M272.942 159.789H219.06L192.119 192.118H159.789C154.073 192.118 148.591 194.389 144.549 198.431C140.507 202.473 138.236 207.955 138.236 213.671V310.659C138.236 316.375 140.507 321.857 144.549 325.899C148.591 329.941 154.073 332.212 159.789 332.212H332.212C337.928 332.212 343.41 329.941 347.452 325.899C351.494 321.857 353.765 316.375 353.765 310.659V213.671C353.765 207.955 351.494 202.473 347.452 198.431C343.41 194.389 337.928 192.118 332.212 192.118H299.883L272.942 159.789Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M245.999 289.106C263.854 289.106 278.329 274.632 278.329 256.777C278.329 238.922 263.854 224.447 245.999 224.447C228.144 224.447 213.67 238.922 213.67 256.777C213.67 274.632 228.144 289.106 245.999 289.106Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }, [map]);

  const validMarkers = useMemo(() => {
    return images
      .map(image => {
        const coords = fixCoordinates(image.exif.latitude ?? null, image.exif.longitude ?? null);
        if (!coords) return null;
        return { image, coords };
      })
      .filter((item): item is { image: ImageData | ImportedPoint; coords: [number, number] } => item !== null);
  }, [images]);

  if (!map || !cameraIcon) return null;

  const renderMarker = ({ image, coords }: { image: ImageData | ImportedPoint; coords: [number, number] }) => {
    const isImportedPoint = 'hasImage' in image;
    const hasImage = isImportedPoint ? image.hasImage : true;

    if (!hasImage) {
      return (
        <Circle
          key={image.id}
          center={coords}
          radius={100}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.5,
            weight: 2
          }}
        >
          <ImagePopup image={image} />
        </Circle>
      );
    }

    return (
      <Marker
        key={image.id}
        position={coords}
        icon={cameraIcon}
        eventHandlers={{
          click: () => onSelectImage(image)
        }}
      >
        <ImagePopup image={image} />
      </Marker>
    );
  };

  if (enableClustering) {
    return (
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={40}
        iconCreateFunction={(cluster) => {
          return new L.DivIcon({
            className: 'custom-cluster-marker',
            html: `<div class="cluster-count">${cluster.getChildCount()}</div>`,
            iconSize: [40, 40]
          });
        }}
      >
        {validMarkers.map(renderMarker)}
      </MarkerClusterGroup>
    );
  }

  return <>{validMarkers.map(renderMarker)}</>;
}; 