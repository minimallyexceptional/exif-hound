import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, ScanText } from 'lucide-react';
import type { OcrResultRecord } from 'investigation-archive';
import { ImageData } from '../types';
import { Button } from './common/Button';

interface Props {
  image: ImageData;
  result: OcrResultRecord;
  onBack: () => void;
}

const OcrResultsView: React.FC<Props> = ({ image, result, onBack }) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('error');
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-black" aria-label="OCR results">
      <header className="flex flex-none items-center justify-between gap-4 border-b border-app-gray-light/30 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back to Workbench" icon={<ArrowLeft className="h-4 w-4" />}>Workbench</Button>
          <div className="min-w-0 border-l border-app-gray-light/40 pl-3">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-app-white"><ScanText className="h-5 w-5 text-app-accent" aria-hidden="true" />OCR results</h1>
            <p className="truncate text-sm text-app-accent-dim" title={image.file.name}>{image.file.name}</p>
          </div>
        </div>
        <span className="hidden flex-none text-xs text-app-accent-dim sm:block">Confidence {Math.round(result.confidence)}%</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-5 sm:p-8">
        <article className="mx-auto flex w-full max-w-4xl flex-col rounded-xl border border-app-gray-light/40 bg-app-gray/40">
          <div className="flex items-center justify-between gap-3 border-b border-app-gray-light/30 px-5 py-3">
            <div>
              <h2 className="font-medium text-app-white">Extracted text</h2>
              <p className="mt-0.5 text-xs text-app-accent-dim">One result from {image.file.name}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => void copyText()} icon={copyState === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
              {copyState === 'copied' ? 'Copied' : 'Copy text'}
            </Button>
          </div>
          <div className="selectable-value whitespace-pre-wrap break-words p-5 font-mono text-sm leading-7 text-app-white sm:p-7">{result.text}</div>
          {copyState === 'error' && <p className="border-t border-app-gray-light/30 px-5 py-3 text-sm text-red-400" role="alert">Could not copy text. Check clipboard access and try again.</p>}
          {copyState === 'copied' && <p className="border-t border-app-gray-light/30 px-5 py-3 text-sm text-app-accent" role="status">Extracted text copied to clipboard.</p>}
        </article>
      </div>
    </section>
  );
};

export default OcrResultsView;
