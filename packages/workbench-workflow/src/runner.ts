import { validateRunnableWorkflow, WorkflowGraph, WorkflowNode } from './workflow';

export interface NodeResult { data: unknown; status?: 'success' | 'no-text' }
export interface NodeContext {
  inputs: Map<string, unknown>;
  reportProgress: (progress: number, status?: string) => void;
}
export type NodeHandler = (node: WorkflowNode, context: NodeContext) => Promise<NodeResult>;
export type RunEvent =
  | { type: 'started'; total: number }
  | { type: 'node-started'; nodeId: string; completed: number; total: number }
  | { type: 'node-progress'; nodeId: string; progress: number; status?: string }
  | { type: 'node-completed'; nodeId: string; completed: number; total: number; result: NodeResult }
  | { type: 'completed'; completed: number; total: number }
  | { type: 'failed'; nodeId: string; error: string; completed: number; total: number };

export interface RunOptions {
  handlers: Partial<Record<WorkflowNode['type'], NodeHandler>>;
  persistResult: (node: WorkflowNode, result: NodeResult) => Promise<void>;
  onEvent?: (event: RunEvent) => void | Promise<void>;
}

export class WorkflowRunner {
  private running = false;

  async run(graph: WorkflowGraph, options: RunOptions): Promise<void> {
    if (this.running) throw new Error('This workflow is already running.');
    const issues = validateRunnableWorkflow(graph);
    if (issues.length) throw new Error(issues[0].message);
    const order = topologicalOrder(graph);
    const paths = new Set<string>();
    for (const transform of graph.nodes.filter((node) => node.type === 'ocr')) {
      paths.add(transform.id);
      const input = graph.edges.find((edge) => edge.target === transform.id && edge.targetPort === 'image');
      if (input) paths.add(input.source);
    }
    const executable = order.filter((node) => paths.has(node.id));
    for (const node of executable) {
      if (!options.handlers[node.type]) throw new Error(`No handler registered for ${node.type}.`);
    }
    if (!executable.length) throw new Error('Connect an Image, OCR, and Text node before running.');

    this.running = true;
    let completed = 0;
    let currentNodeId = '';
    const outputs = new Map<string, NodeResult>();
    await options.onEvent?.({ type: 'started', total: executable.length });
    try {
      for (const node of executable) {
        currentNodeId = node.id;
        await options.onEvent?.({ type: 'node-started', nodeId: node.id, completed, total: executable.length });
        const inputs = new Map<string, unknown>();
        for (const edge of graph.edges.filter((item) => item.target === node.id)) {
          const value = outputs.get(edge.source)?.data;
          if (value === undefined) throw new Error(`No input is available for node ${node.id}.`);
          inputs.set(edge.targetPort, value);
        }
        const result = await options.handlers[node.type]!(node, {
          inputs,
          reportProgress: (progress, status) => {
            void options.onEvent?.({
              type: 'node-progress', nodeId: node.id, progress: Math.max(0, Math.min(1, progress)), status,
            });
          },
        });
        if (node.type !== 'image') await options.persistResult(node, result);
        outputs.set(node.id, result);
        completed += 1;
        await options.onEvent?.({ type: 'node-completed', nodeId: node.id, completed, total: executable.length, result });
      }
      await options.onEvent?.({ type: 'completed', completed, total: executable.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await options.onEvent?.({ type: 'failed', nodeId: currentNodeId, error: message, completed, total: executable.length });
      throw error;
    } finally {
      this.running = false;
    }
  }
}

function topologicalOrder(graph: WorkflowGraph): WorkflowNode[] {
  const ordered: WorkflowNode[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Workflow contains a cycle.');
    const node = graph.nodes.find((item) => item.id === id);
    if (!node) return;
    visiting.add(id);
    for (const edge of graph.edges.filter((item) => item.target === id)) visit(edge.source);
    visiting.delete(id);
    visited.add(id);
    ordered.push(node);
  };
  // Start from each processing transform so independent paths execute in
  // sequence (image → transform), while shared inputs are evaluated once.
  graph.nodes.filter((node) => node.type === 'ocr').forEach((node) => visit(node.id));
  graph.nodes.forEach((node) => visit(node.id));
  return ordered;
}
