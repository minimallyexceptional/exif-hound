import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Image, ScanText, Text } from 'lucide-react';
import type { NodeKind } from 'workbench-workflow';
import type { ImageData } from '../../types';

export interface WorkbenchFlowData {
  [key: string]: unknown;
  settings: Record<string, string | number | boolean | null>;
  image?: ImageData;
  state?: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  status?: string;
}

type Props = NodeProps & { data: WorkbenchFlowData; type: NodeKind; children?: React.ReactNode; input?: string; output?: string };

const labels: Record<NodeKind, { title: string; icon: typeof Image }> = {
  image: { title: 'Image', icon: Image },
  ocr: { title: 'OCR', icon: ScanText },
  text: { title: 'Text output', icon: Text },
};

export const NodeFrame: React.FC<Props> = ({
  type, data, selected, children, input, output,
}) => {
  const config = labels[type];
  const Icon = config.icon;
  const active = data.state === 'running';
  return (
    <article data-testid={`flow-node-${type}`} className={`w-[250px] overflow-hidden rounded-xl border bg-app-gray shadow-xl transition-colors ${
      active ? 'border-app-accent ring-2 ring-app-accent/40' : selected ? 'border-app-accent' : 'border-app-gray-light'
    }`}>
      {input && <Handle type="target" position={Position.Left} id={input} className="!h-3 !w-3 !border-2 !border-app-gray !bg-app-accent" />}
      <header className="flex items-center gap-2 border-b border-app-gray-light/70 px-3 py-2.5">
        <Icon className="h-4 w-4 text-app-accent" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-app-white">{config.title}</span>
        {data.state === 'running' && <span className="ml-auto rounded-full bg-app-accent/15 px-2 py-0.5 text-[10px] text-app-accent">Working</span>}
        {data.state === 'completed' && <span className="ml-auto text-[10px] text-app-accent-dim">Done</span>}
        {data.state === 'failed' && <span className="ml-auto text-[10px] text-app-danger">Failed</span>}
      </header>
      {children}
      {data.state === 'running' && (
        <div className="border-t border-app-gray-light/50 px-3 py-2" aria-live="polite">
          <div className="mb-1 flex justify-between text-[10px] text-app-accent-dim"><span>{data.status || 'Processing'}</span><span>{Math.round((data.progress ?? 0) * 100)}%</span></div>
          <div role="progressbar" aria-label={`${config.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((data.progress ?? 0) * 100)} className="h-1 overflow-hidden rounded bg-app-gray-light">
            <div className="h-full bg-app-accent transition-[width]" style={{ width: `${Math.round((data.progress ?? 0) * 100)}%` }} />
          </div>
        </div>
      )}
      {data.state === 'failed' && data.status && <p className="border-t border-app-gray-light/50 px-3 py-2 text-xs text-app-danger">{data.status}</p>}
      {output && <Handle type="source" position={Position.Right} id={output} className="!h-3 !w-3 !border-2 !border-app-gray !bg-app-accent" />}
    </article>
  );
};
