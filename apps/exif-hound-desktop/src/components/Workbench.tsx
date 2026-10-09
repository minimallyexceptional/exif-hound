import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CopyCheck, Image as ImageIcon, Play, ScanText, Search, Sparkles } from 'lucide-react';
import type { OcrProgress } from 'ocr-middleware';
import type { OcrResultRecord } from 'investigation-archive';
import { ImageData } from '../types';
import ImageGallery from './ImageGallery';
import { Button } from './common/Button';

interface Props {
  images: ImageData[];
  selectedImage: ImageData | null;
  onSelectImage: (image: ImageData) => void;
  onRunOcr: (image: ImageData, onProgress: (progress: OcrProgress) => void) => Promise<OcrResultRecord>;
  onGetOcrResult: (imageId: number) => Promise<OcrResultRecord | null>;
  onOpenResults: (image: ImageData, result: OcrResultRecord) => void;
}

interface OcrToolState {
  phase: 'loading' | 'idle' | 'running' | 'ready' | 'error';
  progress: number;
  status: string;
  result: OcrResultRecord | null;
  error?: string;
}

const Workbench: React.FC<Props> = ({ images, selectedImage, onSelectImage, onRunOcr, onGetOcrResult, onOpenResults }) => {
  const [unavailableImageId, setUnavailableImageId] = useState<string | null>(null);
  const [toolStates, setToolStates] = useState<Record<number, OcrToolState>>({});
  const [showNoTextDialog, setShowNoTextDialog] = useState(false);
  const checkedImageIds = useRef(new Set<number>());
  const projectImageId = selectedImage?.projectImageId;
  const hasLocalImage = !!selectedImage && !('hasImage' in selectedImage);
  const toolState = projectImageId ? toolStates[projectImageId] : undefined;
  const imageUnavailable = selectedImage?.id === unavailableImageId;

  useEffect(() => {
    if (projectImageId === undefined || checkedImageIds.current.has(projectImageId)) return;
    checkedImageIds.current.add(projectImageId);
    let current = true;
    setToolStates(states => ({ ...states, [projectImageId]: { phase: 'loading', progress: 0, status: 'Checking saved results', result: null } }));
    void onGetOcrResult(projectImageId).then(result => {
      if (!current) return;
      setToolStates(states => ({
        ...states,
        [projectImageId]: { phase: result ? 'ready' : 'idle', progress: result ? 1 : 0, status: result ? 'Results available' : '', result },
      }));
    }).catch(error => {
      if (!current) return;
      setToolStates(states => ({
        ...states,
        [projectImageId]: { phase: 'idle', progress: 0, status: '', result: null, error: error instanceof Error ? error.message : 'Could not load saved OCR results.' },
      }));
    });
    return () => { current = false; };
  }, [projectImageId, onGetOcrResult]);

  const updateToolState = (imageId: number, update: Partial<OcrToolState>) => {
    setToolStates(states => ({
      ...states,
      [imageId]: { phase: 'idle', progress: 0, status: '', result: null, ...states[imageId], ...update },
    }));
  };

  const handleRunOcr = async () => {
    if (!selectedImage || !hasLocalImage || projectImageId === undefined || toolState?.phase === 'running') return;
    const imageAtStart = selectedImage;
    updateToolState(projectImageId, { phase: 'running', progress: 0, status: 'Starting OCR', error: undefined });
    try {
      const result = await onRunOcr(imageAtStart, progress => {
        updateToolState(projectImageId, { progress: progress.progress, status: progress.status || 'Recognizing text' });
      });
      if (!result.text.trim()) {
        updateToolState(projectImageId, { phase: toolState?.result ? 'ready' : 'idle', progress: 0, status: '', result: toolState?.result ?? null });
        setShowNoTextDialog(true);
        return;
      }
      updateToolState(projectImageId, { phase: 'ready', progress: 1, status: 'Results available', result });
    } catch (error) {
      updateToolState(projectImageId, { phase: 'error', progress: 0, status: '', error: error instanceof Error ? error.message : 'OCR could not be completed. Try again.' });
    }
  };

  const futureTools = [
    { name: 'Reverse image search', shortName: 'Reverse image', icon: Search },
    { name: 'Similar image matching', shortName: 'Similarity', icon: Sparkles },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Workbench">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-app-white">Workbench</h2>
              <p className="mt-1 truncate text-sm text-app-accent-dim">{selectedImage ? selectedImage.file.name : 'Select an image to begin'}</p>
            </div>
            {selectedImage && <span className="flex-none text-xs tabular-nums text-app-accent-dim">{images.findIndex(image => image.id === selectedImage.id) + 1} of {images.length}</span>}
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border border-app-gray-light/30 bg-app-black/40">
            {selectedImage ? imageUnavailable ? (
              <div className="px-6 text-center" role="status">
                <ImageIcon className="mx-auto mb-3 h-10 w-10 text-app-accent-dim" aria-hidden="true" />
                <p className="font-medium text-app-white">Image preview unavailable</p>
                <p className="mt-1 max-w-md break-all text-sm text-app-accent-dim">{selectedImage.file.name}</p>
              </div>
            ) : (
              <img key={selectedImage.id} src={selectedImage.url} alt={selectedImage.file.name} className="h-full w-full object-contain" onError={() => setUnavailableImageId(selectedImage.id)} />
            ) : (
              <div className="px-6 text-center">
                <ImageIcon className="mx-auto mb-3 h-12 w-12 text-app-accent-dim" aria-hidden="true" />
                <p className="font-medium text-app-white">{images.length === 0 ? 'Your images will appear here' : 'Choose an image from the gallery'}</p>
                <p className="mt-2 max-w-sm text-sm text-app-accent-dim">{images.length === 0 ? 'Import images into this project to start working with them.' : 'Select a thumbnail below to view it at full size.'}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="flex-none overflow-y-auto border-t border-app-gray-light/30 bg-app-gray/40 p-4 lg:w-72 lg:border-l lg:border-t-0 lg:p-5">
          <h3 className="font-semibold text-app-white">Image tools</h3>
          <p className="mt-1 text-sm text-app-accent-dim">Run analysis on the selected image</p>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <li aria-label="Optical character recognition" className="min-w-0 rounded-lg border border-app-gray-light/40 bg-app-black/20 p-3">
              <div className="flex items-center gap-3">
                <ScanText className="h-5 w-5 flex-none text-app-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-white">OCR</span>
                {toolState?.phase === 'ready' && toolState.result ? (
                  <Button variant="ghost" size="sm" className="!px-2" onClick={() => selectedImage && onOpenResults(selectedImage, toolState.result!)} icon={<ArrowRight className="h-4 w-4" />}>View</Button>
                ) : (
                  <Button variant="secondary" size="sm" className="!px-2" onClick={() => void handleRunOcr()} disabled={!hasLocalImage || projectImageId === undefined || toolState?.phase === 'running' || toolState?.phase === 'loading'} aria-label="Run OCR" title="Run OCR" icon={<Play className="h-4 w-4" />}>Run</Button>
                )}
              </div>
              {toolState?.phase === 'running' && (
                <div className="mt-3" aria-live="polite">
                  <div className="mb-1 flex justify-between gap-2 text-xs text-app-accent-dim"><span>{toolState.status || 'Recognizing text'}</span><span>{Math.round(toolState.progress * 100)}%</span></div>
                  <div role="progressbar" aria-label="OCR progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(toolState.progress * 100)} className="h-1.5 overflow-hidden rounded-full bg-app-gray-light">
                    <div className="h-full bg-app-accent transition-[width]" style={{ width: `${Math.round(toolState.progress * 100)}%` }} />
                  </div>
                </div>
              )}
              {toolState?.phase === 'error' && <p className="mt-2 text-xs text-red-400" role="alert">{toolState.error}</p>}
              {toolState?.phase === 'ready' && toolState.result && <p className="mt-2 flex items-center gap-1 text-xs text-app-accent-dim"><CopyCheck className="h-3.5 w-3.5" aria-hidden="true" />Results saved to this project</p>}
            </li>
            {futureTools.map(({ name, shortName, icon: Icon }) => (
              <li key={name} aria-label={`${name}, planned`} className="flex min-w-0 items-center gap-3 rounded-lg border border-app-gray-light/30 px-3 py-3 opacity-65">
                <Icon className="h-5 w-5 flex-none text-app-accent-dim" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm text-app-white" title={name}>{shortName}</span>
                <span className="flex-none text-[10px] uppercase tracking-wide text-app-accent-dim">Soon</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="flex h-[184px] flex-none flex-col border-t border-app-gray-light/30 bg-app-gray/30">
        <div className="flex h-10 flex-none items-center justify-between border-b border-app-gray-light/20 px-4">
          <h3 className="text-sm font-medium text-app-white">Gallery</h3>
          <span className="text-xs tabular-nums text-app-accent-dim">{images.length} {images.length === 1 ? 'image' : 'images'}</span>
        </div>
        <div className="min-h-0 flex-1"><ImageGallery images={images} selectedImage={selectedImage} onSelect={onSelectImage} orientation="horizontal" /></div>
      </div>

      {showNoTextDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="ocr-empty-title" className="w-full max-w-md rounded-xl border border-app-gray-light bg-app-gray p-6 shadow-2xl">
            <h2 id="ocr-empty-title" className="text-lg font-semibold text-app-white">No text found</h2>
            <p className="mt-2 text-sm text-app-accent-dim">No text could be extracted from this image. Try another image or a clearer version.</p>
            <div className="mt-5 flex justify-end"><Button onClick={() => setShowNoTextDialog(false)}>Back to Workbench</Button></div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Workbench;
