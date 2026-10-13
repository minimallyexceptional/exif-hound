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
});
