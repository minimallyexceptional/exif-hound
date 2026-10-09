import { createImageNodeHandler, createOcrNodeHandler, getTextOutputSource, type WorkflowGraph } from '../src';

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
});
