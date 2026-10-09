import { createImageNodeHandler, createOcrNodeHandler, createImageProvenanceNodeHandler, createVisualIdentifierNodeHandler, getEvidenceOutputSources, getTextOutputSource, type WorkflowGraph } from '../src';

describe('node handlers', () => {
  const imageNode = { id: 'image', type: 'image' as const, position: { x: 0, y: 0 }, settings: { imageId: 14 } };
  const ocrNode = { id: 'ocr', type: 'ocr' as const, position: { x: 1, y: 0 }, settings: { language: 'eng' } };
  const textNode = { id: 'text', type: 'text' as const, position: { x: 2, y: 0 }, settings: {} };
  const graph: WorkflowGraph = {
    formatVersion: 1, name: 'x', nodes: [imageNode, ocrNode, textNode],
    edges: [
      { id: 'a', source: 'image', sourcePort: 'image', target: 'ocr', targetPort: 'image' },
      { id: 'b', source: 'ocr', sourcePort: 'text', target: 'text', targetPort: 'text' },
    ],
  };

  it('resolves image nodes through an injected project-image adapter', async () => {
    const handler = createImageNodeHandler((id) => ({ imageId: id, imageName: 'poster.jpg', payload: 'blob' }));
    await expect(handler(imageNode, { inputs: new Map(), reportProgress: jest.fn() })).resolves.toEqual({
      data: { imageId: 14, imageName: 'poster.jpg', payload: 'blob' },
    });
  });

  it('forwards OCR language and progress and represents an empty successful result', async () => {
    const progress = jest.fn();
    const recognize = jest.fn(async (_image, language, report) => {
      expect(language).toBe('eng');
      report(0.4, 'Recognizing');
      return { text: '  ', confidence: null };
    });
    const handler = createOcrNodeHandler(recognize);
    await expect(handler(ocrNode, {
      inputs: new Map([['image', { imageId: 14, imageName: 'poster.jpg', payload: 'blob' }]]), reportProgress: progress,
    })).resolves.toMatchObject({ status: 'no-text', data: { imageId: 14, text: '  ', confidence: null } });
    expect(progress).toHaveBeenCalledWith(0.4, 'Recognizing');
  });

  it('finds only the connected OCR node for a text output', () => {
    expect(getTextOutputSource(graph, 'text')).toEqual(ocrNode);
    expect(getTextOutputSource(graph, 'missing')).toBeNull();
  });

  it('passes connected image, node settings, and progress to local forensic services', async () => {
    const input = { imageId: 14, imageName: 'poster.jpg', payload: 'local-image' };
    const forensicImage = { ...imageNode, id: 'provenance', type: 'provenance' as const, settings: { detail: true } };
    const identifiers = { ...imageNode, id: 'identifiers', type: 'visual-identifiers' as const, settings: { language: 'eng' } };
    const progress = jest.fn();
    const analyze = jest.fn(async () => ({ flags: [] }));
    const identify = jest.fn(async () => ({ candidates: [] }));
    const context = { inputs: new Map([['image', input]]), reportProgress: progress };

    await expect(createImageProvenanceNodeHandler(analyze)(forensicImage, context)).resolves.toEqual({ data: { flags: [] } });
    await expect(createVisualIdentifierNodeHandler(identify)(identifiers, context)).resolves.toEqual({ data: { candidates: [] } });
    expect(analyze).toHaveBeenCalledWith(input, forensicImage.settings, progress);
    expect(identify).toHaveBeenCalledWith(input, identifiers.settings, progress);
  });

  it('lists both forensic transforms connected to an Evidence Report node', () => {
    const evidenceGraph: WorkflowGraph = {
      formatVersion: 1, name: 'Evidence',
      nodes: [
        { id: 'p', type: 'provenance', position: { x: 0, y: 0 }, settings: {} },
        { id: 'v', type: 'visual-identifiers', position: { x: 0, y: 1 }, settings: {} },
        { id: 'e', type: 'evidence', position: { x: 1, y: 1 }, settings: {} },
      ],
      edges: [
        { id: 'p-e', source: 'p', sourcePort: 'evidence', target: 'e', targetPort: 'evidence' },
        { id: 'v-e', source: 'v', sourcePort: 'evidence', target: 'e', targetPort: 'evidence' },
      ],
    };
    expect(getEvidenceOutputSources(evidenceGraph, 'e').map(node => node.id)).toEqual(['p', 'v']);
  });
});
