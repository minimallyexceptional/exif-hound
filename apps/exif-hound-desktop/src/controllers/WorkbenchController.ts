import type { ExifHoundCore } from 'exif-hound-core';
import {
  clearProjectImageSelections,
  normalizeConnection,
  parseWorkflow,
  serializeWorkflow,
  WorkflowRunQueue,
  WorkflowRunner,
} from 'exif-hound-core';

export class WorkbenchController {
  readonly run;
  readonly planner;
  readonly graph;
  readonly project;
  readonly inspector;
  readonly visualIdentifierSettings;
  readonly workflow = {
    parseWorkflow,
    serializeWorkflow,
    normalizeConnection,
    WorkflowRunQueue,
    WorkflowRunner,
    clearProjectImageSelections,
  };

  constructor(core: ExifHoundCore) {
    this.run = core.workbench.run;
    this.planner = core.workbench.planner;
    this.graph = core.workbench.graph;
    this.project = core.workbench.project;
    this.inspector = core.workbench.inspector;
    this.visualIdentifierSettings = core.workbench.visualIdentifierSettings;
  }
}
