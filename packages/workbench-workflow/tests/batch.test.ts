import {
  listBatchImageRoots,
  materializeGraphForImage,
  planSerialBatchRuns,
  validateRunnableWorkflow,
  type WorkflowGraph,
} from '../src';
import { WorkflowRunQueue } from '../src/batchQueue';

const batchGraph: WorkflowGraph = {
  formatVersion: 1,
  name: 'Batch OCR',
  nodes: [
    { id: 'all', type: 'all-images', position: { x: 0, y: 0 }, settings: { active: true } },
    { id: 'ocr', type: 'ocr', position: { x: 1, y: 0 }, settings: { language: 'eng' } },
    { id: 'text', type: 'text', position: { x: 2, y: 0 }, settings: {} },
  ],
  edges: [
    { id: 'in', source: 'all', sourcePort: 'image', target: 'ocr', targetPort: 'image' },
    { id: 'out', source: 'ocr', sourcePort: 'text', target: 'text', targetPort: 'text' },
  ],
};

describe('batch workflow planning', () => {
  it('validates active all-images without imageId', () => {
    expect(validateRunnableWorkflow(batchGraph)).toEqual([]);
  });

  it('rejects inactive all-images input', () => {
    const inactive = {
      ...batchGraph,
      nodes: batchGraph.nodes.map((node) => node.id === 'all' ? { ...node, settings: { active: false } } : node),
    };
    expect(validateRunnableWorkflow(inactive).map((issue) => issue.message))
      .toContain('Enable the All images input or choose a project image.');
  });

  it('materializes all-images nodes as image nodes for a run', () => {
    const materialized = materializeGraphForImage(batchGraph, 42);
    const input = materialized.nodes.find((node) => node.id === 'all');
    expect(input?.type).toBe('image');
    expect(input?.settings.imageId).toBe(42);
    expect(validateRunnableWorkflow(materialized)).toEqual([]);
  });

  it('plans one job per project image when batch root is active', () => {
    const { jobs } = planSerialBatchRuns(batchGraph, [1, 2, 3]);
    expect(jobs).toHaveLength(3);
    expect(jobs.map((job) => job.imageId)).toEqual([1, 2, 3]);
    expect(listBatchImageRoots(batchGraph)).toEqual(['all']);
  });

  it('returns no jobs for single-image workflows', () => {
    const single: WorkflowGraph = {
      ...batchGraph,
      nodes: [
        { id: 'image', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 9 } },
        ...batchGraph.nodes.filter((node) => node.id !== 'all'),
      ],
      edges: [{ id: 'in', source: 'image', sourcePort: 'image', target: 'ocr', targetPort: 'image' }, batchGraph.edges[1]],
    };
    expect(planSerialBatchRuns(single, [1, 2]).jobs).toEqual([]);
  });
});

describe('WorkflowRunQueue', () => {
  it('processes jobs in order and stops on failure', async () => {
    const queue = new WorkflowRunQueue();
    const order: number[] = [];
    queue.enqueue([
      { imageId: 1, graph: batchGraph },
      { imageId: 2, graph: batchGraph },
    ]);
    await expect(queue.process(async (job) => {
      order.push(job.imageId);
      if (job.imageId === 2) throw new Error('boom');
    })).rejects.toThrow('boom');
    expect(order).toEqual([1, 2]);
  });

  it('rejects enqueue while processing', async () => {
    const queue = new WorkflowRunQueue();
    queue.enqueue([{ imageId: 1, graph: batchGraph }]);
    const processing = queue.process(async () => {
      expect(() => queue.enqueue([{ imageId: 2, graph: batchGraph }])).toThrow('already running');
    });
    await processing;
  });
});
