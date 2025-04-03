import React, { useState, useEffect } from 'react';
import { ImageData } from './types';
import Map from './components/Map';
import ExifPanel from './components/ExifPanel';
import ImageGallery from './components/ImageGallery';
import ImageList from './components/ImageList';
import { ExportModal } from './components/ExportModal';
import Settings from './components/Settings';
import SplashScreen from './components/SplashScreen';
import { AppHeader } from './components/AppHeader';
import { AppLayout } from './components/AppLayout';
import { Panel } from './components/common/Panel';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './components/common/Button';
import ImageComparison from './components/ImageComparison';
import { readFile } from './utils/fileUtils';

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
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [comparisonImage, setComparisonImage] = useState<ImageData | null>(null);

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

  const handleUploadClick = async () => {
    try {
      const filePaths = await window.api.selectFiles();
      if (filePaths.length === 0) return;

      for (const filePath of filePaths) {
        const imageData = await readFile(filePath);
        if (imageData) {
          handleImageUpload(imageData);
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
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

  const handleShowComparison = (image: ImageData) => {
    setComparisonImage(image);
    setShowImageComparison(true);
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
          <div className={`flex-none bg-app-gray border-l border-app-gray-light/30 transition-all duration-300 ease-in-out ${
            isExifPanelCollapsed ? 'w-12' : 'w-[400px]'
          }`}>
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div 
                className={`flex items-center border-b border-app-gray-light/30 transition-colors cursor-pointer ${
                  isExifPanelCollapsed 
                    ? 'h-12 justify-center hover:bg-app-gray-light/30' 
                    : 'h-12 px-4 justify-between hover:bg-app-gray-light/30'
                }`}
                onClick={() => setIsExifPanelCollapsed(prev => !prev)}
              >
                {!isExifPanelCollapsed && (
                  <h2 className="font-medium text-app-white flex items-center gap-2">
                    Details
                  </h2>
                )}
                <Button
                  variant="ghost"
                  className="w-8 h-8 !p-0"
                  aria-label={isExifPanelCollapsed ? "Expand details" : "Collapse details"}
                >
                  {isExifPanelCollapsed ? (
                    <ChevronLeft className="w-7 h-7 text-app-white" />
                  ) : (
                    <ChevronRight className="w-7 h-7 text-app-white" />
                  )}
                </Button>
              </div>

              {/* Panel Content */}
              <div className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
                isExifPanelCollapsed ? 'w-0' : 'w-full'
              }`}>
                <ExifPanel 
                  image={selectedImage} 
                  onShowComparison={handleShowComparison}
                />
              </div>
            </div>
          </div>
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

      {showImageComparison && comparisonImage && (
        <ImageComparison
          image={comparisonImage}
          onClose={() => {
            setShowImageComparison(false);
            setComparisonImage(null);
          }}
        />
      )}
    </div>
  );
}

export default App;