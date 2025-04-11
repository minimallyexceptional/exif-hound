import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { Cluster } from '@visx/hierarchy';
import { LinkHorizontal } from '@visx/shape';
import { hierarchy } from 'd3-hierarchy';
import { ImageData } from '../../types';
import { CircuitBoard, Smartphone, Image } from 'lucide-react';

interface Props {
  images: ImageData[];
  width: number;
  height: number;
  showStats?: boolean;
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
  image?: ImageData;
}

const DeviceDendrogram: React.FC<Props> = ({ images, width, height, showStats = true }) => {
  const margin = { 
    top: showStats ? 100 : 40, 
    left: 40, 
    right: 160, 
    bottom: 40 
  };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const data = useMemo(() => {
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
  
  // Calculate some statistics about the devices
  const deviceStats = useMemo(() => {
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
    
    return {
      uniqueDeviceCount: uniqueDevices.size,
      totalImages: totalDeviceImages,
      unknownCount: unknownDeviceCount
    };
  }, [images]);

  const defaultColor = '#26A69A';
  const defaultNodeColor = '#4A90E2';

  return (
    <div className="w-full h-full">
      {/* Stats Display - Only show when showStats is true */}
      {showStats && (
        <div className="flex gap-4 p-4 mb-2">
          <div className="glass-panel p-2 rounded-lg flex-1">
            <div className="flex items-center gap-2">
              <CircuitBoard className="w-4 h-4 text-app-accent" />
              <div className="text-xs text-app-accent-dim">Unique Devices</div>
            </div>
            <div className="text-lg font-semibold text-app-white">
              {deviceStats.uniqueDeviceCount}
            </div>
          </div>
          <div className="glass-panel p-2 rounded-lg flex-1">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-app-accent" />
              <div className="text-xs text-app-accent-dim">Most Common</div>
            </div>
            <div className="text-sm font-semibold text-app-white truncate">
              {data.children && data.children.length > 0 
                ? data.children.sort((a, b) => 
                    (b.children?.length || 0) - (a.children?.length || 0))[0].name
                : 'None'}
            </div>
          </div>
          <div className="glass-panel p-2 rounded-lg flex-1">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-app-accent" />
              <div className="text-xs text-app-accent-dim">Total Images</div>
            </div>
            <div className="text-lg font-semibold text-app-white">
              {deviceStats.totalImages}
            </div>
          </div>
        </div>
      )}
      
      <svg width={width} height={height - (showStats ? 80 : 0)}>
        <Group top={margin.top} left={margin.left}>
          <Cluster<TreeNode>
            root={hierarchy(data)}
            size={[innerHeight, innerWidth]}
          >
            {(cluster) => (
              <Group>
                {/* Draw links between nodes */}
                {cluster.links().map((link, i) => (
                  <LinkHorizontal
                    key={`link-${i}`}
                    data={link}
                    stroke={defaultColor}
                    strokeWidth={1}
                    strokeOpacity={0.2}
                    fill="none"
                  />
                ))}
                
                {/* Draw nodes */}
                {cluster.descendants().map((node, i) => (
                  <Group
                    key={`node-${i}`}
                    top={node.x}
                    left={node.y}
                  >
                    {/* Node circle */}
                    <circle
                      r={4}
                      fill={
                        node.data.image
                          ? defaultNodeColor
                          : node.depth === 0
                          ? '#F9A825'
                          : defaultColor
                      }
                      opacity={0.6}
                    />
                    
                    {/* Node label */}
                    <text
                      dy=".33em"
                      fontSize={9}
                      fontFamily="Arial"
                      textAnchor={node.children ? 'end' : 'start'}
                      x={node.children ? -6 : 6}
                      fill="#E0E0E0"
                      style={{
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {node.data.name}
                    </text>
                  </Group>
                ))}
              </Group>
            )}
          </Cluster>
        </Group>
      </svg>
    </div>
  );
};

DeviceDendrogram.defaultProps = {
  showStats: true
};

export default DeviceDendrogram; 