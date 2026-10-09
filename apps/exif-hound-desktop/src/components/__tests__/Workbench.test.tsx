import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Workbench from '../Workbench';
import { invoke } from '@tauri-apps/api/core';
import type { ProjectStore } from 'investigation-archive';
import { serializeWorkflow, type WorkflowGraph } from 'workbench-workflow';
import type { ImageData } from '../../types';
import { ImageProvenanceAnalyzer, VisualIdentifierDetector, type ImageProvenanceResult, type VisualIdentifierResult } from 'image-forensics-middleware';

jest.mock('@tauri-apps/api/core', () => ({ invoke: jest.fn().mockResolvedValue([]) }));

const graph: WorkflowGraph = { formatVersion: 1, name: 'Starter', nodes: [], edges: [] };
const storeMocks = {
  listWorkflows: jest.fn().mockResolvedValue([{ id: 'workflow-1', name: graph.name, graphJson: serializeWorkflow(graph), updatedAt: new Date() }]),
  saveWorkflow: jest.fn().mockResolvedValue(undefined),
  appendWorkflowOcrResult: jest.fn().mockResolvedValue(undefined),
  appendWorkflowProvenanceResult: jest.fn().mockResolvedValue(undefined),
  appendWorkflowIdentifierResult: jest.fn().mockResolvedValue(undefined),
  listWorkflowRuns: jest.fn().mockResolvedValue([]),
  createWorkflowRun: jest.fn(),
  updateWorkflowRun: jest.fn(),
  listWorkflowOcrResults: jest.fn().mockResolvedValue([]),
  listWorkflowProvenanceResults: jest.fn().mockResolvedValue([]),
  listWorkflowIdentifierResults: jest.fn().mockResolvedValue([]),
};
const store = storeMocks as unknown as ProjectStore;

describe('Workbench workflow editor', () => {
  beforeEach(() => { jest.restoreAllMocks(); jest.clearAllMocks(); });

  it('shows the categorized node palette and selected workflow', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Workbench' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inputs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Transforms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Outputs' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Project workflow' })).toHaveValue('workflow-1');
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeDisabled();
    expect(screen.getByText('Add an analysis transform to the workflow.')).toBeInTheDocument();
    expect(screen.getByText('Start with an image')).toBeInTheDocument();
  });

  it('exposes keyboard help and arrow-key navigation for the workflow tabs', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    const saveButton = await screen.findByRole('button', { name: 'Save reusable workflow' });
    fireEvent.focus(saveButton);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Save a reusable copy of this workflow on this machine');
    const editorTab = screen.getByRole('tab', { name: 'Editor' });
    fireEvent.keyDown(editorTab, { key: 'ArrowRight' });
    expect(await screen.findByRole('tab', { name: 'Saved workflows' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'workbench-library-panel');
  });

  it('adds an image node and exposes project image settings in the inspector', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add Image node' }));
    expect(await screen.findByLabelText('Project image')).toBeInTheDocument();
  });

  it('adds forensic transforms and exposes explicit local detection settings', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add Text & Identifiers node' }));

    expect(await screen.findByTestId('flow-node-visual-identifiers')).toBeInTheDocument();
    expect(screen.getByLabelText('Email addresses')).toBeChecked();
    expect(screen.getByLabelText('License-plate profile')).toHaveValue('');
    expect(screen.getByText(/pattern candidates with source coordinates/)).toBeInTheDocument();
  });

  it('offers a separate saved workflows tab', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Saved workflows' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Saved workflows' })).toBeInTheDocument());
  });

  it('prompts for a name and saves a machine-wide JSON workflow', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByTitle('Save reusable workflow'));
    fireEvent.change(screen.getByLabelText('Workflow name'), { target: { value: 'Field notes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save workflow' }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith('save_workflow_template', expect.objectContaining({ name: 'Field notes' })));
    const payload = (invoke as jest.Mock).mock.calls.find((call) => call[0] === 'save_workflow_template')?.[1];
    expect(JSON.parse(payload.content)).toMatchObject({ formatVersion: 1, name: 'Field notes' });
  });

  it('opens a saved graph into the project and clears its old image selection', async () => {
    const templateGraph: WorkflowGraph = {
      formatVersion: 1, name: 'Reusable',
      nodes: [{ id: 'image', type: 'image', position: { x: 1, y: 2 }, settings: { imageId: 999 } }],
      edges: [],
    };
    (invoke as jest.Mock).mockResolvedValueOnce([{ name: 'Reusable', content: serializeWorkflow(templateGraph) }]);
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Saved workflows' }));
    const card = await screen.findByText('Reusable');
    fireEvent.click(card.closest('button')!);
    await waitFor(() => expect(storeMocks.saveWorkflow).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Reusable', graphJson: expect.stringContaining('"imageId": null'),
    })));
  });

  it('runs connected image and OCR nodes and appends the result to project history', async () => {
    const runGraph: WorkflowGraph = {
      formatVersion: 1, name: 'OCR pipeline',
      nodes: [
        { id: 'image-node', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 12 } },
        { id: 'ocr-node', type: 'ocr', position: { x: 200, y: 0 }, settings: { language: 'eng' } },
        { id: 'text-node', type: 'text', position: { x: 400, y: 0 }, settings: {} },
      ],
      edges: [
        { id: 'image-ocr', source: 'image-node', sourcePort: 'image', target: 'ocr-node', targetPort: 'image' },
        { id: 'ocr-text', source: 'ocr-node', sourcePort: 'text', target: 'text-node', targetPort: 'text' },
      ],
    };
    const image = {
      id: 'image-a', projectImageId: 12, url: 'blob:image',
      file: { name: 'poster.png', type: 'image/png', size: 10, lastModified: 0 }, exif: {},
    } as ImageData;
    storeMocks.listWorkflows.mockResolvedValueOnce([{ id: 'workflow-1', name: runGraph.name, graphJson: serializeWorkflow(runGraph), updatedAt: new Date() }]);
    const recognize = jest.fn(async (_image: ImageData, _language: string, onProgress: (progress: number, status?: string) => void) => {
      onProgress(0.5, 'Recognizing text');
      return { text: 'OSINT evidence', confidence: 96, words: [] };
    });
    render(<Workbench images={[image]} store={store} recognizeImage={recognize} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run Workflow' }));
    await waitFor(() => expect(storeMocks.appendWorkflowOcrResult).toHaveBeenCalledWith(expect.objectContaining({
      imageId: 12, imageName: 'poster.png', text: 'OSINT evidence', workflowId: 'workflow-1', nodeId: 'ocr-node',
    })));
    expect(recognize).toHaveBeenCalledWith(image, 'eng', expect.any(Function));
    expect(storeMocks.createWorkflowRun).toHaveBeenCalled();
    expect(storeMocks.updateWorkflowRun).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
  });

  it('runs forensic transforms through middleware adapters and persists separate tool results', async () => {
    const runGraph: WorkflowGraph = {
      formatVersion: 1, name: 'Local forensic review',
      nodes: [
        { id: 'image-p', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 12 } },
        { id: 'provenance', type: 'provenance', position: { x: 200, y: 0 }, settings: {} },
        { id: 'image-v', type: 'image', position: { x: 0, y: 200 }, settings: { imageId: 12 } },
        { id: 'identifiers', type: 'visual-identifiers', position: { x: 200, y: 200 }, settings: { language: 'eng', enabledFamilies: 'email,url-domain' } },
        { id: 'report', type: 'evidence', position: { x: 500, y: 100 }, settings: {} },
      ],
      edges: [
        { id: 'p-in', source: 'image-p', sourcePort: 'image', target: 'provenance', targetPort: 'image' },
        { id: 'p-out', source: 'provenance', sourcePort: 'evidence', target: 'report', targetPort: 'evidence' },
        { id: 'v-in', source: 'image-v', sourcePort: 'image', target: 'identifiers', targetPort: 'image' },
        { id: 'v-out', source: 'identifiers', sourcePort: 'evidence', target: 'report', targetPort: 'evidence' },
      ],
    };
    const bytes = new Uint8Array([1, 2, 3]);
    const image = {
      id: 'image-a', projectImageId: 12, url: 'blob:image',
      file: { name: 'poster.png', type: 'image/png', size: 3, lastModified: 0, arrayBuffer: async () => bytes.buffer }, exif: {},
    } as unknown as ImageData;
    const provenanceResult: ImageProvenanceResult = { schemaVersion: 1, toolVersion: '1.0.0', imageId: 12, imageName: 'poster.png', facts: { format: 'unknown', quantizationTableFingerprints: [], timestamps: {}, metadataFieldCount: 0 }, indicators: [] };
    const identifierResult: VisualIdentifierResult = { schemaVersion: 1, toolVersion: '1.0.0', imageId: 12, imageName: 'poster.png', text: '', confidence: 0, words: [], candidates: [] };
    jest.spyOn(ImageProvenanceAnalyzer.prototype, 'analyze').mockResolvedValue(provenanceResult);
    jest.spyOn(VisualIdentifierDetector.prototype, 'detect').mockResolvedValue(identifierResult);
    storeMocks.listWorkflows.mockResolvedValueOnce([{ id: 'workflow-1', name: runGraph.name, graphJson: serializeWorkflow(runGraph), updatedAt: new Date() }]);
    render(<Workbench images={[image]} store={store} recognizeImage={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Run Workflow' }));

    await waitFor(() => {
      expect(storeMocks.appendWorkflowProvenanceResult).toHaveBeenCalledWith(expect.objectContaining({
        imageId: 12, result: provenanceResult, resultStatus: 'success', nodeId: 'provenance',
      }));
      expect(storeMocks.appendWorkflowIdentifierResult).toHaveBeenCalledWith(expect.objectContaining({
        imageId: 12, result: identifierResult, resultStatus: 'success', nodeId: 'identifiers',
      }));
    });
    storeMocks.listWorkflowProvenanceResults.mockResolvedValueOnce([{
      id: 1, imageId: 12, imageName: 'poster.png', result: provenanceResult, resultStatus: 'success',
      workflowId: 'workflow-1', workflowRunId: 'run-1', nodeId: 'provenance', toolVersion: '1.0.0',
      startedAt: new Date(), finishedAt: new Date(),
    }]);
    storeMocks.listWorkflowIdentifierResults.mockResolvedValueOnce([{
      id: 2, imageId: 12, imageName: 'poster.png', result: identifierResult, resultStatus: 'success',
      workflowId: 'workflow-1', workflowRunId: 'run-1', nodeId: 'identifiers', toolVersion: '1.0.0',
      startedAt: new Date(), finishedAt: new Date(),
    }]);
    fireEvent.click(await screen.findByTestId('flow-node-evidence'));
    expect(await screen.findByText('No provenance indicators were found in this run.')).toBeInTheDocument();
    expect(screen.getByText('No identifier candidates matched the enabled patterns.')).toBeInTheDocument();
    expect(storeMocks.listWorkflowProvenanceResults).toHaveBeenCalledWith('workflow-1', 'provenance');
    expect(storeMocks.listWorkflowIdentifierResults).toHaveBeenCalledWith('workflow-1', 'identifiers');
  });

  it('persists failed forensic steps with run metadata', async () => {
    const runGraph: WorkflowGraph = {
      formatVersion: 1, name: 'Failed provenance',
      nodes: [
        { id: 'image', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 12 } },
        { id: 'provenance', type: 'provenance', position: { x: 200, y: 0 }, settings: {} },
        { id: 'report', type: 'evidence', position: { x: 400, y: 0 }, settings: {} },
      ],
      edges: [
        { id: 'image-provenance', source: 'image', sourcePort: 'image', target: 'provenance', targetPort: 'image' },
        { id: 'provenance-report', source: 'provenance', sourcePort: 'evidence', target: 'report', targetPort: 'evidence' },
      ],
    };
    const image = {
      id: 'image-a', projectImageId: 12, url: 'blob:image',
      file: { name: 'poster.png', type: 'image/png', size: 3, lastModified: 0, arrayBuffer: async () => new Uint8Array([1]).buffer }, exif: {},
    } as unknown as ImageData;
    jest.spyOn(ImageProvenanceAnalyzer.prototype, 'analyze').mockRejectedValue(new Error('Malformed local image data'));
    storeMocks.listWorkflows.mockResolvedValueOnce([{ id: 'workflow-1', name: runGraph.name, graphJson: serializeWorkflow(runGraph), updatedAt: new Date() }]);
    render(<Workbench images={[image]} store={store} recognizeImage={jest.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Run Workflow' }));

    await waitFor(() => expect(storeMocks.appendWorkflowProvenanceResult).toHaveBeenCalledWith(expect.objectContaining({
      imageId: 12, resultStatus: 'failed', error: 'Malformed local image data', workflowId: 'workflow-1', nodeId: 'provenance',
    })));
    expect(await screen.findAllByText('Malformed local image data')).toHaveLength(2);
    expect(storeMocks.updateWorkflowRun).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });

  it('copies a saved evidence candidate without rerunning the transform', async () => {
    const outputGraph: WorkflowGraph = {
      formatVersion: 1, name: 'Evidence output',
      nodes: [
        { id: 'image', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 12 } },
        { id: 'identifiers', type: 'visual-identifiers', position: { x: 200, y: 0 }, settings: {} },
        { id: 'report', type: 'evidence', position: { x: 400, y: 0 }, settings: {} },
      ],
      edges: [
        { id: 'image-identifiers', source: 'image', sourcePort: 'image', target: 'identifiers', targetPort: 'image' },
        { id: 'identifiers-report', source: 'identifiers', sourcePort: 'evidence', target: 'report', targetPort: 'evidence' },
      ],
    };
    const result: VisualIdentifierResult = {
      schemaVersion: 1, toolVersion: '1.0.0', imageId: 12, imageName: 'poster.png', text: 'alice@example.org', confidence: 91, words: [],
      candidates: [{ family: 'email', value: 'alice@example.org', confidence: 91, sourceWords: [0], boundingBox: { x: 0.1, y: 0.2, width: 0.4, height: 0.1 } }],
    };
    const analyze = jest.spyOn(ImageProvenanceAnalyzer.prototype, 'analyze');
    storeMocks.listWorkflows.mockResolvedValueOnce([{ id: 'workflow-1', name: outputGraph.name, graphJson: serializeWorkflow(outputGraph), updatedAt: new Date() }]);
    storeMocks.listWorkflowIdentifierResults.mockResolvedValueOnce([{
      id: 3, imageId: 12, imageName: 'poster.png', result, resultStatus: 'success', workflowId: 'workflow-1',
      workflowRunId: 'run-3', nodeId: 'identifiers', toolVersion: '1.0.0', startedAt: new Date(), finishedAt: new Date(),
    }]);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByTestId('flow-node-evidence'));
    fireEvent.click(await screen.findByRole('button', { name: 'Copy candidate' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('alice@example.org'));
    expect(await screen.findByText('Evidence value copied to clipboard.')).toBeInTheDocument();
    expect(analyze).not.toHaveBeenCalled();
  });

  it('inspects saved Text output and copies its extracted value', async () => {
    const outputGraph: WorkflowGraph = {
      formatVersion: 1, name: 'Saved result',
      nodes: [
        { id: 'image-node', type: 'image', position: { x: 0, y: 0 }, settings: { imageId: 12 } },
        { id: 'ocr-node', type: 'ocr', position: { x: 200, y: 0 }, settings: { language: 'eng' } },
        { id: 'text-node', type: 'text', position: { x: 400, y: 0 }, settings: {} },
      ],
      edges: [
        { id: 'image-ocr', source: 'image-node', sourcePort: 'image', target: 'ocr-node', targetPort: 'image' },
        { id: 'ocr-text', source: 'ocr-node', sourcePort: 'text', target: 'text-node', targetPort: 'text' },
      ],
    };
    const result = { id: 1, imageId: 12, imageName: 'poster.png', text: 'OSINT evidence', confidence: 93, resultStatus: 'success' as const, workflowId: 'workflow-1', workflowRunId: 'run-1', nodeId: 'ocr-node', processedAt: new Date() };
    storeMocks.listWorkflows.mockResolvedValueOnce([{ id: 'workflow-1', name: outputGraph.name, graphJson: serializeWorkflow(outputGraph), updatedAt: new Date() }]);
    storeMocks.listWorkflowOcrResults.mockResolvedValueOnce([result]);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByTestId('flow-node-text'));
    expect(await screen.findByText('OSINT evidence')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy extracted text from poster.png' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('OSINT evidence'));
    expect(await screen.findByRole('status')).toHaveTextContent('Text copied to clipboard.');
  });
});
