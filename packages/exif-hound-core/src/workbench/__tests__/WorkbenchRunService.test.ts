import { WorkbenchRunService } from '../WorkbenchRunService';
import type { ProjectStore } from 'investigation-archive';
import type { WorkflowGraph } from 'workbench-workflow';
import type { ImageData } from '../../types/imageData';

jest.mock('../../middleware/preprocessImage', () => ({
  preprocessImage: jest.fn(async () => ({
    processedBytes: new Uint8Array([1, 2, 3]),
    manifest: {
      profile: 'ocr-default-v1',
      sourceWidth: 64,
      sourceHeight: 48,
      processedWidth: 128,
      processedHeight: 96,
      processedToSource: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
    },
  })),
}));

const graph: WorkflowGraph = {
  formatVersion: 1,
  name: 'OCR',
  nodes: [
    { id: 'image-node', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 12 } },
    { id: 'ocr-node', type: 'ocr', position: { x: 1, y: 0 }, settings: { language: 'eng' } },
    { id: 'text-node', type: 'text', position: { x: 2, y: 0 }, settings: {} },
  ],
  edges: [
    { id: 'e1', source: 'image-node', sourcePort: 'image', target: 'ocr-node', targetPort: 'image' },
    { id: 'e2', source: 'ocr-node', sourcePort: 'text', target: 'text-node', targetPort: 'text' },
  ],
};

const image = {
  id: 'img',
  projectImageId: 12,
  url: 'blob:',
  file: {
    name: 'poster.png',
    type: 'image/png',
    size: 3,
    lastModified: 0,
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  },
  exif: {},
} as ImageData;

describe('WorkbenchRunService', () => {
  it('persists OCR output for a minimal workflow', async () => {
    const appendWorkflowOcrResult = jest.fn().mockResolvedValue(undefined);
    const store = {
      createWorkflowRun: jest.fn().mockResolvedValue(undefined),
      updateWorkflowRun: jest.fn().mockResolvedValue(undefined),
      appendWorkflowOcrResult,
    } as unknown as ProjectStore;
    const recognizeImage = jest.fn(async () => ({
      text: 'hello',
      confidence: 90,
      words: [],
      provider: 'paddle' as const,
      engineVersion: 'v1',
    }));
    const service = new WorkbenchRunService({ store, images: [image], recognizeImage });
    const outcome = await service.execute('wf-1', graph, [], {
      onRunProgress: jest.fn(),
      onRunState: jest.fn(),
      onNodePatch: jest.fn(),
    });
    if (outcome.error) throw outcome.error;
    expect(appendWorkflowOcrResult).toHaveBeenCalledWith(expect.objectContaining({
      imageId: 12,
      text: 'hello',
      workflowId: 'wf-1',
      nodeId: 'ocr-node',
    }));
  });
});
