import React, { useEffect, useState } from 'react';
import type { ExpandedTags } from 'exif-hound-core';
import { ImageData } from '../types';
import { useCore } from '../core/CoreContext';
import { ExifDetailsView } from './ExifDetailsView';
import FullExifView from './FullExifView';
import { Panel } from './common/Panel';

interface Props {
  image: ImageData;
  onShowComparison: (image: ImageData) => void;
}

export default function ExifPanel({ image, onShowComparison }: Props) {
  const core = useCore();
  const [loaded, setLoaded] = useState<{ id: string; tags: ExpandedTags } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = image.id;
    const file = image.file;

    void (async () => {
      let tags: ExpandedTags = {};
      if (file instanceof File) {
        try {
          const buffer = await file.arrayBuffer();
          tags = await core.middleware.exif.loadExifReaderTags(buffer, { expanded: true }) ?? {};
        } catch (error) {
          if (__DEV__) {
            console.error('Error loading EXIF data:', error);
          }
        }
      }
      if (!cancelled) setLoaded({ id, tags });
    })();

    return () => {
      cancelled = true;
    };
  }, [core, image]);

  const rawExif = loaded?.id === image.id ? loaded.tags : null;

  return (
    <Panel className="h-full">
      <div className="h-full flex flex-col bg-app-gray">
        <ExifDetailsView image={image} onShowComparison={onShowComparison} />
        <div
          data-testid="exif-tag-list"
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {rawExif ? (
            <FullExifView image={image} rawExif={rawExif} />
          ) : (
            <p className="p-4 text-sm text-app-accent-dim">Loading EXIF…</p>
          )}
        </div>
      </div>
    </Panel>
  );
}
