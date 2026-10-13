import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { FileOutput, FileSearch, Image, ScanSearch, ScanText, Text } from 'lucide-react';
import type { NodeKind } from 'workbench-workflow';
import type { ImageData } from '../../types';
import type { LucideIcon } from 'lucide-react';
import { sourceHandleId, targetHandleId } from './flowHandles';
import { portColor, portHandleClass } from './portStyle';

export interface WorkbenchFlowData {
  [key: string]: unknown;
  settings: Record<string, string | number | boolean | null>;
  image?: ImageData;
  state?: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  status?: string;
}

export interface NodeOutputHandle {
  id: string;
  label?: string;
}

type Props = NodeProps & {
  data: WorkbenchFlowData;
  type: NodeKind;
  children?: React.ReactNode;
  input?: string;
  inputLabel?: string;
  output?: string;
  outputs?: NodeOutputHandle[];
};

const labels: Record<NodeKind, { title: string; icon: LucideIcon }> = {
  image: { title: 'Image', icon: Image },
  ocr: { title: 'OCR', icon: ScanText },
  provenance: { title: 'Image Provenance', icon: FileSearch },
  'visual-identifiers': { title: 'Text & Identifiers', icon: ScanSearch },
  text: { title: 'Text output', icon: Text },
  evidence: { title: 'Evidence Report', icon: FileOutput },
};

export const NodeFrame: React.FC<Props> = ({
  type, data, selected, children, input, inputLabel, output, outputs,
}) => {
  const config = labels[type];
  const Icon = config.icon;
  const active = data.state === 'running';
  const sourcePorts = outputs ?? (output ? [{ id: output }] : []);
  const showPortRow = Boolean(inputLabel) || sourcePorts.some((port) => port.label);
  return (
    <article data-testid={`flow-node-${type}`} className={`relative w-[320px] rounded-xl border bg-app-gray shadow-xl transition-colors ${
      active ? 'border-app-accent ring-2 ring-app-accent/40' : selected ? 'border-app-accent' : 'border-app-gray-light'
    }`}>
      {input && <Handle type="target" position={Position.Left} id={targetHandleId(input)} data-port-type={input} style={inputLabel ? { top: '68%' } : undefined} className={portHandleClass(input)} />}
      {inputLabel && <span className="pointer-events-none absolute left-3 -translate-y-1/2 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ top: '68%', color: portColor(input ?? '') }}>{inputLabel}</span>}
      <header className="flex items-center gap-2.5 border-b border-app-gray-light/70 px-4 py-3">
        <Icon className="h-5 w-5 shrink-0 text-app-accent" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.12em] text-app-white" title={config.title}>{config.title}</span>
        {data.state === 'running' && <span className="ml-auto rounded-full bg-app-accent/15 px-2 py-0.5 text-[10px] text-app-accent">Working</span>}
        {data.state === 'completed' && <span className="ml-auto text-[10px] text-app-accent-dim">Done</span>}
        {data.state === 'failed' && <span className="ml-auto text-[10px] text-app-danger">Failed</span>}
      </header>
      {children}
      {!children && showPortRow && <div className="h-16" aria-hidden="true" />}
      {data.state === 'running' && (
        <div className="border-t border-app-gray-light/50 px-3 py-2" aria-live="polite">
          <div className="mb-1 flex justify-between text-[10px] text-app-accent-dim"><span>{data.status || 'Processing'}</span><span>{Math.round((data.progress ?? 0) * 100)}%</span></div>
          <div role="progressbar" aria-label={`${config.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((data.progress ?? 0) * 100)} className="h-1 overflow-hidden rounded bg-app-gray-light">
            <div className="h-full bg-app-accent transition-[width]" style={{ width: `${Math.round((data.progress ?? 0) * 100)}%` }} />
          </div>
        </div>
      )}
      {data.state === 'failed' && data.status && <p className="border-t border-app-gray-light/50 px-3 py-2 text-xs leading-relaxed break-words text-app-danger">{data.status}</p>}
      {sourcePorts.map((port, index) => {
        const top = `${((index + 1) / (sourcePorts.length + 1)) * 100}%`;
        return (
          <span key={port.id}>
            <Handle type="source" position={Position.Right} id={sourceHandleId(port.id)} data-port-type={port.id} style={{ top }} className={portHandleClass(port.id)} />
            {port.label && <span className="pointer-events-none absolute right-3 -translate-y-1/2 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ top, color: portColor(port.id) }}>{port.label}</span>}
          </span>
        );
      })}
    </article>
  );
};
