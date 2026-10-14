import React, { useState } from 'react';
import { ImageOff, Loader } from 'lucide-react';
import {
  allowRemoteHost,
  fetchRemoteImageBlob,
  isAllowedRemoteImageUrl,
  remoteImageHost,
} from '../utils/remoteImages';

interface Props {
  remoteUrl: string;
  label?: string;
  className?: string;
  onLoaded?: (objectUrl: string, blob: Blob) => void;
}

export const RemoteImagePlaceholder: React.FC<Props> = ({
  remoteUrl,
  label,
  className = '',
  onLoaded,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAllowedRemoteImageUrl(remoteUrl)) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 p-3 text-center text-xs text-app-accent-dim ${className}`}>
        <ImageOff className="w-5 h-5" aria-hidden />
        <p>Remote image URL is not HTTPS and was blocked.</p>
      </div>
    );
  }

  const host = remoteImageHost(remoteUrl);

  const handleLoad = async () => {
    setBusy(true);
    setError(null);
    try {
      allowRemoteHost(host);
      const blob = await fetchRemoteImageBlob(remoteUrl);
      const objectUrl = URL.createObjectURL(blob);
      onLoaded?.(objectUrl, blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load remote image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 p-3 text-center text-xs text-app-accent-dim bg-app-black/20 ${className}`}
      data-testid="remote-image-placeholder"
    >
      <ImageOff className="w-5 h-5 text-app-accent-dim" aria-hidden />
      <p className="text-app-white text-sm">{label ?? 'Remote image not loaded'}</p>
      <p>Your IP would be sent to <span className="selectable-value font-mono">{host}</span> if you load this image.</p>
      <button
        type="button"
        className="px-3 py-1.5 rounded-md border border-app-gray-light text-app-white hover:border-app-accent transition-colors disabled:opacity-50"
        onClick={() => void handleLoad()}
        disabled={busy}
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" aria-hidden />
            Loading…
          </span>
        ) : (
          `Load remote image from ${host}`
        )}
      </button>
      {error && (
        <p className="text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
};
