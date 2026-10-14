import { normalizeConnection, type WorkflowGraph } from 'workbench-workflow';

export function sourceHandleId(port: string): string {
  return `out-${port}`;
}

export function targetHandleId(port: string): string {
  return `in-${port}`;
}

export function portFromHandle(handle: string | null | undefined): string {
  if (!handle) return '';
  return handle.replace(/^(in|out)-/, '');
}

export function isFlowConnectionAllowed(
  graph: WorkflowGraph | null,
  connection: { source?: string | null; target?: string | null; sourceHandle?: string | null; targetHandle?: string | null },
): boolean {
  if (!graph || !connection.source) return false;
  if (!connection.target || connection.source === connection.target) return true;
  return !('message' in normalizeConnection(graph, {
    id: 'preview',
    source: connection.source,
    sourcePort: portFromHandle(connection.sourceHandle),
    target: connection.target,
    targetPort: portFromHandle(connection.targetHandle),
  }));
}
