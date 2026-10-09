import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  clearProjectImageSelections,
  parseWorkflow,
  serializeWorkflow,
  validateConnection,
  validateRunnableWorkflow,
  WorkflowGraph,
} from '../src/workflow';

const graph: WorkflowGraph = {
  formatVersion: 1,
  name: 'Evidence review',
  nodes: [
    { id: 'image', type: 'image', position: { x: 1, y: 2 }, settings: { imageId: 9 } },
    { id: 'ocr', type: 'ocr', position: { x: 3, y: 4 }, settings: { language: 'eng' } },
    { id: 'text', type: 'text', position: { x: 5, y: 6 }, settings: {} },
  ],
  edges: [
    { id: 'e1', source: 'image', sourcePort: 'image', target: 'ocr', targetPort: 'image' },
    { id: 'e2', source: 'ocr', sourcePort: 'text', target: 'text', targetPort: 'text' },
  ],
};

describe('workflow graph', () => {
  it('round trips portable JSON without runtime state', () => {
    expect(parseWorkflow(serializeWorkflow(graph))).toEqual(graph);
  });

  it('opens the checked-in portable workflow fixture', () => {
    const fixture = readFileSync(join(__dirname, 'fixtures', 'portable-workflow.json'), 'utf8');
    const opened = parseWorkflow(fixture);
    expect(opened.name).toBe('Portable OCR review');
    expect(validateRunnableWorkflow({
      ...opened,
      nodes: opened.nodes.map((node) => node.id === 'image-source'
        ? { ...node, settings: { ...node.settings, imageId: 42 } }
        : node),
    })).toEqual([]);
  });

  it('rejects unsupported versions and malformed node records', () => {
    expect(() => parseWorkflow('{"formatVersion":2,"name":"x","nodes":[],"edges":[]}'))
      .toThrow('unsupported format');
    const invalid = JSON.stringify({ ...graph, nodes: [{ id: 'x', type: 'unknown' }] });
    expect(() => parseWorkflow(invalid)).toThrow('invalid node');
  });

  it('rejects incompatible connections', () => {
    expect(validateConnection(graph, {
      id: 'bad', source: 'image', sourcePort: 'image', target: 'text', targetPort: 'text',
    })).toEqual(expect.objectContaining({ message: expect.stringContaining('matching data types') }));
  });

  it('clears project image selections without changing template graph structure', () => {
    const imported = clearProjectImageSelections(graph);
    expect(imported.nodes[0].settings.imageId).toBeNull();
    expect(imported.edges).toEqual(graph.edges);
    expect(graph.nodes[0].settings.imageId).toBe(9);
  });

  it('requires each OCR transform to have a selected image and text output', () => {
    const invalid = { ...graph, nodes: graph.nodes.map((node) => node.id === 'image' ? { ...node, settings: { imageId: null } } : node) };
    expect(validateRunnableWorkflow(invalid).map((issue) => issue.message)).toContain('Choose a project image for every connected Image node.');
  });

  it('accepts connected provenance and visual identifier transforms with evidence outputs', () => {
    const forensic: WorkflowGraph = {
      formatVersion: 1,
      name: 'Forensic triage',
      nodes: [
        { id: 'image', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 9 } },
        { id: 'provenance', type: 'provenance', position: { x: 1, y: 0 }, settings: {} },
        { id: 'identifiers', type: 'visual-identifiers', position: { x: 1, y: 2 }, settings: { language: 'eng' } },
        { id: 'evidence', type: 'evidence', position: { x: 2, y: 1 }, settings: {} },
      ],
      edges: [
        { id: 'p-in', source: 'image', sourcePort: 'image', target: 'provenance', targetPort: 'image' },
        { id: 'p-out', source: 'provenance', sourcePort: 'evidence', target: 'evidence', targetPort: 'evidence' },
        { id: 'i-in', source: 'image', sourcePort: 'image', target: 'identifiers', targetPort: 'image' },
        { id: 'i-out', source: 'identifiers', sourcePort: 'evidence', target: 'evidence', targetPort: 'evidence' },
      ],
    };

    expect(validateRunnableWorkflow(forensic)).toEqual([]);
    expect(parseWorkflow(serializeWorkflow(forensic))).toEqual(forensic);
  });

  it('rejects a forensic transform without an Evidence Report output', () => {
    const incomplete: WorkflowGraph = {
      formatVersion: 1, name: 'Incomplete',
      nodes: [
        { id: 'image', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 9 } },
        { id: 'provenance', type: 'provenance', position: { x: 1, y: 0 }, settings: {} },
      ],
      edges: [{ id: 'in', source: 'image', sourcePort: 'image', target: 'provenance', targetPort: 'image' }],
    };

    expect(validateRunnableWorkflow(incomplete).map(issue => issue.message)).toContain('Connect every forensic transform to an Evidence Report output.');
  });
});
