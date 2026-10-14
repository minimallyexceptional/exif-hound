import React, { useState } from 'react';
import type { ImageData } from '../types';
import type { ImportedPoint } from 'exif-hound-core';
import { RemoteImagePlaceholder } from './RemoteImagePlaceholder';
import { useRemoteImageLoaded } from '../context/RemoteImageContext';

type ProjectImageEntry = ImageData | ImportedPoint;

function pendingRemoteUrl(image: ProjectImageEntry): string | null {
  if (!('hasImage' in image)) return null;
  if (image.hasImage || !image.pendingRemoteUrl) return null;
  return image.pendingRemoteUrl;
}

interface Props {
  image: ProjectImageEntry;
  alt: string;
  className?: string;
  imgClassName?: string;
}

/**
 * Renders a project image or an opt-in placeholder for pending remote URLs.
 */
export const ProjectImage: React.FC<Props> = ({
  image,
  alt,
  className = '',
  imgClassName = '',
}) => {
  const onRemoteLoaded = useRemoteImageLoaded();
  const remote = pendingRemoteUrl(image);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const displayUrl = remote ? (loadedUrl ?? '') : image.url;

  if (remote) {
    return (
      <RemoteImagePlaceholder
        remoteUrl={remote}
        className={className}
        onLoaded={(objectUrl, blob) => {
          setLoadedUrl(objectUrl);
          onRemoteLoaded?.(image.id, image.projectImageId, objectUrl, blob);
        }}
      />
    );
  }

  if (!displayUrl) {
    return <div className={className} aria-hidden />;
  }

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={imgClassName}
      loading="lazy"
    />
  );
};
