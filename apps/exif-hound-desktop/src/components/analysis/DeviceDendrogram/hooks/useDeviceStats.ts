import { useMemo } from 'react';
import { ImageData } from '../../../../types';
import { TreeNode } from './useDeviceHierarchy';

export interface DeviceStats {
  uniqueDeviceCount: number;
  totalImages: number;
  unknownCount: number;
  mostCommonDevice?: string;
}

export const useDeviceStats = (images: ImageData[], data: TreeNode): DeviceStats => {
  return useMemo(() => {
    // Count unique devices
    const uniqueDevices = new Set<string>();
    let totalDeviceImages = 0;
    let unknownDeviceCount = 0;
    
    images.forEach(img => {
      const deviceName = img.exif.make && img.exif.model
        ? `${img.exif.make} ${img.exif.model}`.trim()
        : 'Unknown Device';
        
      uniqueDevices.add(deviceName);
      totalDeviceImages++;
      
      if (deviceName === 'Unknown Device') {
        unknownDeviceCount++;
      }
    });
    
    // Find most common device
    const mostCommonDevice = data.children && data.children.length > 0 
      ? data.children.sort((a, b) => 
          (b.children?.length || 0) - (a.children?.length || 0))[0].name
      : undefined;
    
    return {
      uniqueDeviceCount: uniqueDevices.size,
      totalImages: totalDeviceImages,
      unknownCount: unknownDeviceCount,
      mostCommonDevice
    };
  }, [images, data]);
}; 