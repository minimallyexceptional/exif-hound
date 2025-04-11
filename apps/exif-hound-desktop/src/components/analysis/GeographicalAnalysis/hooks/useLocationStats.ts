import { useMemo } from 'react';
import { ImageData } from '../../../../types';

// Constants
export const CLUSTER_RADIUS_KM = 1; // Images within 1km are considered in the same cluster
export const KM_TO_DEG = 1 / 111; // Rough conversion from kilometers to degrees

export interface LocationCluster {
  latitude: number;
  longitude: number;
  count: number;
  images: ImageData[];
  timeRange: {
    earliest: Date;
    latest: Date;
  };
}

export interface LocationStats {
  totalWithLocation: number;
  uniqueLocations: number;
  clusters: LocationCluster[];
  timeSpan: {
    start: Date | null;
    end: Date | null;
  };
}

export const useLocationStats = (images: ImageData[]): LocationStats => {
  return useMemo<LocationStats>(() => {
    const imagesWithLocation = images.filter(
      img => img.exif.latitude != null && img.exif.longitude != null
    );

    const clusters: LocationCluster[] = [];
    const processedCoords = new Set<string>();

    imagesWithLocation.forEach(img => {
      const lat = img.exif.latitude!;
      const lng = img.exif.longitude!;
      const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;

      if (processedCoords.has(coordKey)) return;
      processedCoords.add(coordKey);

      // Find nearby images
      const nearbyImages = imagesWithLocation.filter(other => {
        if (!other.exif.latitude || !other.exif.longitude) return false;
        const dlat = Math.abs(other.exif.latitude - lat);
        const dlng = Math.abs(other.exif.longitude - lng);
        return dlat < CLUSTER_RADIUS_KM * KM_TO_DEG && dlng < CLUSTER_RADIUS_KM * KM_TO_DEG;
      });

      if (nearbyImages.length > 0) {
        // Calculate time range for the cluster
        const dates = nearbyImages
          .map(img => img.exif.dateTimeOriginal)
          .filter((date): date is string => date !== null && date !== undefined)
          .map(date => new Date(date));

        const timeRange = {
          earliest: dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
          latest: dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
        };

        clusters.push({
          latitude: lat,
          longitude: lng,
          count: nearbyImages.length,
          images: nearbyImages,
          timeRange
        });
      }
    });

    // Calculate overall time span
    const allDates = imagesWithLocation
      .map(img => img.exif.dateTimeOriginal)
      .filter((date): date is string => date !== null && date !== undefined)
      .map(date => new Date(date));

    const timeSpan = {
      start: allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : null,
      end: allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null
    };

    return {
      totalWithLocation: imagesWithLocation.length,
      uniqueLocations: clusters.length,
      clusters,
      timeSpan
    };
  }, [images]);
}; 