import { useMemo } from 'react';
import { ImageData } from '../../../../types';

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  image?: ImageData;
}

export const useDeviceHierarchy = (images: ImageData[]): TreeNode => {
  return useMemo(() => {
    // Group images by device (make + model)
    const deviceGroups = images.reduce((acc, img) => {
      const deviceName = img.exif.make && img.exif.model
        ? `${img.exif.make} ${img.exif.model}`.trim()
        : 'Unknown Device';
      
      if (!acc[deviceName]) {
        acc[deviceName] = [];
      }
      acc[deviceName].push(img);
      return acc;
    }, {} as Record<string, ImageData[]>);

    // Create tree structure
    const root: TreeNode = {
      name: 'Devices',
      children: Object.entries(deviceGroups).map(([device, deviceImages]) => ({
        name: device,
        children: deviceImages.map(img => ({
          name: img.file.name,
          image: img
        }))
      }))
    };

    return root;
  }, [images]);
}; 