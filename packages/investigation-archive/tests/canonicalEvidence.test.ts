import {
  foldOcrRows,
  foldToolResultRows,
  mergeIdentifierResults,
  pickCanonicalOcr,
  resolveOcrUpsert,
} from '../src/canonicalEvidence';
import type { OcrResultRecord, WorkflowToolResultRecord } from '../src/format';

const baseOcr = (overrides: Partial<OcrResultRecord>): OcrResultRecord => ({
  imageId: 1,
  text: 'a',
  confidence: 90,
  processedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

describe('canonicalEvidence', () => {
  it('replaces OCR for the same workflow and picks best confidence across workflows', () => {
    const existing = baseOcr({ workflowId: 'wf-a', confidence: 80, text: 'old' });
    const sameWorkflow = baseOcr({ workflowId: 'wf-a', confidence: 70, text: 'new' });
    expect(resolveOcrUpsert(existing, sameWorkflow).text).toBe('new');

    const otherWorkflow = baseOcr({ workflowId: 'wf-b', confidence: 95, text: 'better' });
    expect(resolveOcrUpsert(existing, otherWorkflow).text).toBe('better');
    expect(pickCanonicalOcr(existing, baseOcr({ confidence: 79 }))).toBe(existing);
  });

  it('merges identifier candidates across workflows', () => {
    const now = new Date();
    const left: WorkflowToolResultRecord = {
      imageId: 1, imageName: 'a.jpg', workflowId: 'wf-a', workflowRunId: 'r1', nodeId: 'n1',
      toolVersion: '1', startedAt: now, finishedAt: now, resultStatus: 'success',
      result: { candidates: [{ family: 'email', value: 'A@Example.com', confidence: 80 }] },
    };
    const right: WorkflowToolResultRecord = {
      ...left, workflowId: 'wf-b', workflowRunId: 'r2',
      result: { candidates: [{ family: 'phone-like', value: '555-0100', confidence: 90 }] },
    };
    const merged = mergeIdentifierResults(left, right);
    const candidates = (merged.result as { candidates: unknown[] }).candidates;
    expect(candidates).toHaveLength(2);
  });

  it('folds duplicate OCR rows per image', () => {
    const folded = foldOcrRows([
      baseOcr({ workflowId: 'a', confidence: 50, processedAt: new Date(1) }),
      baseOcr({ workflowId: 'b', confidence: 99, processedAt: new Date(2) }),
      baseOcr({ workflowId: 'a', confidence: 40, processedAt: new Date(3) }),
    ]);
    expect(folded?.confidence).toBe(99);
    expect(folded?.text).toBe('a');
  });

  it('folds provenance rows', () => {
    const now = new Date();
    const row = (workflowId: string, code: string): WorkflowToolResultRecord => ({
      imageId: 1, imageName: 'x.jpg', workflowId, workflowRunId: `${workflowId}-run`, nodeId: 'p',
      toolVersion: '1', startedAt: now, finishedAt: now, resultStatus: 'success',
      result: { indicators: [{ code, message: code }] },
    });
    const folded = foldToolResultRows([row('a', 'A'), row('b', 'B')], 'provenance');
    expect((folded?.result as { indicators: unknown[] }).indicators).toHaveLength(2);
  });
});
