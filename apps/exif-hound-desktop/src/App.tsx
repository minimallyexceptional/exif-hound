import { useState, useEffect, Suspense, lazy } from 'react';
import { ImageData, ImportData } from './types';
import ImageUploader from './components/ImageUploader';
import ExifPanel from './components/ExifPanel';
import ImageGallery from './components/ImageGallery';
import ImageList from './components/ImageList';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import Settings from './components/Settings';
import SplashScreen from './components/SplashScreen';
import { AppHeader } from './components/AppHeader';
import { AppLayout } from './components/AppLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './components/common/Button';
import { ImageComparison } from './components/ImageComparison';
import { parseImportData, ImportedData, ImportedPoint } from './utils/importData';
import { UpdateNotification } from './components/updater/UpdateNotification';
import { getUpdateService } from './services/updater';

// Lazy load heavy components for code splitting
const Map = lazy(() => import('./components/Map'));
const Investigation = lazy(() => import('./components/Investigation'));

type ViewMode = 'map' | 'list' | 'investigation';

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGalleryCollapsed, setIsGalleryCollapsed] = useState(false);
  const [isExifPanelCollapsed, setIsExifPanelCollapsed] = useState(false);
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [comparisonImage, setComparisonImage] = useState<ImageData | null>(null);
  const [importedData, setImportedData] = useState<ImportedData | undefined>(undefined);

  useEffect(() => {
    // Remove artificial delay - app should be interactive immediately
    setIsLoading(false);
  }, []);

  const handleImageUpload = (imageData: ImageData) => {
    // ImageUploader emits each image twice (placeholder while processing, then
    // the EXIF-filled result) — upsert by id instead of appending duplicates.
    setImages(prev => {
      const index = prev.findIndex(img => img.id === imageData.id);
      if (index === -1) return [...prev, imageData];
      const next = [...prev];
      next[index] = imageData;
      return next;
    });
    setSelectedImage(imageData);
  };

  const handleUploadClick = () => {
    document.getElementById('headerFileInput')?.click();
  };

  const handleRouteClick = () => {
    setShowRoute(prev => !prev);
  };

  const toggleGallery = () => {
    setIsGalleryCollapsed(prev => !prev);
  };

  const handleShowComparison = (image: ImageData) => {
    setComparisonImage(image);
    setShowImageComparison(true);
  };

  const handleImport = async (data: ImportData) => {
    try {
      const result = await parseImportData(data);
      setImportedData(result);
      
      if (result.type === 'csv' && result.points) {
        const points = result.points as ImportedPoint[];
        setImages(prevImages => [...prevImages, ...points]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to import data:', error);
      }
      // TODO: Show error to user
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'map':
        return 'Location Map';
      case 'list':
        return 'Image Details';
      case 'investigation':
        return 'Investigation';
      default:
        return '';
    }
  };

  const renderView = () => {
    switch (viewMode) {
      case 'map':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full">
            <div className="text-app-white">Loading map...</div>
          </div>}>
            <Map
              images={images}
              selectedImage={selectedImage}
              showRoute={showRoute}
              onToggleRoute={handleRouteClick}
              onSelectImage={setSelectedImage}
              onOpenImport={() => setShowImportModal(true)}
              importedData={importedData}
            />
          </Suspense>
        );
      case 'list':
        return (
          <ImageList
            images={images}
            selectedImage={selectedImage}
            onSelect={setSelectedImage}
          />
        );
      case 'investigation':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full">
            <div className="text-app-white">Loading investigation tools...</div>
          </div>}>
            <Investigation images={images} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-app-black">
      <AppHeader
        imagesCount={images.length}
        viewMode={viewMode}
        onUpload={handleUploadClick}
        onExport={() => setShowExportModal(true)}
        onOpenSettings={() => setShowSettings(true)}
        onSetView={(view: ViewMode) => setViewMode(view)}
        onCheckForUpdates={() => {
          // Keep manual checks observable: Settings shows checking/current
          // status while the global updater surface handles updates/errors.
          setShowSettings(true);
          void getUpdateService().check({ silent: false });
        }}
      />

      <ImageUploader 
        onImageUpload={handleImageUpload} 
        inputId="headerFileInput"
        hideDropZone
      />

      <div className="flex-1 flex overflow-hidden">
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
              {getViewTitle()}
            </h2>
          </div>
          <div className="flex-1 min-h-0">
            {renderView()}
          </div>
        </AppLayout>

        {/* EXIF Panel - Only show for map and list views */}
        {selectedImage && viewMode !== 'investigation' && (
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

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
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
      {/*
        Auto-update discovery + update dialogs. Fully silent unless an
        update is found or the user initiates an action; loaded images are
        in-memory only, so any loaded content counts as unsaved work and
        the updater will confirm before restarting.
      */}
      <UpdateNotification hasUnsavedWork={() => images.length > 0} />
    </div>
  );
}

export default App;
