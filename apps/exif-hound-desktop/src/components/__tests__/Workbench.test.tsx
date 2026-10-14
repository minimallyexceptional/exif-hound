import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Workbench from '../Workbench';
import { invoke } from '@tauri-apps/api/core';
import type { ProjectStore } from 'exif-hound-core';
import { serializeWorkflow, type WorkflowGraph } from 'exif-hound-core';
import type { ImageData } from '../../types';
import { __setPreprocessImageForTests, preprocessImage } from 'exif-hound-core';
import { notify } from '../../feedback/notify';
import { NodeFrame, type WorkbenchFlowData } from '../workbench/NodeFrame';
import { ReactFlowProvider } from '@xyflow/react';

jest.mock('../../feedback/notify', () => ({
  notify: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    action: jest.fn(),
    dismiss: jest.fn(),
  },
  UPDATE_TOAST_IDS: {},
}));

import { ImageProvenanceAnalyzer, type ImageProvenanceResult, type VisualIdentifierResult } from 'exif-hound-core';

const mockPreprocessImage: typeof preprocessImage = jest.fn(async (imageId, imageName, sourceBytes) => ({
  imageId, imageName, sourceBytes, processedBytes: new Uint8Array([4, 5, 6]),
  manifest: { profile: 'ocr-default-v1', sourceWidth: 64, sourceHeight: 48, processedWidth: 128, processedHeight: 96, processedToSource: { a: 0.5, b: 0, c: 0, d: 0.5, e: 4, f: 2 } },
})) as unknown as typeof preprocessImage;

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
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    __setPreprocessImageForTests(mockPreprocessImage);
    storeMocks.listWorkflows.mockResolvedValue([{
      id: 'workflow-1',
      name: graph.name,
      graphJson: serializeWorkflow(graph),
      updatedAt: new Date(),
    }]);
  });

  afterEach(() => {
    __setPreprocessImageForTests(null);
  });

  it('asks the user to open an investigation when no project store is bound', () => {
    render(<Workbench images={[]} store={null} recognizeImage={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'Workbench' })).toBeInTheDocument();
    expect(screen.getByText('Open an investigation first')).toBeInTheDocument();
    expect(screen.queryByText('Loading project workflow…')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Inputs' })).not.toBeInTheDocument();
  });

  it('shows the categorized node palette and selected workflow', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Workbench' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Inputs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Transforms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Outputs' })).toBeInTheDocument();
    const workflowSelect = await screen.findByRole('combobox', { name: 'Project workflow' });
    await waitFor(() => expect(workflowSelect).toHaveAttribute('data-value', 'workflow-1'));
    expect(workflowSelect).toHaveTextContent('Starter');
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeDisabled();
    expect(screen.getByText('Add an analysis transform to the workflow.')).toBeInTheDocument();
    expect(screen.getByText('Start with an image')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add All images node' })).toBeInTheDocument();
  });

  it('collapses the nodes and inspector rails independently', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Inputs' })).toBeInTheDocument();
    expect(screen.getByText('Select a node on the canvas to view its settings or output.')).toBeInTheDocument();

    const nodesToggle = screen.getByTestId('workbench-nodes-toggle');
    expect(nodesToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(nodesToggle);
    expect(screen.queryByRole('heading', { name: 'Inputs' })).not.toBeInTheDocument();
    expect(nodesToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Select a node on the canvas to view its settings or output.')).toBeInTheDocument();

    const inspectorToggle = screen.getByTestId('workbench-inspector-toggle');
    expect(inspectorToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(inspectorToggle);
    expect(screen.queryByText('Select a node on the canvas to view its settings or output.')).not.toBeInTheDocument();
    expect(inspectorToggle).toHaveAttribute('aria-expanded', 'false');
    expect(nodesToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(nodesToggle);
    expect(screen.getByRole('heading', { name: 'Inputs' })).toBeInTheDocument();
    expect(nodesToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('Select a node on the canvas to view its settings or output.')).not.toBeInTheDocument();

    fireEvent.click(inspectorToggle);
    expect(screen.getByText('Select a node on the canvas to view its settings or output.')).toBeInTheDocument();
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

  it('exposes image bypass and data handles on transform nodes', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add OCR node' }));
    const ocr = await screen.findByTestId('flow-node-ocr');
    expect(ocr.className).toContain('w-[320px]');
    expect(ocr.querySelectorAll('[data-port-type="image"]')).toHaveLength(2);
    expect(ocr.querySelector('[data-port-type="text"]')).toHaveClass('!h-[18px]', '!w-[18px]');
    expect(within(ocr).getAllByText('Image')).toHaveLength(2);
    expect(within(ocr).getByText('Text')).toBeInTheDocument();
    expect(ocr).not.toHaveTextContent('Data');
    expect(ocr).not.toHaveTextContent('Extract text');
    expect(ocr).not.toHaveTextContent('Pass the image onward');
    fireEvent.click(screen.getByRole('button', { name: 'Add Image Provenance node' }));
    expect(within(screen.getByTestId('flow-node-provenance')).getByText('Evidence')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Text & Identifiers node' }));
    expect(within(screen.getByTestId('flow-node-visual-identifiers')).getByText('Evidence')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Text output node' }));
    expect(within(screen.getByTestId('flow-node-text')).getByText('Text')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Evidence Report node' }));
    expect(within(screen.getByTestId('flow-node-evidence')).getByText('Evidence')).toBeInTheDocument();
  });

  it('adds an image node and exposes project image settings in the inspector', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add Image node' }));
    expect(await screen.findByLabelText('Project image')).toBeInTheDocument();
  });

  it('normalizes legacy Tesseract workflows and does not expose a provider selector', async () => {
    const legacyGraph = {
      ...graph,
      nodes: [{ id: 'legacy-ocr', type: 'ocr' as const, position: { x: 50, y: 60 }, settings: { language: 'eng', provider: 'tesseract' } }],
    };
    storeMocks.listWorkflows.mockResolvedValue([{ id: 'workflow-1', name: graph.name, graphJson: JSON.stringify(legacyGraph), updatedAt: new Date() }]);
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByTestId('flow-node-ocr'));
    expect(screen.queryByRole('combobox', { name: 'OCR provider' })).not.toBeInTheDocument();
    await waitFor(() => expect(storeMocks.saveWorkflow).toHaveBeenCalled());
    const saveCalls = storeMocks.saveWorkflow.mock.calls;
    const savedGraph = JSON.parse(saveCalls[saveCalls.length - 1]?.[0].graphJson ?? '{}');
    expect(savedGraph.nodes[0].settings).toEqual({ language: 'eng' });
  });

  it('adds forensic transforms and exposes explicit local detection settings', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    await screen.findByRole('combobox', { name: 'Project workflow' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add Text & Identifiers node' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Add Text & Identifiers node' }));

    expect(await screen.findByTestId('flow-node-visual-identifiers')).toBeInTheDocument();
    expect(screen.getByLabelText('Email addresses')).toBeChecked();
    expect(screen.getByLabelText('License plates')).toBeChecked();
    expect(screen.queryByLabelText('License-plate profile')).not.toBeInTheDocument();
    expect(screen.getByText(/pattern candidates with source coordinates/)).toBeInTheDocument();
  });

  it('offers a separate saved workflows tab', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('tab', { name: 'Saved workflows' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Saved workflows' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('prompts for a name and saves a machine-wide JSON workflow', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save reusable workflow' }));
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
      file: { name: 'poster.png', type: 'image/png', size: 10, lastModified: 0, arrayBuffer: async () => new ArrayBuffer(10) }, exif: {},
    } as ImageData;
    storeMocks.listWorkflows.mockResolvedValue([{ id: 'workflow-1', name: runGraph.name, graphJson: serializeWorkflow(runGraph), updatedAt: new Date() }]);
    const recognize = jest.fn(async (_image: Blob, _language: string, onProgress: (progress: number, status?: string) => void) => {
      onProgress(0.5, 'Recognizing text');
      return { text: 'OSINT evidence', confidence: 96, words: [{ text: 'OSINT', confidence: 98, boundingBox: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 } }], provider: 'paddle' as const, engineVersion: 'PP-OCRv6_small' };
    });
    render(<Workbench images={[image]} store={store} recognizeImage={recognize} />);
    const runButton = await screen.findByRole('button', { name: 'Run Workflow' });
    await waitFor(() => expect(runButton).toBeEnabled());
    fireEvent.click(runButton);
    await waitFor(() => expect(storeMocks.appendWorkflowOcrResult).toHaveBeenCalledWith(expect.objectContaining({
      imageId: 12, imageName: 'poster.png', text: 'OSINT evidence', workflowId: 'workflow-1', nodeId: 'ocr-node',
      words: [expect.objectContaining({ text: 'OSINT', boundingBox: expect.objectContaining({ x: 0.3125, y: 0.2916666666666667 }) })], provider: 'paddle', engineVersion: 'PP-OCRv6_small',
    })));
    expect(storeMocks.appendWorkflowOcrResult).toHaveBeenCalledWith(expect.objectContaining({ preprocessingManifest: expect.objectContaining({ profile: 'ocr-default-v1' }), provider: 'paddle', engineVersion: 'PP-OCRv6_small' }));
    expect(recognize).toHaveBeenCalledWith(expect.objectContaining({ type: 'image/png' }), 'eng', expect.any(Function));
    await expect(recognize.mock.calls[0][0].arrayBuffer()).resolves.toEqual(new Uint8Array([4, 5, 6]).buffer);
    expect(storeMocks.createWorkflowRun).toHaveBeenCalled();
    expect(storeMocks.updateWorkflowRun).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
    expect(notify.success).toHaveBeenCalledWith('Workflow finished.');
  });

  it('announces Image-node preprocessing progress with an accessible progress bar', () => {
    const data: WorkbenchFlowData = { settings: {}, state: 'running', progress: 0.52, status: 'Measuring image quality' };
    const props = {
      id: 'image-node', data, selected: false, type: 'image', isConnectable: true,
      positionAbsoluteX: 0, positionAbsoluteY: 0, dragging: false, zIndex: 1,
      width: 250, height: 200, dragHandle: null, sourcePosition: null, targetPosition: null,
    } as unknown as React.ComponentProps<typeof NodeFrame>;
    render(<ReactFlowProvider><NodeFrame {...props} input="image" output="image" /></ReactFlowProvider>);
    const progress = screen.getByRole('progressbar', { name: 'Image progress' });
    expect(progress).toHaveAttribute('aria-valuenow', '52');
    expect(screen.getByText('Measuring image quality').parentElement?.parentElement).toHaveAttribute('aria-live', 'polite');
  });

  it('wraps long node failure messages instead of overflowing the card', () => {
    const data: WorkbenchFlowData = {
      settings: {},
      state: 'failed',
      status: 'The selected project image bytes are unavailable because the file was removed from this investigation.',
    };
    const props = {
      id: 'ocr-node', data, selected: false, type: 'ocr', isConnectable: true,
      positionAbsoluteX: 0, positionAbsoluteY: 0, dragging: false, zIndex: 1,
      width: 250, height: 200, dragHandle: null, sourcePosition: null, targetPosition: null,
    } as unknown as React.ComponentProps<typeof NodeFrame>;
    render(<ReactFlowProvider><NodeFrame {...props} type="ocr" input="image" output="text" /></ReactFlowProvider>);
    const message = screen.getByText(/file was removed from this investigation/);
    expect(message).toHaveClass('break-words');
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
    const identifierResult: VisualIdentifierResult = {
      schemaVersion: 1, toolVersion: '1.0.0', imageId: 12, imageName: 'poster.png', text: 'evidence', confidence: 90,
      words: [{ text: 'evidence', confidence: 90, boundingBox: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 } }],
      candidates: [{ family: 'email', value: 'x@example.org', confidence: 90, sourceWords: [0], boundingBox: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 } }],
    };
    const analyze = jest.spyOn(ImageProvenanceAnalyzer.prototype, 'analyze').mockResolvedValue(provenanceResult);
    const recognize = jest.fn(async (_image: Blob, _language: string, onProgress: (progress: number, status?: string) => void) => {
      onProgress(1, 'PaddleOCR recognition complete');
      return {
        text: 'x@example.org', confidence: 90,
        words: [{ text: 'x@example.org', confidence: 90, boundingBox: { x: 0.25, y: 0.25, width: 0.25, height: 0.25 } }],
        provider: 'paddle' as const, engineVersion: 'PP-OCRv6_small',
      };
    });
    storeMocks.listWorkflows.mockResolvedValue([{ id: 'workflow-1', name: runGraph.name, graphJson: serializeWorkflow(runGraph), updatedAt: new Date() }]);
    render(<Workbench images={[image]} store={store} recognizeImage={recognize} />);

    const runButton = await screen.findByRole('button', { name: 'Run Workflow' });
    await waitFor(() => expect(runButton).toBeEnabled());
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(storeMocks.appendWorkflowProvenanceResult).toHaveBeenCalledWith(expect.objectContaining({
        imageId: 12, result: provenanceResult, resultStatus: 'success', nodeId: 'provenance',
      }));
      expect(storeMocks.appendWorkflowIdentifierResult).toHaveBeenCalledWith(expect.objectContaining({
        imageId: 12, resultStatus: 'success', nodeId: 'identifiers',
      }));
    });
    expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
    expect(analyze).toHaveBeenCalledWith(expect.objectContaining({ bytes: new Uint8Array([1, 2, 3]) }));
    expect(recognize).toHaveBeenCalledWith(expect.objectContaining({ type: 'image/png' }), 'eng', expect.any(Function));
    expect(storeMocks.appendWorkflowProvenanceResult).toHaveBeenCalledWith(expect.objectContaining({ preprocessingManifest: expect.objectContaining({ profile: 'ocr-default-v1' }) }));
    expect(storeMocks.appendWorkflowIdentifierResult).toHaveBeenCalledWith(expect.objectContaining({
      preprocessingManifest: expect.objectContaining({ profile: 'ocr-default-v1' }),
      result: expect.objectContaining({
        words: [expect.objectContaining({ boundingBox: expect.objectContaining({ x: 0.3125, y: 0.2916666666666667, width: expect.closeTo(0.25, 6), height: expect.closeTo(0.25, 6) }) })],
        candidates: expect.arrayContaining([expect.objectContaining({ family: 'email', boundingBox: expect.objectContaining({ x: 0.3125, y: 0.2916666666666667, width: expect.closeTo(0.25, 6), height: expect.closeTo(0.25, 6) }) })]),
      }),
    }));
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
    expect(screen.getByText('x@example.org')).toBeInTheDocument();
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
    storeMocks.listWorkflows.mockResolvedValue([{ id: 'workflow-1', name: runGraph.name, graphJson: serializeWorkflow(runGraph), updatedAt: new Date() }]);
    render(<Workbench images={[image]} store={store} recognizeImage={jest.fn()} />);

    const runButton = await screen.findByRole('button', { name: 'Run Workflow' });
    await waitFor(() => expect(runButton).toBeEnabled());
    fireEvent.click(runButton);

    await waitFor(() => expect(storeMocks.appendWorkflowProvenanceResult).toHaveBeenCalledWith(expect.objectContaining({
      imageId: 12, resultStatus: 'failed', error: 'Malformed local image data', workflowId: 'workflow-1', nodeId: 'provenance',
    })));
    expect(await screen.findAllByText('Malformed local image data')).toHaveLength(1);
    expect(notify.error).toHaveBeenCalledWith('Malformed local image data');
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
    storeMocks.listWorkflows.mockResolvedValue([{ id: 'workflow-1', name: outputGraph.name, graphJson: serializeWorkflow(outputGraph), updatedAt: new Date() }]);
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
    expect(notify.success).toHaveBeenCalledWith('Evidence value copied to clipboard.');
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
    storeMocks.listWorkflows.mockResolvedValue([{ id: 'workflow-1', name: outputGraph.name, graphJson: serializeWorkflow(outputGraph), updatedAt: new Date() }]);
    storeMocks.listWorkflowOcrResults.mockResolvedValueOnce([result]);
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    fireEvent.click(await screen.findByTestId('flow-node-text'));
    expect(await screen.findByText('OSINT evidence')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy extracted text from poster.png' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('OSINT evidence'));
    expect(notify.success).toHaveBeenCalledWith('Text copied to clipboard.');
  });

  it('runs batch workflows across all project images from an All images input', async () => {
    const batchGraph: WorkflowGraph = {
      formatVersion: 1,
      name: 'Batch OCR',
      nodes: [
        { id: 'all', type: 'all-images', position: { x: 0, y: 0 }, settings: { active: true } },
        { id: 'ocr-node', type: 'ocr', position: { x: 200, y: 0 }, settings: { language: 'eng' } },
        { id: 'text-node', type: 'text', position: { x: 400, y: 0 }, settings: {} },
      ],
      edges: [
        { id: 'in', source: 'all', sourcePort: 'image', target: 'ocr-node', targetPort: 'image' },
        { id: 'out', source: 'ocr-node', sourcePort: 'text', target: 'text-node', targetPort: 'text' },
      ],
    };
    const mkImage = (projectImageId: number, name: string) => ({
      id: `image-${projectImageId}`,
      projectImageId,
      url: `blob:${name}`,
      file: { name, type: 'image/png', size: 10, lastModified: 0, arrayBuffer: async () => new ArrayBuffer(10) },
      exif: {},
    }) as ImageData;
    storeMocks.listWorkflows.mockResolvedValue([{
      id: 'workflow-1',
      name: batchGraph.name,
      graphJson: serializeWorkflow(batchGraph),
      updatedAt: new Date(),
    }]);
    const recognize = jest.fn(async () => ({
      text: 'batch',
      confidence: 90,
      words: [],
      provider: 'paddle' as const,
      engineVersion: 'PP-OCRv6_small',
    }));
    render(<Workbench images={[mkImage(10, 'a.png'), mkImage(11, 'b.png')]} store={store} recognizeImage={recognize} />);
    const batchButton = await screen.findByRole('button', { name: 'Run on 2 images' });
    await waitFor(() => expect(batchButton).toBeEnabled());
    fireEvent.click(batchButton);
    await waitFor(() => expect(storeMocks.appendWorkflowOcrResult).toHaveBeenCalledTimes(2));
    expect(storeMocks.appendWorkflowOcrResult).toHaveBeenCalledWith(expect.objectContaining({ imageId: 10, imageName: 'a.png' }));
    expect(storeMocks.appendWorkflowOcrResult).toHaveBeenCalledWith(expect.objectContaining({ imageId: 11, imageName: 'b.png' }));
    expect(notify.success).toHaveBeenCalledWith('Batch workflow finished (2 images).');
  });
});
