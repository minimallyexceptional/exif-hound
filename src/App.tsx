import React, { useState, useEffect } from 'react';
import { ImageData } from './types';
import ImageUploader from './components/ImageUploader';
import Map from './components/Map';
import ExifPanel from './components/ExifPanel';
import ImageGallery from './components/ImageGallery';
import ImageList from './components/ImageList';
import ExportModal from './components/ExportModal';
import Settings from './components/Settings';
import SplashScreen from './components/SplashScreen';
import { AppHeader } from './components/AppHeader';
import { AppLayout } from './components/AppLayout';
import { Panel } from './components/common/Panel';
import { X } from 'lucide-react';
import { Button } from './components/common/Button';

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGalleryCollapsed, setIsGalleryCollapsed] = useState(false);
  const [isExifPanelCollapsed, setIsExifPanelCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleImageUpload = (imageData: ImageData) => {
    setImages(prev => [...prev, imageData]);
    setSelectedImage(imageData);
  };

  const handleUploadClick = () => {
    document.getElementById('headerFileInput')?.click();
  };

  const handleRouteClick = () => {
    setShowRoute(prev => !prev);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'map' ? 'list' : 'map');
  };

  const toggleGallery = () => {
    setIsGalleryCollapsed(prev => !prev);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-app-black">
      <AppHeader
        imagesCount={images.length}
        viewMode={viewMode}
        showRoute={showRoute}
        onUpload={handleUploadClick}
        onExport={() => setShowExportModal(true)}
        onToggleView={toggleViewMode}
        onToggleRoute={handleRouteClick}
        onOpenSettings={() => setShowSettings(true)}
      />

      <ImageUploader 
        onImageUpload={handleImageUpload} 
        inputId="headerFileInput"
        hideDropZone
      />

      <div className="relative flex-1 flex overflow-hidden">
        <AppLayout
          showSidebar={images.length > 0 && viewMode === 'map'}
          isGalleryCollapsed={isGalleryCollapsed}
          onToggleGallery={toggleGallery}
          isEmpty={images.length === 0}
          sidebar={
            <ImageGallery 
              images={images}
              selectedImage={selectedImage}
              onSelect={setSelectedImage}
            />
          }
        >
          <div className="flex-none px-4 sm:px-6 py-4 border-b border-app-gray-light/30">
            <h2 className="text-lg font-semibold text-app-white">
              {viewMode === 'map' ? 'Location Map' : 'Image Details'}
            </h2>
          </div>
          <div className="flex-1 p-4 sm:p-6 min-h-0">
            {viewMode === 'map' ? (
              <div className="h-full">
                <Map 
                  images={images} 
                  selectedImage={selectedImage}
                  showRoute={showRoute}
                />
              </div>
            ) : (
              <ImageList
                images={images}
                selectedImage={selectedImage}
                onSelect={setSelectedImage}
              />
            )}
          </div>
        </AppLayout>

        {/* EXIF Panel - Responsive */}
        {selectedImage && (
          <>
            {/* Desktop */}
            <div className="hidden lg:block w-[400px] p-6 pl-0">
              <Panel className="h-full overflow-hidden">
                <ExifPanel image={selectedImage} />
              </Panel>
            </div>

            {/* Mobile */}
            <div className={`fixed inset-0 lg:hidden z-40 transition-transform duration-300 ${
              isExifPanelCollapsed ? 'translate-y-full' : 'translate-y-0'
            }`}>
              <div 
                className="absolute inset-0 bg-app-black/50 backdrop-blur-sm"
                onClick={() => setIsExifPanelCollapsed(true)}
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 bg-app-gray border-t border-app-gray-light/30">
                  <h3 className="text-sm font-medium text-app-white">Image Details</h3>
                  <Button
                    variant="ghost"
                    className="p-1"
                    onClick={() => setIsExifPanelCollapsed(true)}
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5 text-app-white" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto bg-app-gray">
                  <ExifPanel image={selectedImage} />
                </div>
              </div>
            </div>

            {/* Mobile Toggle Button */}
            <div className="fixed right-4 bottom-4 lg:hidden z-40">
              <Button
                variant="primary"
                onClick={() => setIsExifPanelCollapsed(false)}
                className="shadow-lg"
              >
                View Details
              </Button>
            </div>
          </>
        )}
      </div>

      {showExportModal && (
        <ExportModal
          images={images}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;