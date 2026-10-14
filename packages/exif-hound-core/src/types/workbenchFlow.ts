import type { ImageData } from './imageData';

export interface WorkbenchFlowData {
  [key: string]: unknown;
  settings: Record<string, string | number | boolean | null>;
  image?: ImageData;
  state?: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  status?: string;
}
