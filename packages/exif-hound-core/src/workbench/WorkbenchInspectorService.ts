import type { OcrResultRecord, ProjectStore, WorkflowRunRecord, WorkflowToolResultRecord } from 'investigation-archive';
import {
  getEvidenceOutputSources,
  getTextOutputSource,
  type WorkflowGraph,
  type WorkflowNode,
} from 'workbench-workflow';

export interface WorkbenchEvidenceEntry {
  sourceNode: WorkflowNode;
  record: WorkflowToolResultRecord;
}

/** Loads saved OCR and forensic results for Workbench inspector panels. */
export class WorkbenchInspectorService {
  constructor(private readonly store: ProjectStore) {}

  async listTextResults(workflowId: string, graph: WorkflowGraph, textNodeId: string): Promise<OcrResultRecord[]> {
    const source = getTextOutputSource(graph, textNodeId);
    if (!source) return [];
    return this.store.listWorkflowOcrResults(workflowId, source.id);
  }

  async listEvidenceEntries(
    workflowId: string,
    graph: WorkflowGraph,
    evidenceNodeId: string,
  ): Promise<WorkbenchEvidenceEntry[]> {
    const sources = getEvidenceOutputSources(graph, evidenceNodeId);
    const records = await Promise.all(sources.map(async (source) => {
      const rows = source.type === 'provenance'
        ? await this.store.listWorkflowProvenanceResults(workflowId, source.id)
        : await this.store.listWorkflowIdentifierResults(workflowId, source.id);
      return rows.map((record) => ({ sourceNode: source, record }));
    }));
    return records.flat().sort(
      (left, right) => right.record.finishedAt.getTime() - left.record.finishedAt.getTime(),
    );
  }

  async listRunHistory(workflowId: string): Promise<WorkflowRunRecord[]> {
    return this.store.listWorkflowRuns(workflowId);
  }

  static lastRunLabel(lastRun: WorkflowRunRecord | undefined): string | null {
    if (!lastRun) return null;
    return `Last run: ${lastRun.status}${lastRun.finishedAt
      ? ` · ${lastRun.finishedAt.toLocaleString()}`
      : ` · started ${lastRun.startedAt.toLocaleString()}`}`;
  }
}
