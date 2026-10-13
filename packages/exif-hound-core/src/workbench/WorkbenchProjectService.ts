import type { ProjectStore, ProjectWorkflowRecord } from 'investigation-archive';
import { parseWorkflow, serializeWorkflow } from 'workbench-workflow';
import { createEmptyWorkflowGraph, createWorkflowNodeId } from './WorkbenchGraphMapper';

/** Project-scoped workflow persistence helpers for the Workbench UI. */
export class WorkbenchProjectService {
  constructor(private readonly store: ProjectStore) {}

  async listWorkflows(): Promise<ProjectWorkflowRecord[]> {
    return this.store.listWorkflows();
  }

  async bootstrapProjectWorkflows(): Promise<{
    active: ProjectWorkflowRecord;
    workflows: ProjectWorkflowRecord[];
  }> {
    let workflows = await this.listWorkflows();
    if (!workflows.length) {
      const id = createWorkflowNodeId();
      const graph = createEmptyWorkflowGraph('Untitled workflow');
      const record = {
        id,
        name: graph.name,
        graphJson: serializeWorkflow(graph),
        updatedAt: new Date(),
      };
      await this.store.saveWorkflow(record);
      workflows = [record];
    }
    return { active: workflows[0], workflows };
  }

  async saveWorkflow(record: ProjectWorkflowRecord): Promise<void> {
    await this.store.saveWorkflow(record);
  }

  parseWorkflowRecord(record: ProjectWorkflowRecord) {
    return parseWorkflow(record.graphJson);
  }

  static errorMessage(cause: unknown, fallback: string): string {
    return cause instanceof Error ? cause.message : fallback;
  }
}
