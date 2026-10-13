import {
  listBatchImageRoots,
  planSerialBatchRuns,
  transformNodeTypes,
  validateRunnableWorkflow,
  type WorkflowGraph,
} from 'workbench-workflow';

export interface RunnableIssue {
  message: string;
}

/** Validates graphs and plans batch runs without UI dependencies. */
export class WorkbenchRunPlanner {
  countPipelineNodes(graph: WorkflowGraph): number {
    const pipelineNodeIds = new Set<string>();
    for (const transform of graph.nodes.filter((node) => transformNodeTypes.includes(node.type))) {
      pipelineNodeIds.add(transform.id);
      const imageEdge = graph.edges.find((edge) => edge.target === transform.id && edge.targetPort === 'image');
      if (imageEdge) pipelineNodeIds.add(imageEdge.source);
    }
    return pipelineNodeIds.size;
  }

  batchJobCount(graph: WorkflowGraph, projectImageIds: number[]): number {
    return planSerialBatchRuns(graph, projectImageIds).jobs.length;
  }

  planBatchJobs(graph: WorkflowGraph, projectImageIds: number[]) {
    return planSerialBatchRuns(graph, projectImageIds);
  }

  runnableIssues(graph: WorkflowGraph, projectImageIds: number[]): RunnableIssue[] {
    const issues = validateRunnableWorkflow(graph);
    if (listBatchImageRoots(graph).length > 0 && projectImageIds.length === 0) {
      return [...issues, { message: 'Import an image into this project to run this batch workflow.' }];
    }
    return issues;
  }
}
