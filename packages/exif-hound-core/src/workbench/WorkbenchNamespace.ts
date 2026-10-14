import { WorkbenchRunService } from './WorkbenchRunService';
import { WorkbenchRunPlanner } from './WorkbenchRunPlanner';
import { WorkbenchGraphMapper } from './WorkbenchGraphMapper';
import { WorkbenchProjectService } from './WorkbenchProjectService';
import { WorkbenchInspectorService } from './WorkbenchInspectorService';
import { VisualIdentifierSettingsResolver } from './VisualIdentifierSettingsResolver';

export { WorkbenchRunService } from './WorkbenchRunService';
export type {
  WorkbenchRunProgressSnapshot,
  WorkbenchRunNodePatch,
  WorkbenchRunListeners,
  WorkbenchRunOutcome,
  WorkbenchRunServiceOptions,
} from './WorkbenchRunService';
export { WorkbenchRunPlanner } from './WorkbenchRunPlanner';
export { WorkbenchGraphMapper, createWorkflowNodeId, createEmptyWorkflowGraph } from './WorkbenchGraphMapper';
export type { WorkbenchCanvasNode } from './WorkbenchGraphMapper';
export { WorkbenchProjectService } from './WorkbenchProjectService';
export { WorkbenchInspectorService } from './WorkbenchInspectorService';
export { VisualIdentifierSettingsResolver } from './VisualIdentifierSettingsResolver';
export * from './workbenchCatalog';
export * from './workbenchOcrHelpers';
export * from './flowHandles';
export {
  clearProjectImageSelections,
  parseWorkflow,
  serializeWorkflow,
  normalizeConnection,
  WorkflowRunQueue,
  WorkflowRunner,
} from 'workbench-workflow';
export type { NodeKind, WorkflowGraph, WorkflowNode, RunEvent } from 'workbench-workflow';

export class WorkbenchNamespace {
  readonly run = WorkbenchRunService;
  readonly planner = WorkbenchRunPlanner;
  readonly graph = WorkbenchGraphMapper;
  readonly project = WorkbenchProjectService;
  readonly inspector = WorkbenchInspectorService;
  readonly visualIdentifierSettings = VisualIdentifierSettingsResolver;
}
