import { loadProjectEvidenceData } from '../loadProjectEvidence';
import type { ProjectStore } from 'investigation-archive';

describe('loadProjectEvidenceData', () => {
  it('uses listProject* APIs when present', async () => {
    const store = {
      listProjectOcrResults: jest.fn().mockResolvedValue([{ imageId: 1, text: 'a', processedAt: new Date() }]),
      listProjectIdentifierResults: jest.fn().mockResolvedValue([]),
      listProjectProvenanceResults: jest.fn().mockResolvedValue([]),
    } as unknown as ProjectStore;
    const data = await loadProjectEvidenceData(store);
    expect(data.ocr).toHaveLength(1);
    expect(store.listProjectOcrResults).toHaveBeenCalled();
  });

  it('falls back to workflow-scoped queries when listProject* is missing', async () => {
    const store = {
      listWorkflows: jest.fn().mockResolvedValue([{
        id: 'wf-1',
        name: 'Test',
        graphJson: JSON.stringify({
          formatVersion: 1,
          name: 'Test',
          nodes: [
            { id: 'ocr-1', type: 'ocr', position: { x: 0, y: 0 }, settings: {} },
            { id: 'ids-1', type: 'visual-identifiers', position: { x: 1, y: 0 }, settings: {} },
          ],
          edges: [],
        }),
        updatedAt: new Date(),
      }]),
      listWorkflowOcrResults: jest.fn().mockResolvedValue([{
        imageId: 2, imageName: 'x.png', text: 'hello', confidence: 90, processedAt: new Date(),
      }]),
      listWorkflowIdentifierResults: jest.fn().mockResolvedValue([]),
      listWorkflowProvenanceResults: jest.fn().mockResolvedValue([]),
      listImages: jest.fn().mockResolvedValue([]),
      getOcrResult: jest.fn(),
    } as unknown as ProjectStore;
    const data = await loadProjectEvidenceData(store);
    expect(store.listWorkflowOcrResults).toHaveBeenCalledWith('wf-1', 'ocr-1');
    expect(data.ocr[0].text).toBe('hello');
  });

  it('legacy path skips invalid workflow graphs and loads provenance and identifiers', async () => {
    const store = {
      listWorkflows: jest.fn().mockResolvedValue([
        { id: 'bad', name: 'Bad', graphJson: '{not-json', updatedAt: new Date() },
        {
          id: 'wf-2',
          name: 'Forensics',
          graphJson: JSON.stringify({
            formatVersion: 1,
            name: 'Forensics',
            nodes: [
              { id: 'prov-1', type: 'provenance', position: { x: 0, y: 0 }, settings: {} },
              { id: 'ids-1', type: 'visual-identifiers', position: { x: 1, y: 0 }, settings: {} },
            ],
            edges: [],
          }),
          updatedAt: new Date(),
        },
      ]),
      listWorkflowOcrResults: jest.fn(),
      listWorkflowProvenanceResults: jest.fn().mockResolvedValue([{ imageId: 1, resultStatus: 'success' }]),
      listWorkflowIdentifierResults: jest.fn().mockResolvedValue([{ imageId: 2, resultStatus: 'success' }]),
      listImages: jest.fn().mockResolvedValue([]),
      getOcrResult: jest.fn(),
    } as unknown as ProjectStore;
    const data = await loadProjectEvidenceData(store);
    expect(store.listWorkflowProvenanceResults).toHaveBeenCalledWith('wf-2', 'prov-1');
    expect(store.listWorkflowIdentifierResults).toHaveBeenCalledWith('wf-2', 'ids-1');
    expect(data.provenance).toHaveLength(1);
    expect(data.identifiers).toHaveLength(1);
    expect(store.listWorkflowOcrResults).not.toHaveBeenCalled();
  });

  it('legacy path merges standalone image OCR results', async () => {
    const processedAt = new Date('2026-03-01T00:00:00Z');
    const store = {
      listWorkflows: jest.fn().mockResolvedValue([]),
      listWorkflowOcrResults: jest.fn(),
      listWorkflowProvenanceResults: jest.fn(),
      listWorkflowIdentifierResults: jest.fn(),
      listImages: jest.fn().mockResolvedValue([
        { id: 7, hasImage: true },
        { id: 8, hasImage: false },
      ]),
      getOcrResult: jest.fn(async (id: number) => (id === 7
        ? { imageId: 7, text: 'from-image', processedAt, confidence: 50 }
        : null)),
    } as unknown as ProjectStore;
    const data = await loadProjectEvidenceData(store);
    expect(data.ocr).toHaveLength(1);
    expect(data.ocr[0].text).toBe('from-image');
  });

  it('legacy path sorts OCR rows newest first and dedupes by key', async () => {
    const older = new Date('2026-01-01T00:00:00Z');
    const newer = new Date('2026-02-01T00:00:00Z');
    const store = {
      listWorkflows: jest.fn().mockResolvedValue([{
        id: 'wf',
        name: 'OCR',
        graphJson: JSON.stringify({
          formatVersion: 1,
          name: 'OCR',
          nodes: [{ id: 'ocr-1', type: 'ocr', position: { x: 0, y: 0 }, settings: {} }],
          edges: [],
        }),
        updatedAt: new Date(),
      }]),
      listWorkflowOcrResults: jest.fn().mockResolvedValue([
        { id: 1, imageId: 3, text: 'older', processedAt: older, workflowRunId: 'a' },
        { id: 2, imageId: 3, text: 'newer', processedAt: newer, workflowRunId: 'b' },
      ]),
      listWorkflowProvenanceResults: jest.fn().mockResolvedValue([]),
      listWorkflowIdentifierResults: jest.fn().mockResolvedValue([]),
      listImages: jest.fn().mockResolvedValue([]),
      getOcrResult: jest.fn(),
    } as unknown as ProjectStore;
    const data = await loadProjectEvidenceData(store);
    expect(data.ocr.map((row) => row.text)).toEqual(['newer', 'older']);
  });
});
