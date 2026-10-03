import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Minimal dialog shell shared by all updater dialogs. Follows the app's
 * existing glass-panel / app-* design language (same visual grammar as
 * components/common/Modal.tsx) but with explicit control over
 * dismissibility, which the updater dialogs need.
 */
interface UpdateDialogProps {
  title: string;
  /** Omit to render a non-dismissible dialog (e.g. during install). */
  onClose?: () => void;
  children: React.ReactNode;
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({ title, onClose, children }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    dialog?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-app-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
      onClick={e => {
        if (onClose && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="glass-panel rounded-xl border border-app-gray-light/30 shadow-lg shadow-black/30 w-full max-w-md outline-none"
      >
        <div className="flex-none p-4 border-b border-app-gray-light/30 bg-app-gray/95 backdrop-blur-sm z-10 rounded-t-xl">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold text-app-white">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-app-gray-light rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-app-white" />
              </button>
            )}
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
