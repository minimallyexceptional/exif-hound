import { useState, useRef, useEffect, useCallback, Suspense, lazy } from 'react';
import { ImageData, ImportData } from './types';
import ImageUploader from './components/ImageUploader';
import ExifPanel from './components/ExifPanel';
import { ExifErrorBoundary } from './components/ExifErrorBoundary';
import ImageGallery from './components/ImageGallery';
import ImageList from './components/ImageList';
import ExportModal from './components/ExportModal';
import ImportModal from './components/ImportModal';
import Settings from './components/Settings';
import { AppHeader } from './components/AppHeader';
import { AppLayout } from './components/AppLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarRailToggle } from './components/common/SidebarRailToggle';
import { ImageComparison } from './components/ImageComparison';
import { parseImportData, ImportedData, ImportedPoint } from './utils/importData';
import { UpdateNotification } from './components/updater/UpdateNotification';
import { getUpdateService } from 'exif-hound-core';
import { notify } from './feedback';
import SplashScreen from './components/SplashScreen';
import ProjectCreateModal from './components/ProjectCreateModal';
import { ProjectStore } from 'exif-hound-core';
import type { OcrMiddleware, OcrProgress, OcrResult } from 'exif-hound-core';
import { getArchiveDbProvider } from 'exif-hound-core';
import { TauriFsPort } from 'exif-hound-core';
import type { ProjectViewMode, GpsPlaceNamePatch } from 'exif-hound-core';
import {
  toImageData,
  toStoreImage,
  toStoreState,
  fromStoreState,
  serializeExif,
  applyPersistedExif,
  applyGpsPlaceNamePatches,
} from 'exif-hound-core';
import { pickProjectFolder, resolveProjectFolder } from 'exif-hound-core';
import { recordRecentProject, getRecentProjects, RecentProject } from './utils/recentProjects';
import {
  InvalidProjectError,
  ProjectExistsError,
  UnsupportedSchemaError,
} from 'exif-hound-core';

// Lazy load heavy components for code splitting
const Map = lazy(() => import('./components/Map'));
const Workbench = lazy(() => import('./components/Workbench'));
const EvidenceView = lazy(() => import('./components/evidence/EvidenceView'));

type ViewMode = ProjectViewMode;

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
  // Entrypoint gate: the splash screen owns the window until a project is
  // created or opened. Everything downstream is unchanged.
  const [sessionState, setSessionState] = useState<'splash' | 'active'>('splash');
  const [activeProjectStore, setActiveProjectStore] = useState<ProjectStore | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => getRecentProjects());
  const [splashError, setSplashError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const ocrMiddlewareRef = useRef<Promise<OcrMiddleware> | null>(null);
  useEffect(() => () => {
    void ocrMiddlewareRef.current?.then(middleware => middleware.dispose());
  }, []);

  // The bound project: every upload, import, and state change writes through
  // to this store's folder (images/ + data/data.db). Null on the splash.
  const projectStoreRef = useRef<ProjectStore | null>(null);

  const persistImage = async (imageData: ImageData) => {
    // Write-through: original bytes → images/ on disk, EXIF → data.db.
    const store = projectStoreRef.current;
    if (!store) return;
    try {
      const args = toStoreImage(imageData);
      let savedImage;
      if (args.bytes === null && !('hasImage' in imageData)) {
        const file = imageData.file as unknown as File;
        const bytes = new Uint8Array(await file.arrayBuffer());
        savedImage = await store.addImage(imageData.file.name, bytes, serializeExif(imageData.exif));
      } else {
        savedImage = await store.addImage(args.fileName, args.bytes, args.exif, args.sourceUrl);
      }
      setImages(current =>
        current.map(image =>
          image.id === imageData.id ? applyPersistedExif(image, savedImage) : image
        )
      );
    } catch (error) {
      if (__DEV__) console.error('Failed to persist image to project:', error);
      notify.error(
        error instanceof Error && error.message
          ? `Project write failed: ${error.message}`
          : 'Project write failed — the image is shown but not saved to the project.'
      );
    }
  };

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
    if (!imageData.isProcessing) {
      void persistImage(imageData);
    }
  };

  const handleImagesPatched = useCallback((patches: GpsPlaceNamePatch[]) => {
    setImages((current) => applyGpsPlaceNamePatches(current, patches));
  }, []);

  const handleSelectImage = (image: ImageData) => {
    setSelectedImageId(image.id);
  };

  const handleGalleryImageSelect = (imageData: ImageData) => {
    handleSelectImage(imageData);
    setGallerySelectionRequest(request => request + 1);
  };

  const handleRecognizeImage = async (
    image: Blob,
    language: string,
    onProgress: (progress: number, status?: string) => void,
  ): Promise<OcrResult> => {
    if (!projectStoreRef.current) throw new Error('Save this image to the project before running OCR.');
    const file = image;
    ocrMiddlewareRef.current ??= import('exif-hound-core').then(({ OcrMiddleware: Middleware, PaddleOcrWorkerFactory }) => new Middleware({
      workerFactory: new PaddleOcrWorkerFactory({
        // These are app-root assets. Resolving against href would append them to
        // any nested pathname and could fetch the SPA fallback HTML as a model TAR.
        detectionModelUrl: new URL('/ocr/paddle/PP-OCRv6_small_det_onnx_infer.tar', window.location.origin).toString(),
        recognitionModelUrl: new URL('/ocr/paddle/PP-OCRv6_small_rec_onnx_infer.tar', window.location.origin).toString(),
        wasmPaths: new URL('/ocr/paddle/ort/', window.location.origin).toString(),
      }),
    }));
    return (await ocrMiddlewareRef.current).recognize(file, {
      languages: language,
      onProgress: (progress: OcrProgress) => onProgress(progress.progress, progress.status),
    });
  };

  const handleUploadClick = () => {
    document.getElementById('headerFileInput')?.click();
  };

  const persistSessionState = (
    overrides: Partial<{ viewMode: ViewMode; showRoute: boolean }> = {}
  ) => {
    const store = projectStoreRef.current;
    if (!store) return;
    void store
      .setState(
        toStoreState({
          viewMode: (overrides.viewMode ?? viewMode) as ProjectViewMode,
          showRoute: overrides.showRoute ?? showRoute,
        })
      )
      .catch((error: unknown) => {
        if (__DEV__) console.error('Failed to persist session state:', error);
        notify.error('Could not save session state.');
      });
  };

  const handleRouteClick = () => {
    setShowRoute(prev => {
      const next = !prev;
      persistSessionState({ showRoute: next });
      return next;
    });
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

      // Write-through: raw file to data/ (replaces previous of same type),
      // and CSV point entries become image records.
      const store = projectStoreRef.current;
      if (store) {
        if (data.name) {
          await store.addImport(data.type, data.name, data.data);
        }
        if (result.type === 'csv' && result.points) {
          for (const point of result.points as ImportedPoint[]) {
            await store.addImage(point.file.name, null, serializeExif(point.exif), point.url || null);
          }
        }
      }
      if (result.type === 'csv' && result.points) {
        const count = result.points.length;
        notify.success(count === 1 ? 'Imported 1 CSV point' : `Imported ${count} CSV points`);
      } else {
        notify.success('Imported KML overlay');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to import data:', error);
      }
      throw error;
    }
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'map':
        return 'Location Map';
      case 'list':
        return 'Image Details';
      case 'workbench':
        return 'Workbench';
      case 'evidence':
        return 'Evidence';
      default:
        return '';
    }
  };

  const hidePageSubheader = viewMode === 'workbench';
  const isFullBleedView = viewMode === 'workbench' || viewMode === 'evidence';

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
      case 'workbench':
        return (
          <Suspense fallback={<div className="flex h-full items-center justify-center text-app-white">Loading Workbench...</div>}>
            <Workbench
              key={activeProjectStore?.rootPath ?? 'no-project'}
              images={images}
              store={activeProjectStore}
              recognizeImage={handleRecognizeImage}
            />
          </Suspense>
        );
      case 'evidence':
        return (
          <Suspense fallback={<div className="flex h-full items-center justify-center text-app-white">Loading Evidence...</div>}>
            <EvidenceView
              key={activeProjectStore?.rootPath ?? 'no-project'}
              images={images}
              store={activeProjectStore}
              onSelectImage={handleSelectImage}
              onImagesPatched={handleImagesPatched}
              onNavigateToMap={() => {
                setViewMode('map');
                persistSessionState({ viewMode: 'map' });
              }}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  const describeError = (error: unknown, fallback: string): string => {
    if (error instanceof UnsupportedSchemaError) {
      return error.message;
    }
    if (error instanceof InvalidProjectError) {
      return error.message;
    }
    if (error instanceof ProjectExistsError) {
      return error.message;
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const newStoreDeps = async () => ({
    dbProvider: await getArchiveDbProvider(),
    fs: new TauriFsPort(),
  });

  /** Bind an opened/created project: repopulate everything from the store. */
  const bindProject = async (store: ProjectStore) => {
    // Full read before any state commit — a failure here must not leave a
    // half-loaded session.
    const records = await store.listImages();
    const state = await store.getState();
    const meta = await store.getMeta();
    const imports = await store.listImports();
    const importTexts = await Promise.all(imports.map((i) => store.readImport(i.type)));

    projectStoreRef.current = store;
    setActiveProjectStore(store);
    recordRecentProject(store.rootPath, meta.name);
    setRecentProjects(getRecentProjects());
    setImages(records.map(toImageData));
    setSelectedImageId(null);
    setImportedData(undefined);
    const restoredState = fromStoreState(state);
    setShowRoute(restoredState.showRoute);
    setViewMode(restoredState.viewMode);
    setSessionState('active');

    // Re-parse stored KML/CSV overlays from the data folder.
    for (const raw of importTexts) {
      if (!raw) continue;
      parseImportData({ type: raw.type, data: raw.text })
        .then((result) => {
          // CSV point entries were already restored as images; exposing the
          // parsed points again would duplicate them on the map.
          setImportedData(raw.type === 'kml' ? result : { ...result, points: undefined });
        })
        .catch((error: unknown) => {
          if (__DEV__) console.error('Failed to re-parse imported data:', error);
          notify.error('Previously imported overlay data could not be restored.');
        });
    }
  };

  const handleCreateProject = async (parent: string, name: string) => {
    const deps = await newStoreDeps();
    const store = await ProjectStore.create(deps, parent, name, __APP_VERSION__);
    await bindProject(store);
  };

  const handleOpenProject = async () => {
    setSplashError(null);
    try {
      const path = await pickProjectFolder();
      if (!path) return; // cancelled
      const deps = await newStoreDeps();
      await bindProject(await ProjectStore.open(deps, path));
    } catch (error) {
      if (__DEV__) console.error('Failed to open project:', error);
      setSplashError(describeError(error, 'This folder could not be opened as a project.'));
    }
  };

  const handleResumeProject = async (path: string) => {
    setSplashError(null);
    try {
      const deps = await newStoreDeps();
      await bindProject(await ProjectStore.open(deps, await resolveProjectFolder(path)));
    } catch (error) {
      if (__DEV__) console.error('Failed to resume project:', error);
      setSplashError(describeError(error, 'This project could no longer be opened.'));
    }
  };

  if (sessionState === 'splash') {
    return (
      <>
        <SplashScreen
          onStart={() => setShowCreateModal(true)}
          onOpen={handleOpenProject}
          onResume={handleResumeProject}
          recent={recentProjects}
          error={splashError}
        />
        {showCreateModal && (
          <ProjectCreateModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateProject}
          />
        )}
      </>
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
        onSetView={(view: ViewMode) => {
          setViewMode(view);
          persistSessionState({ viewMode: view });
        }}
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
          isEmpty={images.length === 0 && !isFullBleedView}
          sidebar={
            <ImageGallery 
              images={images}
              selectedImage={selectedImage}
              onSelect={handleGalleryImageSelect}
            />
          }
        >
          <div className={`flex-none px-4 sm:px-6 py-4 border-b border-app-gray-light/30 ${hidePageSubheader ? 'hidden' : ''}`}>
            <h2 className="text-lg font-semibold text-app-white">
              {getViewTitle()}
            </h2>
          </div>
          <div className="flex-1 min-h-0">
            {renderView()}
          </div>
        </AppLayout>

        {/* EXIF Panel - Only show for map and list views */}
        {selectedImage && !isFullBleedView && (
          <div className={`flex-none bg-app-gray border-l border-app-gray-light/30 transition-all duration-300 ease-in-out ${
            isExifPanelCollapsed ? 'w-12' : 'w-[400px]'
          }`}>
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <SidebarRailToggle
                expanded={!isExifPanelCollapsed}
                onToggle={() => setIsExifPanelCollapsed((prev) => !prev)}
                screenReaderLabel="Image details panel"
                testId="exif-details-toggle"
                className={`flex items-center border-b border-app-gray-light/30 transition-colors cursor-pointer ${
                  isExifPanelCollapsed
                    ? 'h-12 justify-center hover:bg-app-gray-light/30'
                    : 'h-12 px-4 justify-between hover:bg-app-gray-light/30'
                }`}
                leading={!isExifPanelCollapsed ? (
                  <h2 className="font-medium text-app-white flex items-center gap-2">
                    Details
                  </h2>
                ) : undefined}
                chevron={isExifPanelCollapsed ? (
                  <ChevronLeft className="w-7 h-7 text-app-white" />
                ) : (
                  <ChevronRight className="w-7 h-7 text-app-white" />
                )}
              />

              {/* Panel Content */}
              <div className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
                isExifPanelCollapsed ? 'w-0' : 'w-full'
              }`}>
                <ExifErrorBoundary key={selectedImage.id}>
                  <ExifPanel
                    image={selectedImage}
                    onShowComparison={handleShowComparison}
                  />
                </ExifErrorBoundary>
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
        Auto-update discovery + update toasts. Fully silent unless an
        update is found or the user initiates an action; loaded images are
        in-memory only, so any loaded content counts as unsaved work and
        the updater will confirm before restarting.
      */}
      <UpdateNotification hasUnsavedWork={() => images.length > 0} />
    </div>
  );
}

export default App;
