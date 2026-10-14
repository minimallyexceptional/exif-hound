import { resolveImageInputRoot, transformNodeTypes, type WorkflowGraph } from './workflow';

export interface BatchRunJob {
  imageId: number;
  graph: WorkflowGraph;
}

export function listBatchImageRoots(graph: WorkflowGraph): string[] {
  const roots = new Set<string>();
  for (const transform of graph.nodes.filter((node) => transformNodeTypes.includes(node.type))) {
    const root = resolveImageInputRoot(graph, transform.id);
    if (root?.type === 'all-images' && root.settings.active === true) roots.add(root.id);
  }
  return [...roots];
}

export function materializeGraphForImage(graph: WorkflowGraph, imageId: number): WorkflowGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.type !== 'all-images') return { ...node, settings: { ...node.settings } };
      const settings = { ...node.settings, imageId };
      delete (settings as Record<string, unknown>).active;
      return {
        ...node,
        type: 'image',
        settings,
      };
    }),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

export function planSerialBatchRuns(graph: WorkflowGraph, projectImageIds: number[]): { jobs: BatchRunJob[] } {
  const batchRoots = listBatchImageRoots(graph);
  if (!batchRoots.length) return { jobs: [] };
  if (batchRoots.length > 1) throw new Error('Only one All images input can feed this workflow.');
  const jobs = projectImageIds.map((imageId) => ({
    imageId,
    graph: materializeGraphForImage(graph, imageId),
  }));
  return { jobs };
}
