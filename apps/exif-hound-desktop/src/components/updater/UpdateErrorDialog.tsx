import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { UpdateDialog } from './UpdateDialog';
import { UpdateError } from '../../services/updater';

interface Props {
  error: UpdateError;
  onDismiss: () => void;
}

/**
 * Shown only for user-initiated update operations that failed. Automatic
 * (silent) failures never reach this dialog. The message is intentionally
 * non-technical; the technical detail is not shown because it would not
 * help the user act.
 */
export const UpdateErrorDialog: React.FC<Props> = ({ error, onDismiss }) => (
  <UpdateDialog title="Update Problem" onClose={onDismiss}>
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-app-accent flex-shrink-0 mt-0.5" />
        <p className="text-app-white">{error.userMessage}</p>
      </div>
      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={onDismiss}>
          OK
        </Button>
      </div>
    </div>
  </UpdateDialog>
);