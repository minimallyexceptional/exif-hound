import type { WorkflowGraph } from 'exif-hound-core';
import { isFlowConnectionAllowed, portFromHandle, sourceHandleId, targetHandleId } from '../flowHandles';

const graph: WorkflowGraph = {
  formatVersion: 1,
  name: 'open',
  nodes: [
    { id: 'image', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 1 } },
    { id: 'ocr', type: 'ocr', position: { x: 1, y: 0 }, settings: { language: 'eng' } },
    { id: 'text', type: 'text', position: { x: 2, y: 0 }, settings: {} },
  ],
  edges: [{ id: 'e1', source: 'image', sourcePort: 'image', target: 'ocr', targetPort: 'image' }],
};

describe('flowHandles', () => {
  it('gives source and target handles distinct ids for the same port type', () => {
    expect(sourceHandleId('image')).toBe('out-image');
    expect(targetHandleId('image')).toBe('in-image');
    expect(sourceHandleId('image')).not.toBe(targetHandleId('image'));
  });

  it('reads the port type back from a handle id or a bare port name', () => {
    expect(portFromHandle('out-text')).toBe('text');
    expect(portFromHandle('in-evidence')).toBe('evidence');
    expect(portFromHandle('image')).toBe('image');
    expect(portFromHandle(null)).toBe('');
  });

  it('lets an OCR text handle start a drag before a target exists', () => {
    expect(isFlowConnectionAllowed(graph, { source: 'ocr', sourceHandle: 'out-text' })).toBe(true);
    expect(isFlowConnectionAllowed(graph, {
      source: 'ocr', target: 'ocr', sourceHandle: 'out-text', targetHandle: 'out-text',
    })).toBe(true);
  });

  it('accepts OCR text onto a Text output node', () => {
    expect(isFlowConnectionAllowed(graph, {
      source: 'ocr', target: 'text', sourceHandle: 'out-text', targetHandle: 'in-text',
    })).toBe(true);
  });
});
