import { WorkflowRunner } from '../src/runner';
import { WorkflowGraph } from '../src/workflow';

const workflow: WorkflowGraph = {
  formatVersion: 1,
  name: 'Two paths',
  nodes: [
    { id: 'img1', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 1 } },
    { id: 'ocr1', type: 'ocr', position: { x: 1, y: 0 }, settings: {} },
    { id: 'text1', type: 'text', position: { x: 2, y: 0 }, settings: {} },
    { id: 'img2', type: 'image', position: { x: 0, y: 2 }, settings: { imageId: 2 } },
    { id: 'ocr2', type: 'ocr', position: { x: 1, y: 2 }, settings: {} },
    { id: 'text2', type: 'text', position: { x: 2, y: 2 }, settings: {} },
  ],
  edges: [
    { id: 'a', source: 'img1', sourcePort: 'image', target: 'ocr1', targetPort: 'image' },
    { id: 'b', source: 'ocr1', sourcePort: 'text', target: 'text1', targetPort: 'text' },
    { id: 'c', source: 'img2', sourcePort: 'image', target: 'ocr2', targetPort: 'image' },
    { id: 'd', source: 'ocr2', sourcePort: 'text', target: 'text2', targetPort: 'text' },
  ],
};

describe('WorkflowRunner', () => {
  it('runs each image and transform in dependency order, reports progress, and persists tool results', async () => {
    const runner = new WorkflowRunner();
    const calls: string[] = [];
    const events: string[] = [];
    const writes: string[] = [];
    await runner.run(workflow, {
      handlers: {
        image: async (node) => { calls.push(node.id); return { data: `image-${node.id}` }; },
        ocr: async (node, context) => {
          calls.push(node.id);
          context.reportProgress(0.5, 'Recognizing');
          expect(context.inputs.get('image')).toBe(`image-${node.id === 'ocr1' ? 'img1' : 'img2'}`);
          return { data: `text-${node.id}` };
        },
      },
      persistResult: async (node) => { writes.push(node.id); },
      onEvent: (event) => { events.push(event.type); },
    });
    expect(calls).toEqual(['img1', 'ocr1', 'img2', 'ocr2']);
    expect(writes).toEqual(['ocr1', 'ocr2']);
    expect(events).toContain('node-progress');
    expect(events).toContain('completed');
  });

  it('keeps earlier results and reports the failing node when a later handler fails', async () => {
    const runner = new WorkflowRunner();
    const persisted: string[] = [];
    let failure: unknown;
    await expect(runner.run(workflow, {
      handlers: {
        image: async (node) => ({ data: node.id }),
        ocr: async (node) => {
          if (node.id === 'ocr2') throw new Error('OCR failed');
          return { data: 'ok' };
        },
      },
      persistResult: async (node) => { persisted.push(node.id); },
      onEvent: (event) => { if (event.type === 'failed') failure = event; },
    })).rejects.toThrow('OCR failed');
    expect(persisted).toEqual(['ocr1']);
    expect(failure).toEqual(expect.objectContaining({ type: 'failed', nodeId: 'ocr2' }));
  });

  it('rejects overlapping runs', async () => {
    const runner = new WorkflowRunner();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => { release = resolve; });
    const running = runner.run(workflow, {
      handlers: { image: async () => { await wait; return { data: 'img' }; }, ocr: async () => ({ data: 'text' }) },
      persistResult: async () => {},
    });
    await Promise.resolve();
    await expect(runner.run(workflow, { handlers: {}, persistResult: async () => {} })).rejects.toThrow('already running');
    release();
    await running;
  });
});
