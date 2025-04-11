import { renderHook } from '@testing-library/react';
import { useDeviceStats } from '../useDeviceStats';
import { ImageData } from '../../../../../types';
import { TreeNode } from '../useDeviceHierarchy';

describe('useDeviceStats hook', () => {
  // Helper function to create mock image data
  const createMockImage = (
    id: string, 
    make?: string, 
    model?: string
  ): ImageData => ({
    id,
    url: `test-url-${id}`,
    file: {
      name: `photo${id}.jpg`,
      type: 'image/jpeg',
      size: 1024,
      lastModified: Date.now()
    },
    exif: {
      make,
      model
    }
  });

  // Helper function to create a hierarchy structure
  const createMockHierarchy = (devices: { name: string, count: number }[]): TreeNode => {
    return {
      name: 'Devices',
      children: devices.map(device => ({
        name: device.name,
        children: Array(device.count).fill(0).map((_, idx) => ({
          name: `photo${idx}.jpg`,
          image: createMockImage(`${device.name}-${idx}`)
        }))
      }))
    };
  };

  it('should calculate correct device statistics', () => {
    const images = [
      createMockImage('1', 'Canon', 'EOS 5D'),
      createMockImage('2', 'Canon', 'EOS 5D'),
      createMockImage('3', 'Nikon', 'D850')
    ];

    const hierarchy = createMockHierarchy([
      { name: 'Canon EOS 5D', count: 2 },
      { name: 'Nikon D850', count: 1 }
    ]);

    const { result } = renderHook(() => useDeviceStats(images, hierarchy));

    expect(result.current.uniqueDeviceCount).toBe(2);
    expect(result.current.totalImages).toBe(3);
    expect(result.current.unknownCount).toBe(0);
    expect(result.current.mostCommonDevice).toBe('Canon EOS 5D');
  });

  it('should handle unknown devices', () => {
    const images = [
      createMockImage('1', 'Canon', 'EOS 5D'),
      createMockImage('2'), // Unknown device
      createMockImage('3', 'Nikon') // Only make, considered unknown
    ];

    const hierarchy = createMockHierarchy([
      { name: 'Canon EOS 5D', count: 1 },
      { name: 'Unknown Device', count: 2 }
    ]);

    const { result } = renderHook(() => useDeviceStats(images, hierarchy));

    expect(result.current.uniqueDeviceCount).toBe(2); // Canon EOS 5D and Unknown Device
    expect(result.current.totalImages).toBe(3);
    expect(result.current.unknownCount).toBe(2);
    expect(result.current.mostCommonDevice).toBe('Unknown Device');
  });

  it('should handle empty image list', () => {
    const { result } = renderHook(() => useDeviceStats([], { name: 'Devices', children: [] }));

    expect(result.current.uniqueDeviceCount).toBe(0);
    expect(result.current.totalImages).toBe(0);
    expect(result.current.unknownCount).toBe(0);
    expect(result.current.mostCommonDevice).toBeUndefined();
  });
}); 