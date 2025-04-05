import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Cluster } from '@visx/hierarchy';
import { LinkHorizontal } from '@visx/shape';
import { hierarchy } from 'd3-hierarchy';
import { ImageData } from '../../types';

interface Props {
  images: ImageData[];
  width: number;
  height: number;
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
  image?: ImageData;
}

const DeviceDendrogram: React.FC<Props> = ({ images, width, height }) => {
  const margin = { top: 40, left: 40, right: 160, bottom: 40 };
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

  const defaultColor = '#26A69A';
  const defaultNodeColor = '#4A90E2';

  return (
    <div className="w-full h-full">
      <svg width={width} height={height}>
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

export default DeviceDendrogram; 