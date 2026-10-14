import type { OcrResultRecord, ProjectStore, WorkflowToolResultRecord } from 'investigation-archive';
import { parseWorkflow } from 'workbench-workflow';
import type { ProjectEvidenceSources } from './loadProjectEvidence';

type ProjectEvidenceStore = ProjectStore & {
  listProjectOcrResults?: () => Promise<OcrResultRecord[]>;
  listProjectIdentifierResults?: () => Promise<WorkflowToolResultRecord[]>;
  listProjectProvenanceResults?: () => Promise<WorkflowToolResultRecord[]>;
};

/** Loads OCR, identifier, and provenance rows from the active project store. */
export class EvidenceRepository {
  static async load(store: ProjectStore): Promise<ProjectEvidenceSources> {
    const extended = store as ProjectEvidenceStore;
    if (EvidenceRepository.hasProjectListApis(extended)) {
      const [ocr, identifiers, provenance] = await Promise.all([
        extended.listProjectOcrResults!(),
        extended.listProjectIdentifierResults!(),
        extended.listProjectProvenanceResults!(),
      ]);
      return { ocr, identifiers, provenance };
    }
    return EvidenceRepository.loadLegacy(store);
  }

  private static hasProjectListApis(store: ProjectEvidenceStore): store is ProjectEvidenceStore & {
    listProjectOcrResults: () => Promise<OcrResultRecord[]>;
    listProjectIdentifierResults: () => Promise<WorkflowToolResultRecord[]>;
    listProjectProvenanceResults: () => Promise<WorkflowToolResultRecord[]>;
  } {
    return typeof store.listProjectOcrResults === 'function'
      && typeof store.listProjectIdentifierResults === 'function'
      && typeof store.listProjectProvenanceResults === 'function';
  }

  private static async loadLegacy(store: ProjectStore): Promise<ProjectEvidenceSources> {
    const workflows = await store.listWorkflows();
    const ocrByKey = new Map<string, OcrResultRecord>();
    const identifiers: WorkflowToolResultRecord[] = [];
    const provenance: WorkflowToolResultRecord[] = [];

    const rememberOcr = (row: OcrResultRecord) => {
      const key = row.id != null
        ? `id:${row.id}`
        : `img:${row.imageId}:${row.processedAt.getTime()}:${row.workflowRunId ?? ''}`;
      ocrByKey.set(key, row);
    };

    for (const workflow of workflows) {
      let graph;
      try {
        graph = parseWorkflow(workflow.graphJson);
      } catch {
        continue;
      }
      for (const node of graph.nodes) {
        if (node.type === 'ocr') {
          for (const row of await store.listWorkflowOcrResults(workflow.id, node.id)) rememberOcr(row);
        }
        if (node.type === 'provenance') {
          provenance.push(...await store.listWorkflowProvenanceResults(workflow.id, node.id));
        }
        if (node.type === 'visual-identifiers') {
          identifiers.push(...await store.listWorkflowIdentifierResults(workflow.id, node.id));
        }
      }
    }

    for (const image of await store.listImages()) {
      if (!image.hasImage) continue;
      const row = await store.getOcrResult(image.id);
      if (row) rememberOcr(row);
    }

    const ocr = [...ocrByKey.values()].sort(
      (left, right) => right.processedAt.getTime() - left.processedAt.getTime(),
    );

    return { ocr, identifiers, provenance };
  }
}
