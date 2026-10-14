import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import type { ProjectStore } from 'exif-hound-core';
import type { ImageData } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { EvidenceHubService, getLocationFromCoordinates } from 'exif-hound-core';
import type { EvidenceCategoryId, EvidenceIndex, GpsPlaceNamePatch } from 'exif-hound-core';
import { EvidenceBentoGrid } from './EvidenceBentoGrid';
import { EvidenceCategoryTable } from './EvidenceCategoryTable';
import { Button } from '../common/Button';

interface Props {
  images: ImageData[];
  store: ProjectStore | null;
  onSelectImage: (image: ImageData) => void;
  onNavigateToMap?: () => void;
  onImagesPatched?: (patches: GpsPlaceNamePatch[]) => void;
}

const EvidenceView: React.FC<Props> = ({
  images,
  store,
  onSelectImage,
  onNavigateToMap,
  onImagesPatched,
}) => {
  const { privacySettings } = useSettings();
  const resolvePlaceNames = privacySettings.reverseGeocoding;
  const [index, setIndex] = useState<EvidenceIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<EvidenceCategoryId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hubService = useMemo(
    () =>
      store
        ? new EvidenceHubService(store, images, {
            resolvePlaceNames,
            lookupPlaceName: getLocationFromCoordinates,
          })
        : null,
    [store, images, resolvePlaceNames],
  );

  const reload = useCallback(async () => {
    if (!hubService) {
      setIndex(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { index: nextIndex, patches } = await hubService.loadIndex();
      setIndex(nextIndex);
      if (patches.length > 0) onImagesPatched?.(patches);
    } catch (cause) {
      setError(EvidenceHubService.loadErrorMessage(cause));
      setIndex(null);
    } finally {
      setLoading(false);
    }
  }, [hubService, onImagesPatched]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalItems = useMemo(
    () => (index ? EvidenceHubService.totalItemCount(index) : 0),
    [index],
  );

  const handleOpenImage = useCallback((imageId: number) => {
    const image = hubService?.resolveImage(imageId);
    if (!image) return;
    onSelectImage(image);
    onNavigateToMap?.();
  }, [hubService, onNavigateToMap, onSelectImage]);

  if (!store) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
        <Shield className="mb-3 h-10 w-10 text-app-accent-dim" aria-hidden="true" />
        <h2 className="text-base font-medium text-app-white">Open an investigation first</h2>
        <p className="mt-1 max-w-sm text-sm text-app-accent-dim">Evidence is collected per project.</p>
      </div>
    );
  }

  if (loading && !index) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center gap-2 text-sm text-app-accent-dim" role="status">
        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading evidence…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-app-danger">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => void reload()}>Retry</Button>
      </div>
    );
  }

  const activeCategory = categoryId && index
    ? index.categories.find((item) => item.id === categoryId)
    : null;

  const isHub = !categoryId && index;

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden"
      aria-label="Evidence"
      aria-busy={loading}
    >
      <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-app-gray-light/30 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {categoryId ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setCategoryId(null)}
              >
                All categories
              </Button>
              {activeCategory && (
                <>
                  <span className="text-app-gray-light" aria-hidden="true">·</span>
                  <span className="truncate text-sm font-medium text-app-white">{activeCategory.title}</span>
                  <span className="text-sm tabular-nums text-app-accent-dim">
                    ({activeCategory.count.toLocaleString()})
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-app-white tabular-nums">{index?.categories.length ?? 0}</span>
              <span className="text-sm text-app-accent-dim">categories</span>
              <span className="hidden text-app-gray-light sm:inline" aria-hidden="true">·</span>
              <span className="text-sm font-medium text-app-white tabular-nums">{totalItems.toLocaleString()}</span>
              <span className="text-sm text-app-accent-dim">{totalItems === 1 ? 'item' : 'items'}</span>
              <span className="hidden text-app-gray-light lg:inline" aria-hidden="true">·</span>
              <span className="hidden max-w-md truncate text-xs text-app-accent-dim lg:inline">
                From Workbench runs and GPS-tagged images
              </span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => void reload()}
          icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          aria-label="Refresh evidence"
        >
          {loading && index ? 'Updating…' : 'Refresh'}
        </Button>
      </div>

      <div className={`min-h-0 flex-1 ${categoryId ? 'overflow-hidden' : 'overflow-auto bg-app-black'}`}>
        {isHub && (
          <>
            {totalItems === 0 && (
              <p className="border-b border-app-gray-light/20 px-4 py-3 text-sm text-app-accent-dim sm:px-5">
                No findings yet. Run Workbench workflows to extract identifiers, OCR, or provenance, or add GPS-tagged images.
              </p>
            )}
            <EvidenceBentoGrid categories={index.categories} onSelect={setCategoryId} />
          </>
        )}
        {categoryId && index && (
          <EvidenceCategoryTable
            categoryId={categoryId}
            title={activeCategory?.title ?? categoryId}
            rows={index.rowsByCategory[categoryId]}
            onOpenImage={handleOpenImage}
          />
        )}
      </div>
    </section>
  );
};

export default EvidenceView;
