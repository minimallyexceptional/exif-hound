import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ExifPanel from './ExifPanel';
import { ExifErrorBoundary } from './ExifErrorBoundary';
import { SidebarRailToggle } from './common/SidebarRailToggle';
import type { ImageData } from '../types';

interface Props {
  collapsed: boolean;
  image: ImageData | null;
  onToggle: () => void;
  onShowComparison: (image: ImageData) => void;
}

export function ExifDetailsPanel({
  collapsed,
  image,
  onToggle,
  onShowComparison,
}: Props) {
  return (
    <div
      className={`flex-none bg-app-gray border-l border-app-gray-light/30 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-12' : 'w-[400px]'
      }`}
    >
      <div className="flex flex-col h-full">
        <SidebarRailToggle
          expanded={!collapsed}
          onToggle={onToggle}
          screenReaderLabel="Image details panel"
          testId="exif-details-toggle"
          className={`flex items-center border-b border-app-gray-light/30 transition-colors cursor-pointer ${
            collapsed
              ? 'h-12 justify-center hover:bg-app-gray-light/30'
              : 'h-12 px-4 justify-between hover:bg-app-gray-light/30'
          }`}
          leading={!collapsed ? (
            <h2 className="font-medium text-app-white flex items-center gap-2">
              Details
            </h2>
          ) : undefined}
          chevron={collapsed ? (
            <ChevronLeft className="w-7 h-7 text-app-white" />
          ) : (
            <ChevronRight className="w-7 h-7 text-app-white" />
          )}
        />

        <div className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
          collapsed ? 'w-0' : 'w-full'
        }`}
        >
          {collapsed ? null : image ? (
            <ExifErrorBoundary key={image.id}>
              <ExifPanel
                image={image}
                onShowComparison={onShowComparison}
              />
            </ExifErrorBoundary>
          ) : (
            <p className="p-4 text-sm text-app-accent-dim">Select an image to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
