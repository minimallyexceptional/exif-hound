import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/controls.css';
import { ImageData } from '../../../../types';

interface ReticleLayerProps {
  images: ImageData[];
  onSelectImage: (image: ImageData, fromReticle?: boolean) => void;
}

const ReticleLayer: React.FC<ReticleLayerProps> = ({ images, onSelectImage }) => {
  const map = useMap();
  const [isMoving, setIsMoving] = useState(false);

  React.useEffect(() => {
    // Create reticle container
    const reticleContainer = L.DomUtil.create('div', 'reticle-container');
    reticleContainer.innerHTML = `
      <div class="reticle-circle">
        <div class="reticle-crosshair">
          <div class="reticle-vertical"></div>
          <div class="reticle-horizontal"></div>
        </div>
      </div>
      <div class="reticle-coordinates"></div>
    `;

    // Wait for map container to be ready
    const initReticle = () => {
      const mapContainer = map.getContainer();
      if (mapContainer && !mapContainer.querySelector('.reticle-container')) {
        mapContainer.appendChild(reticleContainer);
      }
    };

    // Try to initialize immediately
    initReticle();

    // If not ready, wait for map to be ready
    if (!map.getContainer().querySelector('.reticle-container')) {
      const readyHandler = () => {
        initReticle();
        map.off('load', readyHandler);
      };
      map.on('load', readyHandler);
    }

    // Format coordinate to ensure it's within valid range and has proper precision
    const formatCoordinate = (coord: number): string => {
      // Normalize the coordinate to be within -180 to 180 for longitude
      // and -90 to 90 for latitude
      let normalized = coord;
      if (Math.abs(coord) > 180) {
        normalized = coord % 180;
      }
      return normalized.toFixed(6).replace(/\.?0+$/, '');
    };

    // Update coordinates and check for images on move
    const updateCoordinates = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const coordinates = reticleContainer.querySelector('.reticle-coordinates');
      if (coordinates) {
        const lat = formatCoordinate(center.lat);
        const lng = formatCoordinate(center.lng);
        coordinates.textContent = `${lat}, ${lng} (z${zoom})`;
      }

      // Only check for images if not moving
      if (!isMoving) {
        // Check if reticle is over an image
        const reticlePoint = map.latLngToContainerPoint(center);
        const reticleBounds = L.bounds(
          reticlePoint.subtract([30, 30]), // Increased from 12 to 30 pixels (60x60 pixel area)
          reticlePoint.add([30, 30])
        );

        // Find the closest image within reticle bounds
        let closestImage: ImageData | null = null;
        let minDistance = Infinity;

        images.forEach(image => {
          if (image.exif.latitude && image.exif.longitude) {
            const imagePoint = map.latLngToContainerPoint([image.exif.latitude, image.exif.longitude]);
            
            if (reticleBounds.contains(imagePoint)) {
              const distance = reticlePoint.distanceTo(imagePoint);
              if (distance < minDistance) {
                minDistance = distance;
                closestImage = image;
              }
            }
          }
        });

        // Select the closest image if found
        if (closestImage) {
          onSelectImage(closestImage, true);
        }
      }
    };

    // Add smooth transition class when moving
    const handleMoveStart = () => {
      setIsMoving(true);
      reticleContainer.classList.add('reticle-moving');
    };

    const handleMoveEnd = () => {
      setIsMoving(false);
      reticleContainer.classList.remove('reticle-moving');
      // Update coordinates and check for images after movement ends
      updateCoordinates();
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);
    map.on('move', updateCoordinates);
    map.on('zoom', updateCoordinates);
    map.on('zoomend', updateCoordinates);

    // Initial update
    updateCoordinates();

    return () => {
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      map.off('move', updateCoordinates);
      map.off('zoom', updateCoordinates);
      map.off('zoomend', updateCoordinates);
      if (reticleContainer.parentNode) {
        reticleContainer.parentNode.removeChild(reticleContainer);
      }
    };
  }, [map, images, onSelectImage, isMoving]);

  return null;
};

export default ReticleLayer; 