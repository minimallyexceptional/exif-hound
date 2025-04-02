import React from 'react';
import { ChevronLeft, ChevronRight, Dog, ChevronUp } from 'lucide-react';
import { Panel } from './common/Panel';
import { Button } from './common/Button';

interface Props {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  showSidebar?: boolean;
  isGalleryCollapsed?: boolean;
  onToggleGallery?: () => void;
  isEmpty?: boolean;
}

export const AppLayout: React.FC<Props> = ({
  children,
  sidebar,
  showSidebar = false,
  isGalleryCollapsed = false,
  onToggleGallery,
  isEmpty = false
}) => {
  if (isEmpty) {
    return (
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center glass-panel p-6 sm:p-8 rounded-lg max-w-md mx-4">
          <Dog className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-3 sm:mb-4 text-app-white" />
          <p className="text-base sm:text-lg font-medium text-app-white">
            Upload images to start sniffing
          </p>
          <p className="text-xs sm:text-sm text-app-accent-dim mt-2">
            Drag and drop anywhere or use the upload button
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar - Full width on mobile, side panel on desktop */}
      {showSidebar && (
        <div 
          className={`flex-none bg-app-gray border-b lg:border-b-0 lg:border-r border-app-gray-light/30 transition-all duration-300 ease-in-out ${
            isGalleryCollapsed 
              ? 'lg:w-12 h-12 lg:h-[calc(100vh-3.5rem)]' 
              : 'lg:w-[280px] h-[240px] lg:h-[calc(100vh-3.5rem)]'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div 
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-app-gray-light/30 transition-colors border-b border-app-gray-light/30" 
              onClick={onToggleGallery}
            >
              {!isGalleryCollapsed && (
                <h2 className="font-medium text-app-white flex items-center gap-2">
                  Gallery
                </h2>
              )}
              <Button
                variant="ghost"
                className="p-1"
                aria-label={isGalleryCollapsed ? "Expand gallery" : "Collapse gallery"}
              >
                {isGalleryCollapsed ? (
                  <ChevronRight className="hidden lg:block w-5 h-5 text-app-white" />
                ) : (
                  <>
                    <ChevronLeft className="hidden lg:block w-5 h-5 text-app-white" />
                    <ChevronUp className="lg:hidden w-5 h-5 text-app-white" />
                  </>
                )}
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
              isGalleryCollapsed ? 'w-0 lg:h-full' : 'w-full lg:h-full'
            }`}>
              {sidebar}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 h-[calc(100vh-3.5rem)]">
        <div className="h-full p-4 sm:p-6">
          <Panel className="h-full flex flex-col">
            {children}
          </Panel>
        </div>
      </div>
    </main>
  );
}; 