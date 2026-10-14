import React, { createContext, useContext } from 'react';

export type RemoteImageLoadedHandler = (
  imageId: string,
  projectImageId: number | undefined,
  objectUrl: string,
  blob: Blob,
) => void;

const RemoteImageContext = createContext<RemoteImageLoadedHandler | null>(null);

export function RemoteImageProvider({
  onLoaded,
  children,
}: {
  onLoaded: RemoteImageLoadedHandler;
  children: React.ReactNode;
}) {
  return (
    <RemoteImageContext.Provider value={onLoaded}>
      {children}
    </RemoteImageContext.Provider>
  );
}

export function useRemoteImageLoaded(): RemoteImageLoadedHandler | null {
  return useContext(RemoteImageContext);
}
