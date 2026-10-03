import React from 'react';
import { UpdateDialog } from './UpdateDialog';
import { DownloadProgress, UpdateStateName } from '../../services/updater';

interface Props {
  phase: Extract<UpdateStateName, 'downloading' | 'installing' | 'restarting'>;
  progress?: DownloadProgress;
}

const PHASE_TEXT: Record<Props['phase'], string> = {
  downloading: 'Downloading update…',
  installing: 'Installing update…',
  restarting: 'Restarting…',
};

/**
 * Visible download/install progress. Non-dismissible while the operation is
 * in flight — cancelling mid-download isn't supported by the updater plugin
 * and a half-installed state helps nobody.
 */
export const UpdateProgressDialog: React.FC<Props> = ({ phase, progress }) => {
  const percent =
    progress?.totalBytes && progress.totalBytes > 0
      ? Math.min(100, Math.round((progress.receivedBytes / progress.totalBytes) * 100))
      : null;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  return (
    <UpdateDialog title="Update in progress">
      <div className="space-y-4">
        <p className="text-app-white">{PHASE_TEXT[phase]}</p>

        {phase === 'downloading' && (
          <>
            <div
              className="w-full h-2 bg-app-gray-light rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={percent ?? undefined}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-app-accent rounded-full transition-all duration-200"
                style={{ width: percent === null ? '100%' : `${percent}%` }}
              />
            </div>
            <p className="text-sm text-app-accent-dim">
              {percent === null
                ? formatBytes(progress?.receivedBytes ?? 0)
                : `${percent}% (${formatBytes(progress?.receivedBytes ?? 0)})`}
            </p>
          </>
        )}

        {phase === 'installing' && (
          <p className="text-sm text-app-accent-dim">
            This only takes a moment. EXIF HOUND will restart when the update is ready.
          </p>
        )}
      </div>
    </UpdateDialog>
  );
};