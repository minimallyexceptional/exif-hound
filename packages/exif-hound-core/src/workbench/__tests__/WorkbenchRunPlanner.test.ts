import { WorkbenchRunPlanner } from '../WorkbenchRunPlanner';
import type { WorkflowGraph } from 'workbench-workflow';

const batchGraph: WorkflowGraph = {
  formatVersion: 1,
  name: 'Batch',
  nodes: [
    { id: 'all', type: 'all-images', position: { x: 0, y: 0 }, settings: { active: true } },
    { id: 'ocr', type: 'ocr', position: { x: 1, y: 0 }, settings: { language: 'eng' } },
  ],
  edges: [{ id: 'e', source: 'all', sourcePort: 'image', target: 'ocr', targetPort: 'image' }],
};

describe('WorkbenchRunPlanner', () => {
  const planner = new WorkbenchRunPlanner();

  it('reports batch job count and extra issue when no project images exist', () => {
    expect(planner.batchJobCount(batchGraph, [1, 2])).toBe(2);
    const issues = planner.runnableIssues(batchGraph, []);
    expect(issues.some((issue) => issue.message.includes('Import an image'))).toBe(true);
  });

  it('counts pipeline nodes including image inputs', () => {
    expect(planner.countPipelineNodes(batchGraph)).toBe(2);
  });
});
