import { toast } from 'sonner';
import { notify } from '../notify';

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }),
  Toaster: () => null,
}));

describe('notify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a success toast that auto-dismisses', () => {
    notify.success('Imported 2 images');
    expect(toast.success).toHaveBeenCalledWith('Imported 2 images', expect.objectContaining({
      duration: 4000,
      closeButton: true,
    }));
  });

  it('shows an error toast with a longer duration', () => {
    notify.error('Could not save the workflow.');
    expect(toast.error).toHaveBeenCalledWith('Could not save the workflow.', expect.objectContaining({
      duration: 8000,
      closeButton: true,
    }));
  });

  it('shows a persistent action toast', () => {
    const onAction = jest.fn();
    const onDismiss = jest.fn();
    notify.action({
      id: 'update-available',
      title: 'EXIF Hound 2.7.0 is available.',
      actionLabel: 'Install 2.7.0',
      onAction,
      onDismiss,
    });
    expect(toast).toHaveBeenCalledWith('EXIF Hound 2.7.0 is available.', expect.objectContaining({
      id: 'update-available',
      duration: Infinity,
      closeButton: true,
      action: expect.objectContaining({ label: 'Install 2.7.0', onClick: onAction }),
      onDismiss,
    }));
  });

  it('shows a non-dismissible loading toast with a stable id', () => {
    notify.loading('Downloading update… 40%', { id: 'update-progress' });
    expect(toast.loading).toHaveBeenCalledWith('Downloading update… 40%', expect.objectContaining({
      id: 'update-progress',
      duration: Infinity,
      closeButton: false,
      dismissible: false,
    }));
  });

  it('dismisses a toast by id', () => {
    notify.dismiss('update-available');
    expect(toast.dismiss).toHaveBeenCalledWith('update-available');
  });
});
