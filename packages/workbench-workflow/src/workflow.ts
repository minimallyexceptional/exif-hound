export type NodeKind = 'image' | 'ocr' | 'text';
export type PortType = 'image' | 'text';
export interface Point { x: number; y: number }
export interface WorkflowNode {
  id: string;
  type: NodeKind;
  position: Point;
  settings: Record<string, string | number | boolean | null>;
}
export interface WorkflowEdge {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
}
export interface WorkflowGraph {
  formatVersion: 1;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const ports: Record<NodeKind, { inputs: PortType[]; outputs: PortType[] }> = {
  image: { inputs: [], outputs: ['image'] },
  ocr: { inputs: ['image'], outputs: ['text'] },
  text: { inputs: ['text'], outputs: [] },
};

export interface ValidationIssue { message: string; nodeId?: string; edgeId?: string }

export function validateConnection(graph: WorkflowGraph, edge: WorkflowEdge): ValidationIssue | null {
  const source = graph.nodes.find((node) => node.id === edge.source);
  const target = graph.nodes.find((node) => node.id === edge.target);
  if (!source || !target) return { message: 'Both connected nodes must exist.', edgeId: edge.id };
  if (!ports[source.type].outputs.includes(edge.sourcePort as PortType)
    || !ports[target.type].inputs.includes(edge.targetPort as PortType)) {
    return { message: 'The selected node ports are incompatible.', edgeId: edge.id };
  }
  const sourceType = edge.sourcePort as PortType;
  const targetType = edge.targetPort as PortType;
  if (sourceType !== targetType) return { message: 'Connected ports must have matching data types.', edgeId: edge.id };
  if (graph.edges.some((current) => current.id !== edge.id && current.target === edge.target && current.targetPort === edge.targetPort)) {
    return { message: 'This input port already has a connection.', edgeId: edge.id };
  }
  return null;
}

export function validateGraph(graph: WorkflowGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) issues.push({ message: `Duplicate node ID: ${node.id}`, nodeId: node.id });
    ids.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) issues.push({ message: `Duplicate edge ID: ${edge.id}`, edgeId: edge.id });
    edgeIds.add(edge.id);
    const issue = validateConnection(graph, edge);
    if (issue) issues.push(issue);
  }
  return issues;
}

export function validateRunnableWorkflow(graph: WorkflowGraph): ValidationIssue[] {
  const issues = validateGraph(graph);
  if (issues.length) return issues;
  const transforms = graph.nodes.filter((node) => node.type === 'ocr');
  if (!transforms.length) return [{ message: 'Add an OCR node to the workflow.' }];
  for (const node of transforms) {
    const input = graph.edges.find((edge) => edge.target === node.id && edge.targetPort === 'image');
    const output = graph.edges.find((edge) => edge.source === node.id && edge.sourcePort === 'text');
    const image = input && graph.nodes.find((candidate) => candidate.id === input.source);
    const text = output && graph.nodes.find((candidate) => candidate.id === output.target);
    if (!image || image.type !== 'image') issues.push({ message: 'Connect an Image node to every OCR node.', nodeId: node.id });
    else if (typeof image.settings.imageId !== 'number') issues.push({ message: 'Choose a project image for every connected Image node.', nodeId: image.id });
    if (!text || text.type !== 'text') issues.push({ message: 'Connect every OCR node to a Text output.', nodeId: node.id });
  }
  return issues;
}

export function serializeWorkflow(graph: WorkflowGraph): string {
  const issues = validateGraph(graph);
  if (issues.length) throw new Error(issues[0].message);
  return JSON.stringify(graph, null, 2);
}

export function parseWorkflow(json: string): WorkflowGraph {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object') throw new Error('Workflow file must contain a JSON object.');
  const graph = value as WorkflowGraph;
  if (graph.formatVersion !== 1 || typeof graph.name !== 'string' || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Workflow file uses an unsupported format.');
  }
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !['image', 'ocr', 'text'].includes(node.type)
      || typeof node.position?.x !== 'number' || typeof node.position?.y !== 'number'
      || !node.settings || typeof node.settings !== 'object') {
      throw new Error('Workflow file contains an invalid node.');
    }
  }
  for (const edge of graph.edges) {
    if (!edge || typeof edge.id !== 'string' || typeof edge.source !== 'string' || typeof edge.target !== 'string'
      || typeof edge.sourcePort !== 'string' || typeof edge.targetPort !== 'string') {
      throw new Error('Workflow file contains an invalid connection.');
    }
  }
  const issues = validateGraph(graph);
  if (issues.length) throw new Error(issues[0].message);
  return graph;
}

export function clearProjectImageSelections(graph: WorkflowGraph): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => node.type === 'image'
      ? { ...node, settings: { ...node.settings, imageId: null } }
      : { ...node, settings: { ...node.settings } }),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}
