import { useState, Suspense, lazy } from 'react';
import { ImageData, ImportData } from './types';
import ImageUploader from './components/ImageUploader';
import ExifPanel from './components/ExifPanel';
import ImageGallery from './components/ImageGallery';
import ImageList from './components/ImageList';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import Settings from './components/Settings';
import { AppHeader } from './components/AppHeader';
import { AppLayout } from './components/AppLayout';
import { AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './components/common/Button';
import { ImageComparison } from './components/ImageComparison';
import { parseImportData, ImportedData, ImportedPoint } from './utils/importData';
import { UpdateNotification } from './components/updater/UpdateNotification';
import { getUpdateService } from './services/updater';
import { isFeatureEnabled } from './config/featureFlags';
import SplashScreen from './components/SplashScreen';
import { saveInvestigation, openInvestigation, RestoredSession, ArchiveViewMode } from './services/investigationArchive/ArchiveSessionService';
import { saveArchiveWithDialog, pickAndReadArchive, readArchiveFile } from './services/investigationArchive/fileAccess';
import { recordRecentInvestigation, getRecentInvestigations, RecentInvestigation } from './utils/recentInvestigations';
import { InvalidArchiveError, UnsupportedFormatError } from 'investigation-archive';

// Lazy load heavy components for code splitting
const Map = lazy(() => import('./components/Map'));
const Investigation = lazy(() => import('./components/Investigation'));

type ViewMode = 'map' | 'list' | 'investigation';

function App() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const selectedImage = images.find((image) => image.id === selectedImageId) ?? null;
  const [showRoute, setShowRoute] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isGalleryCollapsed, setIsGalleryCollapsed] = useState(false);
  const [gallerySelectionRequest, setGallerySelectionRequest] = useState(0);
  const [isExifPanelCollapsed, setIsExifPanelCollapsed] = useState(false);
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [comparisonImage, setComparisonImage] = useState<ImageData | null>(null);
  const [importedData, setImportedData] = useState<ImportedData | undefined>(undefined);
  const [importError, setImportError] = useState<string | null>(null);
  // Entrypoint gate: the splash screen owns the window until the user starts
  // a new investigation or opens/resumes a saved one. Everything downstream
  // is unchanged.
  const [sessionState, setSessionState] = useState<'splash' | 'active'>('splash');
  const [recentInvestigations, setRecentInvestigations] = useState<RecentInvestigation[]>(() => getRecentInvestigations());
  const [splashError, setSplashError] = useState<string | null>(null);

  // Session identity + save lifecycle.
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState<Date>(new Date());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [investigationTool, setInvestigationTool] = useState<string | null>(null);

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
    if (imageData.isProcessing || selectedImageId === null || selectedImageId === imageData.id) {
      setSelectedImageId(imageData.id);
    }
  };

  const handleSelectImage = (image: ImageData) => {
    setSelectedImageId(image.id);
  };

  const handleGalleryImageSelect = (imageData: ImageData) => {
    handleSelectImage(imageData);
    setGallerySelectionRequest(request => request + 1);
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
    setImportError(null);
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
      setImportError(
        error instanceof Error && error.message
          ? `Failed to import location data: ${error.message}`
          : 'Failed to import location data. Check the file format and try again.'
      );
      throw error;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'map':
        return 'Location Map';
      case 'list':
        return 'Image Details';
      case 'investigation':
        return isFeatureEnabled('investigation') ? 'Investigation' : 'Location Map';
      default:
        return '';
    }
  };

  const renderMap = () => (
    <Suspense fallback={<div className="flex items-center justify-center h-full">
      <div className="text-app-white">Loading map...</div>
    </div>}>
      <Map
        images={images}
        selectedImage={selectedImage}
        gallerySelectionRequest={gallerySelectionRequest}
        showRoute={showRoute}
        onToggleRoute={handleRouteClick}
        onSelectImage={handleSelectImage}
        onOpenImport={() => setShowImportModal(true)}
        importedData={importedData}
      />
    </Suspense>
  );

  const renderView = () => {
    switch (viewMode) {
      case 'map':
        return renderMap();
      case 'list':
        return (
          <ImageList
            images={images}
            selectedImage={selectedImage}
            onSelect={handleSelectImage}
          />
        );
      case 'investigation':
        // Defensive: the flag gates all entry points, so this only triggers if
        // a gated view is requested in a build without the flag.
        if (!isFeatureEnabled('investigation')) return renderMap();
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-full">
            <div className="text-app-white">Loading investigation tools...</div>
          </div>}>
            <Investigation images={images} initialTool={investigationTool} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  const describeError = (error: unknown, fallback: string): string => {
    if (error instanceof UnsupportedFormatError) {
      return error.message;
    }
    if (error instanceof InvalidArchiveError) {
      return error.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const applyRestored = (restored: RestoredSession) => {
    // Commit the whole session at once — callers only call this after the
    // archive fully parsed, so a failure never leaves a partial state.
    setImages(restored.images);
    setSelectedImageId(null);
    setShowRoute(restored.showRoute);
    setViewMode(restored.viewMode);
    setInvestigationTool(restored.investigationTool);
    setImportedData(undefined);
    setSessionName(restored.meta.name);
    setSessionCreatedAt(restored.meta.createdAt);
    setSaveStatus('idle');
    setSaveError(null);
    setSessionState('active');
    if (restored.importedRaw) {
      const { type, data } = restored.importedRaw;
      parseImportData({ type, data })
        .then((result) => {
          // CSV point entries were already restored as images; exposing the
          // parsed points again would duplicate them on the map.
          setImportedData(type === 'kml' ? result : { ...result, points: undefined });
        })
        .catch((error: unknown) => {
          if (__DEV__) console.error('Failed to re-parse imported data:', error);
          setImportError('Previously imported overlay data could not be restored.');
        });
    }
  };

  const handleSaveInvestigation = async () => {
    if (images.length === 0 || saveStatus === 'saving') return;
    setSaveStatus('saving');
    setSaveError(null);
    try {
      const stamp = sessionName ?? `Investigation ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
      const defaultName = `${stamp}.investigation`;
      const saved = await saveArchiveWithDialog(defaultName, async (name) => {
        const { bytes } = await saveInvestigation({
          name,
          createdAt: sessionCreatedAt,
          images,
          importedRaw: importedData && (importedData.type === 'kml' || importedData.type === 'csv')
            ? { type: importedData.type, data: importedData.data }
            : null,
          viewMode: viewMode as ArchiveViewMode,
          showRoute,
          investigationTool,
        });
        return bytes;
      });
      if (!saved) {
        setSaveStatus('idle'); // dialog cancelled — silent no-op
        return;
      }
      recordRecentInvestigation(saved.path, saved.name);
      setSessionName(saved.name);
      setRecentInvestigations(getRecentInvestigations());
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev)), 2000);
    } catch (error) {
      if (__DEV__) console.error('Failed to save investigation:', error);
      setSaveStatus('error');
      setSaveError(describeError(error, 'Failed to save the investigation. Try a different location.'));
    }
  };

  const handleOpenInvestigation = async () => {
    setSplashError(null);
    try {
      const picked = await pickAndReadArchive();
      if (!picked) return; // cancelled
      const restored = await openInvestigation(picked.bytes);
      recordRecentInvestigation(picked.path, restored.meta.name);
      setRecentInvestigations(getRecentInvestigations());
      applyRestored(restored);
    } catch (error) {
      if (__DEV__) console.error('Failed to open investigation:', error);
      setSplashError(describeError(error, 'This file could not be opened as an investigation.'));
    }
  };

  const handleResumeInvestigation = async (path: string) => {
    setSplashError(null);
    try {
      const bytes = await readArchiveFile(path);
      const restored = await openInvestigation(bytes);
      recordRecentInvestigation(path, restored.meta.name);
      setRecentInvestigations(getRecentInvestigations());
      applyRestored(restored);
    } catch (error) {
      if (__DEV__) console.error('Failed to resume investigation:', error);
      setSplashError(describeError(error, 'This investigation could no longer be opened.'));
    }
  };

  if (sessionState === 'splash') {
    return (
      <SplashScreen
        onStart={() => {
          setSessionName(null);
          setSessionCreatedAt(new Date());
          setSessionState('active');
        }}
        onOpen={handleOpenInvestigation}
        onResume={handleResumeInvestigation}
        recent={recentInvestigations}
        error={splashError}
      />
    );
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
        onSave={handleSaveInvestigation}
        saveStatus={saveStatus}
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
              onSelect={handleGalleryImageSelect}
            />
          }
        >
          <div className="flex-none px-4 sm:px-6 py-4 border-b border-app-gray-light/30">
            <h2 className="text-lg font-semibold text-app-white">
              {getViewTitle()}
            </h2>
            {saveError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-start gap-2 text-sm" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{saveError}</div>
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  className="p-0.5 rounded hover:bg-red-500/10"
                  aria-label="Dismiss save error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {importError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 flex items-start gap-2 text-sm" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{importError}</div>
                <button
                  type="button"
                  onClick={() => setImportError(null)}
                  className="p-0.5 rounded hover:bg-red-500/10"
                  aria-label="Dismiss import error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
