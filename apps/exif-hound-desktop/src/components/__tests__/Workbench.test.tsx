import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Workbench from '../Workbench';
import { invoke } from '@tauri-apps/api/core';
import type { ProjectStore } from 'investigation-archive';
import { serializeWorkflow, type WorkflowGraph } from 'workbench-workflow';
import type { ImageData } from '../../types';

jest.mock('@tauri-apps/api/core', () => ({ invoke: jest.fn().mockResolvedValue([]) }));

const graph: WorkflowGraph = { formatVersion: 1, name: 'Starter', nodes: [], edges: [] };
const storeMocks = {
  listWorkflows: jest.fn().mockResolvedValue([{ id: 'workflow-1', name: graph.name, graphJson: serializeWorkflow(graph), updatedAt: new Date() }]),
  saveWorkflow: jest.fn().mockResolvedValue(undefined),
  appendWorkflowOcrResult: jest.fn().mockResolvedValue(undefined),
  listWorkflowRuns: jest.fn().mockResolvedValue([]),
  createWorkflowRun: jest.fn(),
  updateWorkflowRun: jest.fn(),
  listWorkflowOcrResults: jest.fn().mockResolvedValue([]),
};
const store = storeMocks as unknown as ProjectStore;

describe('Workbench workflow editor', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('shows the categorized node palette and selected workflow', async () => {
    render(<Workbench images={[]} store={store} recognizeImage={jest.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Workbench' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inputs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Transforms' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Outputs' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Project workflow' })).toHaveValue('workflow-1');
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeDisabled();
    expect(screen.getByText('Add an OCR node to the workflow.')).toBeInTheDocument();
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
      return { text: 'OSINT evidence', confidence: 96 };
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
