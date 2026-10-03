import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '../common/Button';
import { UpdateDialog } from './UpdateDialog';
import { UpdateInfo } from '../../services/updater';

interface Props {
  update: UpdateInfo;
  appName: string;
  onLater: () => void;
  onDownload: () => void;
  downloadStarting: boolean;
}

/**
 * "EXIF HOUND 2.7.0 is available" — shown when a check discovers an update.
 * Never opens on its own schedule without user consent to act: only after
 * the user picks Download does anything download.
 */
export const UpdateAvailableDialog: React.FC<Props> = ({
  update,
  appName,
  onLater,
  onDownload,
  downloadStarting,
}) => {
  const notes = update.notes
    ? update.notes.split('\n').map(line => line.trim()).filter(Boolean)
    : [];

  return (
    <UpdateDialog title="Update Available" onClose={onLater}>
      <div className="space-y-4">
        <p className="text-app-white">
          {appName} {update.version} is available.
        </p>

        {notes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-app-accent-dim mb-2">What&apos;s new:</p>
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {notes.map((note, i) => (
                <li key={i} className="text-sm text-app-accent-dim flex gap-2">
                  <span className="text-app-accent select-none">•</span>
                  <span className="whitespace-pre-wrap break-words">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onLater} disabled={downloadStarting}>
            Later
          </Button>
          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={onDownload}
            disabled={downloadStarting}
          >
            {downloadStarting ? 'Starting…' : 'Download Update'}
          </Button>
        </div>
      </div>
    </UpdateDialog>
  );
};