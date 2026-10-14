import { toast } from 'sonner';

export const TOAST_DURATION_SUCCESS = 4000;
export const TOAST_DURATION_ERROR = 8000;

export const UPDATE_TOAST_IDS = {
  available: 'update-available',
  progress: 'update-progress',
  ready: 'update-ready',
  error: 'update-error',
} as const;

export const notify = {
  success(message: string) {
    return toast.success(message, { duration: TOAST_DURATION_SUCCESS, closeButton: true });
  },
  error(message: string, options?: { id?: string; duration?: number; onDismiss?: () => void }) {
    return toast.error(message, {
      duration: options?.duration ?? TOAST_DURATION_ERROR,
      closeButton: true,
      id: options?.id,
      onDismiss: options?.onDismiss,
    });
  },
  loading(message: string, options?: { id?: string; description?: string }) {
    return toast.loading(message, {
      id: options?.id,
      description: options?.description,
      duration: Infinity,
      closeButton: false,
      dismissible: false,
    });
  },
  action(options: {
    id: string;
    title: string;
    description?: string;
    actionLabel: string;
    onAction: () => void;
    onDismiss?: () => void;
    duration?: number;
  }) {
    return toast(options.title, {
      id: options.id,
      description: options.description,
      duration: options.duration ?? Infinity,
      closeButton: true,
      action: { label: options.actionLabel, onClick: options.onAction },
      onDismiss: options.onDismiss,
    });
  },
  dismiss(id?: string | number) {
    return id == null ? toast.dismiss() : toast.dismiss(id);
  },
};
