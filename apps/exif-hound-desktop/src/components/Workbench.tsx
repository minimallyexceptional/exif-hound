import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge, Background, BackgroundVariant, ConnectionMode, Controls, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type Edge, type Node,
} from '@xyflow/react';
import { ChevronLeft, ChevronRight, Copy, FilePlus2, FolderOpen, Play, Save, Workflow as WorkflowIcon } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { ProjectStore, ProjectWorkflowRecord, OcrResultRecord, WorkflowRunRecord, WorkflowToolResultRecord } from 'investigation-archive';
import { clearProjectImageSelections, createImageNodeHandler, createOcrNodeHandler, createImageProvenanceNodeHandler, createVisualIdentifierNodeHandler, getEvidenceOutputSources, getTextOutputSource, listBatchImageRoots, parseWorkflow, planSerialBatchRuns, serializeWorkflow, transformNodeTypes, normalizeConnection, validateRunnableWorkflow, WorkflowRunner, WorkflowRunQueue, type NodeKind, type OcrNodeOutput, type RunEvent, type WorkflowGraph, type WorkflowNode } from 'workbench-workflow';
import { ImageProvenanceAnalyzer, VisualIdentifierDetector, type CandidateFamily } from 'image-forensics-middleware';
import { mapProcessedBoxToSource, type ImageProcessingManifest } from 'image-processing-middleware';
import type { OcrResult } from 'ocr-middleware';
import type { ImageData } from '../types';
import { Button } from './common/Button';
import { appControlBlockClassName } from './common/formControls';
import { Select } from './common/Select';
import { SidebarRailToggle } from './common/SidebarRailToggle';
import { Tooltip } from './common/Tooltip';
import ImageFlowNode from './workbench/ImageFlowNode';
import AllImagesFlowNode from './workbench/AllImagesFlowNode';
import OcrFlowNode from './workbench/OcrFlowNode';
import ProvenanceFlowNode from './workbench/ProvenanceFlowNode';
import VisualIdentifiersFlowNode from './workbench/VisualIdentifiersFlowNode';
import TextFlowNode from './workbench/TextFlowNode';
import EvidenceFlowNode from './workbench/EvidenceFlowNode';
import type { WorkbenchFlowData } from './workbench/NodeFrame';
import { WorkbenchEligibleImageCountContext } from './workbench/WorkbenchEligibleImageCountContext';
import { preprocessImage } from '../utils/preprocessImage';
import { isFlowConnectionAllowed, portFromHandle, sourceHandleId, targetHandleId } from './workbench/flowHandles';
import { portEdgeStyle } from './workbench/portStyle';
import { notify } from '../feedback';

interface Template { name: string; content: string }
interface Props {
  images: ImageData[];
  store: ProjectStore | null;
  recognizeImage: (image: Blob, language: string, onProgress: (progress: number, status?: string) => void) => Promise<OcrResult>;
}

type CanvasNode = Node<WorkbenchFlowData, NodeKind>;
const nodeTypes = {
  image: ImageFlowNode, 'all-images': AllImagesFlowNode, ocr: OcrFlowNode, provenance: ProvenanceFlowNode,
  'visual-identifiers': VisualIdentifiersFlowNode, text: TextFlowNode, evidence: EvidenceFlowNode,
};
const portDefaults: Record<NodeKind, { title: string; settings: WorkflowNode['settings'] }> = {
  image: { title: 'Image', settings: { imageId: null } },
  'all-images': { title: 'All images', settings: { active: true } },
  ocr: { title: 'OCR', settings: { language: 'eng' } },
  provenance: { title: 'Image Provenance', settings: {} },
  'visual-identifiers': { title: 'Text & Identifiers', settings: { language: 'eng', enabledFamilies: 'email,url-domain,phone-like,coordinate-pair,license-plate-like', licensePlateProfile: 'us-general' } },
  text: { title: 'Text output', settings: {} },
  evidence: { title: 'Evidence Report', settings: {} },
};


const identifierFamilies: Array<{ id: CandidateFamily; title: string }> = [
  { id: 'email', title: 'Email addresses' },
  { id: 'url-domain', title: 'URLs and domains' },
  { id: 'phone-like', title: 'Phone-like numbers' },
  { id: 'coordinate-pair', title: 'Coordinate pairs' },
  { id: 'license-plate-like', title: 'License plates' },
];

const defaultIdentifierFamilies = 'email,url-domain,phone-like,coordinate-pair,license-plate-like';

interface EvidenceEntry { sourceNode: WorkflowNode; record: WorkflowToolResultRecord }
interface EvidencePayload {
  facts?: unknown;
  indicators?: Array<{ code?: string; message?: string; observedValue?: string }>;
  text?: string;
  candidates?: Array<{ family: string; value: string; confidence: number; boundingBox: unknown }>;
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasOcrBoundingBox(value: unknown): value is OcrResult['words'][number] {
  if (!value || typeof value !== 'object') return false;
  const word = value as { text?: unknown; confidence?: unknown; boundingBox?: unknown };
  if (typeof word.text !== 'string' || typeof word.confidence !== 'number' || !word.boundingBox || typeof word.boundingBox !== 'object') return false;
  const box = word.boundingBox as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every(key => typeof box[key] === 'number' && Number.isFinite(box[key]));
}

function formatOcrCoordinates(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Coordinates unavailable';
  const box = value as Record<string, unknown>;
  const values = [box.x, box.y, box.width, box.height];
  if (!values.every(item => typeof item === 'number' && Number.isFinite(item))) return 'Coordinates unavailable';
  const [x, y, width, height] = values as number[];
  return `${x.toFixed(3)}, ${y.toFixed(3)} · ${width.toFixed(3)}×${height.toFixed(3)}`;
}

async function readImageBytes(image: ImageData): Promise<Uint8Array> {
  const file = image.file as unknown as Blob;
  if (typeof file.arrayBuffer !== 'function') throw new Error('The selected project image bytes are unavailable.');
  return new Uint8Array(await file.arrayBuffer());
}

function eligibleProjectImages(images: ImageData[]): ImageData[] {
  return images.filter((image) => image.projectImageId !== undefined && !('hasImage' in image));
}

function toCanvas(graph: WorkflowGraph, images: ImageData[], states: Record<string, WorkbenchFlowData['state']> = {}): { nodes: CanvasNode[]; edges: Edge[] } {
  return {
    nodes: graph.nodes.map((node) => {
      const imageId = node.settings.imageId;
      const image = node.type === 'image' && typeof imageId === 'number'
        ? images.find((item) => item.projectImageId === imageId && !('hasImage' in item))
        : undefined;
      return {
        id: node.id, type: node.type, position: node.position,
        data: { settings: node.settings, image, state: states[node.id] ?? 'idle' },
      } as CanvasNode;
    }),
    edges: graph.edges.map((edge) => ({ id: edge.id, source: edge.source, sourceHandle: sourceHandleId(edge.sourcePort), target: edge.target, targetHandle: targetHandleId(edge.targetPort), animated: false, style: portEdgeStyle(edge.sourcePort) })),
  };
}

function toGraph(id: string, name: string, nodes: CanvasNode[], edges: Edge[]): WorkflowGraph {
  return {
    formatVersion: 1,
    name,
    nodes: nodes.map((node) => ({
      id: node.id, type: node.type as NodeKind, position: { x: node.position.x, y: node.position.y },
      settings: { ...node.data.settings },
    })),
    edges: edges.map((edge) => ({
      id: edge.id, source: edge.source, sourcePort: portFromHandle(edge.sourceHandle),
      target: edge.target, targetPort: portFromHandle(edge.targetHandle),
    })),
  };
}

const WorkbenchContent: React.FC<Props> = ({ images, store, recognizeImage }) => {
  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [projectWorkflows, setProjectWorkflows] = useState<ProjectWorkflowRecord[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [tab, setTab] = useState<'editor' | 'library'>('editor');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [openingTemplate, setOpeningTemplate] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [resultEntries, setResultEntries] = useState<OcrResultRecord[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<EvidenceEntry[]>([]);
  const [runHistory, setRunHistory] = useState<WorkflowRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNodesCollapsed, setIsNodesCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [dialog, setDialog] = useState<'save' | 'new' | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState({ completed: 0, total: 0, current: 0, nodeId: '' });
  const [batchRunProgress, setBatchRunProgress] = useState({ index: 0, total: 0 });
  const [runStates, setRunStates] = useState<Record<string, WorkbenchFlowData['state']>>({});
  const runner = useRef(new WorkflowRunner());
  const batchQueue = useRef(new WorkflowRunQueue());
  const dialogRef = useRef<HTMLDivElement>(null);
  const runProgressRef = useRef({ completed: 0, total: 0, current: 0, nodeId: '' });
  const stepStartedAt = useRef<Record<string, Date>>({});
  const preparedPackets = useRef(new Map<number, Awaited<ReturnType<typeof preprocessImage>>>());
  const provenanceAnalyzer = useRef(new ImageProvenanceAnalyzer());
  const initialized = useRef(false);

  useEffect(() => {
    let active = true;
    if (store && activeWorkflowId) {
      void store.listWorkflowRuns(activeWorkflowId).then((runs) => { if (active) setRunHistory(runs); });
    }
    return () => { active = false; };
  }, [activeWorkflowId, store]);

  useEffect(() => {
    let active = true;
    initialized.current = false;
    if (!store) return;
    void store.listWorkflows().then(async (workflows) => {
      if (!active) return;
      if (!workflows.length) {
        const id = makeId();
        const graph: WorkflowGraph = { formatVersion: 1, name: 'Untitled workflow', nodes: [], edges: [] };
        const record = { id, name: graph.name, graphJson: serializeWorkflow(graph), updatedAt: new Date() };
        await store.saveWorkflow(record);
        if (!active) return;
        workflows = [record];
      }
      setProjectWorkflows(workflows);
      const chosen = workflows[0];
      const graph = parseWorkflow(chosen.graphJson);
      setActiveWorkflowId(chosen.id);
      setWorkflowName(chosen.name);
      const canvas = toCanvas(graph, images);
      setNodes(canvas.nodes);
      setEdges(canvas.edges);
      if (canvas.nodes.length) window.requestAnimationFrame(() => { void reactFlow.fitView({ padding: 0.22, maxZoom: 1 }); });
      initialized.current = true;
      setLoading(false);
    }).catch((cause: unknown) => {
      if (active) { notify.error(cause instanceof Error ? cause.message : 'Could not load project workflows.'); setLoading(false); }
    });
    return () => { active = false; };
    // The image list is resolved into node previews after graph restore below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  useEffect(() => {
    if (!initialized.current || !activeWorkflowId || !store) return;
    const timer = window.setTimeout(() => {
      try {
        const graph = toGraph(activeWorkflowId, workflowName, nodes, edges);
        void store.saveWorkflow({ id: activeWorkflowId, name: workflowName, graphJson: serializeWorkflow(graph), updatedAt: new Date() })
          .then(() => setProjectWorkflows((current) => current.map((item) => item.id === activeWorkflowId ? { ...item, name: workflowName, graphJson: serializeWorkflow(graph), updatedAt: new Date() } : item)))
          .catch((cause: unknown) => notify.error(cause instanceof Error ? cause.message : 'Could not save workflow changes.'));
      } catch (cause) {
        notify.error(cause instanceof Error ? cause.message : 'Could not serialize workflow.');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, workflowName, activeWorkflowId, store]);

  useEffect(() => {
    setNodes((current) => current.map((node) => {
      const imageId = node.data.settings.imageId;
      const image = node.type === 'image' && typeof imageId === 'number'
        ? images.find((item) => item.projectImageId === imageId && !('hasImage' in item))
        : undefined;
      return node.data.image === image ? node : { ...node, data: { ...node.data, image } };
    }));
  }, [images, setNodes]);

  useEffect(() => {
    setNodes((current) => current.map((node) => {
      const state = runStates[node.id] ?? 'idle';
      return node.data.state === state ? node : { ...node, data: { ...node.data, state } };
    }));
  }, [runStates, setNodes]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const currentGraph = useMemo(() => activeWorkflowId ? toGraph(activeWorkflowId, workflowName, nodes, edges) : null,
    [activeWorkflowId, workflowName, nodes, edges]);
  const projectImageIds = useMemo(
    () => eligibleProjectImages(images).map((image) => image.projectImageId as number),
    [images],
  );
  const batchJobCount = useMemo(
    () => (currentGraph ? planSerialBatchRuns(currentGraph, projectImageIds).jobs.length : 0),
    [currentGraph, projectImageIds],
  );
  const runnableIssues = useMemo(() => {
    if (!currentGraph) return [];
    const issues = validateRunnableWorkflow(currentGraph);
    if (listBatchImageRoots(currentGraph).length > 0 && projectImageIds.length === 0) {
      return [...issues, { message: 'Import an image into this project to run this batch workflow.' }];
    }
    return issues;
  }, [currentGraph, projectImageIds]);

  const flushCurrentWorkflow = useCallback(async () => {
    if (!store || !activeWorkflowId || !currentGraph) return;
    await store.saveWorkflow({ id: activeWorkflowId, name: workflowName, graphJson: serializeWorkflow(currentGraph), updatedAt: new Date() });
  }, [activeWorkflowId, currentGraph, store, workflowName]);

  const selectWorkflow = useCallback(async (record: ProjectWorkflowRecord) => {
    try {
      await flushCurrentWorkflow();
      const graph = parseWorkflow(record.graphJson);
      setWorkflowName(record.name);
      setActiveWorkflowId(record.id);
      const canvas = toCanvas(graph, images);
      setNodes(canvas.nodes);
      setEdges(canvas.edges);
      if (canvas.nodes.length) window.requestAnimationFrame(() => { void reactFlow.fitView({ padding: 0.22, maxZoom: 1 }); });
      setRunStates({});
      setRunHistory([]);
      setResultEntries([]);
      setEvidenceEntries([]);
      setSelectedNodeId(null);
    } catch (cause) { notify.error(cause instanceof Error ? cause.message : 'The project workflow is invalid.'); }
  }, [flushCurrentWorkflow, images, reactFlow, setEdges, setNodes]);

  const addNode = useCallback((type: NodeKind, position?: { x: number; y: number }) => {
    const rightmostNode = nodes.reduce((rightmost, node) => Math.max(rightmost, node.position.x + 400), 80);
    const node: CanvasNode = {
      id: makeId(), type, position: position ?? { x: rightmostNode, y: nodes[0]?.position.y ?? 100 },
      data: { settings: { ...portDefaults[type].settings }, state: 'idle' },
    };
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
    if (!position) window.requestAnimationFrame(() => { void reactFlow.fitView({ padding: 0.22, maxZoom: 1 }); });
  }, [nodes, reactFlow, setNodes]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!currentGraph || !connection.source || !connection.target || connection.source === connection.target) return;
    const edge = normalizeConnection(currentGraph, {
      id: makeId(), source: connection.source, sourcePort: portFromHandle(connection.sourceHandle),
      target: connection.target, targetPort: portFromHandle(connection.targetHandle),
    });
    if ('message' in edge) { notify.error(edge.message); return; }
    setEdges((current) => addEdge({
      id: edge.id, source: edge.source, target: edge.target,
      sourceHandle: sourceHandleId(edge.sourcePort), targetHandle: targetHandleId(edge.targetPort),
      style: portEdgeStyle(edge.sourcePort),
    }, current));
  }, [currentGraph, setEdges]);

  const updateSettings = (nodeId: string, settings: WorkflowNode['settings']) => {
    setNodes((current) => current.map((node) => node.id === nodeId
      ? { ...node, data: { ...node.data, settings, image: typeof settings.imageId === 'number' ? images.find((image) => image.projectImageId === settings.imageId) : undefined } }
      : node));
  };

  const openLibrary = async () => {
    setTab('library');
    setTemplatesLoading(true);
    try { setTemplates(await invoke<Template[]>('list_workflow_templates')); }
    catch (cause) { notify.error(cause instanceof Error ? cause.message : String(cause)); }
    finally { setTemplatesLoading(false); }
  };

  const saveTemplate = async () => {
    if (!currentGraph || !nameInput.trim()) return;
    const graph = clearProjectImageSelections({ ...currentGraph, name: nameInput.trim() });
    try {
      const content = serializeWorkflow(graph);
      await invoke('save_workflow_template', { name: graph.name, content });
      setWorkflowName(graph.name);
      setDialog(null);
      setNameInput('');
      await openLibrary();
    } catch (cause) { notify.error(cause instanceof Error ? cause.message : String(cause)); }
  };

  const openTemplate = async (template: Template) => {
    if (!store || openingTemplate) return;
    setOpeningTemplate(template.name);
    try {
      const graph = clearProjectImageSelections(parseWorkflow(template.content));
      await flushCurrentWorkflow();
      const id = makeId();
      const record = { id, name: template.name, graphJson: serializeWorkflow(graph), updatedAt: new Date() };
      await store.saveWorkflow(record);
      setProjectWorkflows((current) => [...current, record]);
      setTab('editor');
      await selectWorkflow(record);
    } catch (cause) { notify.error(cause instanceof Error ? cause.message : 'Could not open this workflow.'); }
    finally { setOpeningTemplate(null); }
  };

  const runWorkflow = async () => {
    if (!currentGraph || !store || !activeWorkflowId || isRunning || batchQueue.current.isProcessing) return;
    if (runnableIssues.length) { notify.error(runnableIssues[0].message); return; }

    const countPipelineNodes = (graph: WorkflowGraph) => {
      const pipelineNodeIds = new Set<string>();
      for (const transform of graph.nodes.filter((node) => transformNodeTypes.includes(node.type))) {
        pipelineNodeIds.add(transform.id);
        const imageEdge = graph.edges.find((edge) => edge.target === transform.id && edge.targetPort === 'image');
        if (imageEdge) pipelineNodeIds.add(imageEdge.source);
      }
      return pipelineNodeIds.size;
    };

    const { jobs: batchJobs } = planSerialBatchRuns(currentGraph, projectImageIds);
    const batchImageNameRef = { current: '' };

    const runGraphOnce = async (graph: WorkflowGraph, runId: string, startedAt: Date) => {
      const total = countPipelineNodes(graph);
      const run: WorkflowRunRecord = {
        id: runId, workflowId: activeWorkflowId, status: 'running', startedAt, finishedAt: null,
        currentNodeId: null, completedNodes: 0, totalNodes: total, error: null,
      };
      stepStartedAt.current = {};
      runProgressRef.current = { completed: 0, total, current: 0, nodeId: '' };
      setRunProgress(runProgressRef.current);
      setRunStates({});
      await store.createWorkflowRun(run);
      try {
        await runner.current.run(graph, {
        handlers: {
          image: createImageNodeHandler(async (imageId) => {
            const image = images.find((item) => item.projectImageId === imageId && !('hasImage' in item));
            if (!image || image.projectImageId === undefined) throw new Error('The selected project image is unavailable.');
            return { imageId, imageName: image.file.name, payload: image, sourceBytes: await readImageBytes(image) };
          }, async (image, reportProgress) => {
            let packet = preparedPackets.current.get(image.imageId);
            if (!packet) {
              packet = await preprocessImage(image.imageId, image.imageName, image.sourceBytes, reportProgress);
              preparedPackets.current.set(image.imageId, packet);
            }
            return { processedBytes: packet.processedBytes, manifest: packet.manifest };
          }),
          ocr: createOcrNodeHandler(async (imageInput, language, reportProgress) => {
            const recognized = await recognizeImage(new Blob([imageInput.processedBytes.slice().buffer as ArrayBuffer], { type: 'image/png' }), language, (progress, status) => {
              setRunProgress((current) => ({ ...current, current: progress }));
              reportProgress(progress, status);
            });
            const manifest = imageInput.preprocessing as ImageProcessingManifest;
            return {
              ...recognized,
              words: recognized.words.filter(hasOcrBoundingBox).map(word => ({
                ...word,
                boundingBox: mapProcessedBoxToSource(
                  word.boundingBox, manifest.processedWidth, manifest.processedHeight,
                  manifest.sourceWidth, manifest.sourceHeight, manifest.processedToSource,
                ),
              })),
            };
          }),
          provenance: createImageProvenanceNodeHandler(async (imageInput, _settings, reportProgress) => {
            const image = imageInput.payload as ImageData;
            const bytes = imageInput.sourceBytes;
            reportProgress(0.1, 'Reading local image metadata');
            const result = await provenanceAnalyzer.current.analyze({
              imageId: imageInput.imageId, imageName: imageInput.imageName, bytes, metadata: image.exif as Record<string, unknown>,
            });
            reportProgress(1, 'Provenance indicators ready');
            return result;
          }),
          'visual-identifiers': createVisualIdentifierNodeHandler(async (imageInput, settings, reportProgress) => {
            const bytes = imageInput.processedBytes;
            const detector = new VisualIdentifierDetector({
              recognize: async (localBytes, options) => {
                const recognized = await recognizeImage(new Blob([localBytes.slice().buffer as ArrayBuffer], { type: 'image/png' }), String(options?.languages ?? 'eng'), (progress, status) => {
                  setRunProgress(current => ({ ...current, current: progress }));
                  options?.onProgress?.({ progress, status: status ?? '' });
                });
                return { ...recognized, words: recognized.words ?? [] };
              },
            });
            const result = await detector.detect({
              imageId: imageInput.imageId, imageName: imageInput.imageName, bytes,
              settings: {
                language: String(settings.language ?? 'eng'),
                enabledFamilies: String(settings.enabledFamilies ?? defaultIdentifierFamilies),
                licensePlateProfile: settings.licensePlateProfile === 'off' || settings.licensePlateProfile === ''
                  ? null
                  : settings.licensePlateProfile === 'us-general'
                    || String(settings.enabledFamilies ?? defaultIdentifierFamilies).split(',').includes('license-plate-like')
                    || settings.licensePlateProfile == null
                    ? 'us-general'
                    : null,
              },
            }, reportProgress);
            const manifest = imageInput.preprocessing as ImageProcessingManifest;
            const sourceBox = (box: { x: number; y: number; width: number; height: number }) => {
              const values = [box?.x, box?.y, box?.width, box?.height, manifest?.processedWidth, manifest?.processedHeight, manifest?.sourceWidth, manifest?.sourceHeight];
              if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
                return { x: 0, y: 0, width: 0, height: 0 };
              }
              const mapped = mapProcessedBoxToSource(
                box, manifest.processedWidth, manifest.processedHeight, manifest.sourceWidth, manifest.sourceHeight, manifest.processedToSource,
              );
              const mappedValues = [mapped.x, mapped.y, mapped.width, mapped.height];
              if (!mappedValues.every(value => Number.isFinite(value))) return { x: 0, y: 0, width: 0, height: 0 };
              return mapped;
            };
            return {
              ...result,
              words: result.words.map(word => ({ ...word, boundingBox: sourceBox(word.boundingBox) })),
              candidates: result.candidates.map(candidate => ({ ...candidate, boundingBox: sourceBox(candidate.boundingBox) })),
            };
          }),
        },
        persistResult: async (node, result) => {
          const finishedAt = new Date();
          if (node.type === 'ocr') {
          const value = result.data as OcrNodeOutput;
          const packet = preparedPackets.current.get(value.imageId);
          await store.appendWorkflowOcrResult({
              ...value, processedAt: finishedAt, resultStatus: value.text.trim() ? 'success' : 'no-text',
              workflowId: activeWorkflowId, workflowRunId: runId, nodeId: node.id,
              preprocessingManifest: packet?.manifest,
            });
            return;
          }
          if (node.type !== 'provenance' && node.type !== 'visual-identifiers') return;
          const value = result.data as { imageId: number; imageName: string; toolVersion: string };
          const packet = preparedPackets.current.get(value.imageId);
          const record: WorkflowToolResultRecord = {
            imageId: value.imageId, imageName: value.imageName, result: result.data, resultStatus: 'success',
            workflowId: activeWorkflowId, workflowRunId: runId, nodeId: node.id, toolVersion: value.toolVersion,
            startedAt: stepStartedAt.current[node.id] ?? startedAt, finishedAt,
            preprocessingManifest: packet?.manifest,
          };
          if (node.type === 'provenance') await store.appendWorkflowProvenanceResult(record);
          else await store.appendWorkflowIdentifierResult(record);
        },
        persistFailure: async (node, errorMessage) => {
          if (node.type !== 'provenance' && node.type !== 'visual-identifiers') return;
          const imageEdge = graph.edges.find(edge => edge.target === node.id && edge.targetPort === 'image');
          const imageNode = imageEdge && graph.nodes.find(candidate => candidate.id === imageEdge.source);
          const imageId = imageNode?.settings.imageId;
          const image = typeof imageId === 'number' ? images.find(candidate => candidate.projectImageId === imageId) : undefined;
          if (!image || image.projectImageId === undefined) return;
          const packet = preparedPackets.current.get(image.projectImageId);
          const record: WorkflowToolResultRecord = {
            imageId: image.projectImageId, imageName: image.file.name, result: {}, resultStatus: 'failed',
            workflowId: activeWorkflowId, workflowRunId: runId, nodeId: node.id, toolVersion: '1.0.0',
            startedAt: stepStartedAt.current[node.id] ?? new Date(), finishedAt: new Date(), error: errorMessage,
            preprocessingManifest: packet?.manifest,
          };
          if (node.type === 'provenance') await store.appendWorkflowProvenanceResult(record);
          else await store.appendWorkflowIdentifierResult(record);
        },
        onEvent: async (event: RunEvent) => {
          if (event.type === 'node-started') {
            stepStartedAt.current[event.nodeId] = new Date();
            runProgressRef.current = { completed: event.completed, total: event.total, current: 0, nodeId: event.nodeId };
            setRunProgress(runProgressRef.current);
            setRunStates((current) => ({ ...current, [event.nodeId]: 'running' }));
            await store.updateWorkflowRun({ ...run, currentNodeId: event.nodeId, completedNodes: event.completed });
          } else if (event.type === 'node-completed') {
            setRunStates((current) => ({ ...current, [event.nodeId]: 'completed' }));
            runProgressRef.current = { completed: event.completed, total: event.total, current: 0, nodeId: '' };
            setRunProgress(runProgressRef.current);
            await store.updateWorkflowRun({ ...run, currentNodeId: null, completedNodes: event.completed });
          } else if (event.type === 'node-progress') {
            runProgressRef.current = { ...runProgressRef.current, nodeId: event.nodeId, current: event.progress };
            setRunProgress((current) => ({ ...current, nodeId: event.nodeId, current: event.progress }));
            setNodes((current) => current.map((node) => node.id === event.nodeId
              ? { ...node, data: { ...node.data, state: 'running', progress: event.progress, status: event.status } }
              : node));
          } else if (event.type === 'failed') {
            setRunStates((current) => ({ ...current, [event.nodeId]: 'failed' }));
            setNodes((current) => current.map((node) => node.id === event.nodeId
              ? { ...node, data: { ...node.data, state: 'failed', status: event.error } }
              : node));
            runProgressRef.current = { completed: event.completed, total: event.total, current: 0, nodeId: event.nodeId };
            setRunProgress(runProgressRef.current);
          }
        },
      });
        await store.updateWorkflowRun({ ...run, status: 'completed', finishedAt: new Date(), completedNodes: total });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        await store.updateWorkflowRun({
          ...run, status: 'failed', finishedAt: new Date(),
          currentNodeId: runProgressRef.current.nodeId || null,
          completedNodes: runProgressRef.current.completed, error: message,
        });
        throw cause;
      }
    };

    setIsRunning(true);
    preparedPackets.current.clear();
    setBatchRunProgress({ index: 0, total: batchJobs.length });
    try {
      if (!batchJobs.length) {
        await runGraphOnce(currentGraph, makeId(), new Date());
        notify.success('Workflow finished.');
      } else {
        notify.success(`Running workflow on ${batchJobs.length} images…`);
        batchQueue.current.enqueue(batchJobs);
        let completedImages = 0;
        await batchQueue.current.process(async (job) => {
          const image = images.find((item) => item.projectImageId === job.imageId && !('hasImage' in item));
          batchImageNameRef.current = image?.file.name ?? `Image ${job.imageId}`;
          setBatchRunProgress({ index: completedImages + 1, total: batchJobs.length });
          preparedPackets.current.clear();
          await runGraphOnce(job.graph, makeId(), new Date());
          completedImages += 1;
        });
        notify.success(`Batch workflow finished (${batchJobs.length} images).`);
      }
      setRunHistory(await store.listWorkflowRuns(activeWorkflowId));
      if (selectedNode?.type === 'text') await loadOutputResults(selectedNode.id, currentGraph);
      if (selectedNode?.type === 'evidence') await loadEvidenceResults(selectedNode.id, currentGraph);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      if (batchJobs.length) {
        notify.error(batchImageNameRef.current
          ? `Workflow failed on ${batchImageNameRef.current}: ${message}`
          : `Batch workflow failed: ${message}`);
      } else {
        notify.error(message);
      }
      setRunHistory(await store.listWorkflowRuns(activeWorkflowId));
      if (selectedNode?.type === 'evidence') await loadEvidenceResults(selectedNode.id, currentGraph);
    } finally {
      preparedPackets.current.clear();
      setIsRunning(false);
      setBatchRunProgress({ index: 0, total: 0 });
    }
  };

  const loadOutputResults = async (textNodeId: string, graph = currentGraph) => {
    if (!store || !activeWorkflowId || !graph) return;
    const source = getTextOutputSource(graph, textNodeId);
    if (!source) { setResultEntries([]); return; }
    setResultEntries(await store.listWorkflowOcrResults(activeWorkflowId, source.id));
  };

  const loadEvidenceResults = async (evidenceNodeId: string, graph = currentGraph) => {
    if (!store || !activeWorkflowId || !graph) return;
    const sources = getEvidenceOutputSources(graph, evidenceNodeId);
    const records = await Promise.all(sources.map(async source => {
      const rows = source.type === 'provenance'
        ? await store.listWorkflowProvenanceResults(activeWorkflowId, source.id)
        : await store.listWorkflowIdentifierResults(activeWorkflowId, source.id);
      return rows.map(record => ({ sourceNode: source, record }));
    }));
    setEvidenceEntries(records.flat().sort((left, right) => right.record.finishedAt.getTime() - left.record.finishedAt.getTime()));
  };

  const copyEvidenceValue = async (value: string) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(value);
      notify.success('Evidence value copied to clipboard.');
    } catch {
      notify.error('Clipboard access is unavailable.');
    }
  };

  useEffect(() => {
    if (selectedNode?.type === 'text') void loadOutputResults(selectedNode.id);
    if (selectedNode?.type === 'evidence') void loadEvidenceResults(selectedNode.id);
    // loadOutputResults is intentionally scoped to current graph/selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, activeWorkflowId, store]);

  const dragStart = (event: React.DragEvent, type: NodeKind) => {
    event.dataTransfer.setData('application/workbench-node', type);
    event.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/workbench-node') as NodeKind;
    if (type in portDefaults) {
      addNode(type, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    }
  };

  const overallProgress = runProgress.total ? Math.min(1, (runProgress.completed + runProgress.current) / runProgress.total) : 0;
  const lastRun = runHistory[0];
  const lastRunLabel = lastRun
    ? `Last run: ${lastRun.status}${lastRun.finishedAt ? ` · ${lastRun.finishedAt.toLocaleString()}` : ` · started ${lastRun.startedAt.toLocaleString()}`}`
    : null;

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-black" aria-label="Workbench">
      <header className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-app-gray-light/40 bg-app-dark px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <WorkflowIcon className="h-5 w-5 shrink-0 text-app-accent" aria-hidden="true" />
          <h1 className="shrink-0 text-base font-semibold text-app-white">Workbench</h1>
          <Select
            compact
            aria-label="Project workflow"
            disabled={loading}
            className="max-w-56 truncate disabled:cursor-wait"
            value={activeWorkflowId ?? ''}
            onChange={(event) => {
              const next = projectWorkflows.find((item) => item.id === event.target.value);
              if (next) void selectWorkflow(next);
            }}
          >
            {projectWorkflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </Select>
          <Button variant="ghost" size="sm" disabled={loading || !store} onClick={() => { setNameInput(''); setDialog('new'); }} tooltip="Create a separate workflow in this project" tooltipPosition="bottom" icon={<FilePlus2 className="h-4 w-4" />}>New</Button>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning && runnableIssues.length > 0 && <span className="max-w-56 truncate text-right text-xs text-app-accent-dim" aria-live="polite" title={runnableIssues[0].message}>{runnableIssues[0].message}</span>}
          {isRunning && <div className="flex max-w-56 items-center gap-2 pr-4" aria-live="polite">
            {batchRunProgress.total > 1 && <span className="shrink-0 text-xs tabular-nums text-app-accent-dim">Image {batchRunProgress.index}/{batchRunProgress.total}</span>}
            <div role="progressbar" aria-label="Workflow progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overallProgress * 100)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-gray-light"><div className="h-full bg-app-accent transition-[width]" style={{ width: `${Math.round(overallProgress * 100)}%` }} /></div>
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-app-accent-dim">{Math.round(overallProgress * 100)}%</span>
          </div>}
          <Button onClick={runWorkflow} disabled={isRunning || loading || !store || tab !== 'editor' || runnableIssues.length > 0} tooltip={runnableIssues[0]?.message ?? (batchJobCount > 0 ? `Process each project image once (${batchJobCount} images).` : 'Process each connected node in order and save its output to this project.')} tooltipPosition="bottom" icon={<Play className="h-4 w-4" />}>{isRunning ? 'Running' : batchJobCount > 0 ? `Run on ${batchJobCount} images` : 'Run Workflow'}</Button>
        </div>
      </header>

      <nav className="flex flex-none gap-1 border-b border-app-gray-light/30 px-4" role="tablist" aria-label="Workbench views">
        <button id="workbench-editor-tab" type="button" role="tab" aria-controls="workbench-editor-panel" aria-selected={tab === 'editor'} tabIndex={tab === 'editor' ? 0 : -1} className={`border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${tab === 'editor' ? 'border-app-accent text-app-white' : 'border-transparent text-app-accent-dim hover:text-app-white'}`} onKeyDown={handleTabKeyDown} onClick={() => setTab('editor')}>Editor</button>
        <button id="workbench-library-tab" type="button" role="tab" aria-controls="workbench-library-panel" aria-selected={tab === 'library'} tabIndex={tab === 'library' ? 0 : -1} className={`border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${tab === 'library' ? 'border-app-accent text-app-white' : 'border-transparent text-app-accent-dim hover:text-app-white'}`} onKeyDown={handleTabKeyDown} onClick={() => void openLibrary()}>Saved workflows</button>
      </nav>

      {!store ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="max-w-sm rounded-xl border border-dashed border-app-gray-light px-6 py-8 text-center">
            <WorkflowIcon className="mx-auto h-6 w-6 text-app-accent-dim" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-app-white">Open an investigation first</p>
            <p className="mt-1 text-xs leading-relaxed text-app-accent-dim">Workbench saves workflows and results in the current project. Start or open an investigation to continue.</p>
          </div>
        </div>
      ) : tab === 'editor' ? (
        <div id="workbench-editor-panel" role="tabpanel" aria-labelledby="workbench-editor-tab" tabIndex={0} className="flex min-h-0 flex-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-app-accent">
          <aside className={`flex min-h-0 flex-none flex-col overflow-hidden border-r border-app-gray-light/40 bg-app-dark transition-all duration-300 ease-in-out ${isNodesCollapsed ? 'w-12' : 'w-52'}`} aria-label="Workflow nodes">
            <div
              className={`flex flex-none items-center border-b border-app-gray-light/30 ${isNodesCollapsed ? '' : 'justify-between gap-1 px-3 py-3'}`}
            >
              <SidebarRailToggle
                expanded={!isNodesCollapsed}
                onToggle={() => setIsNodesCollapsed((current) => !current)}
                screenReaderLabel="Workflow nodes panel"
                testId="workbench-nodes-toggle"
                className={`flex cursor-pointer items-center hover:bg-app-gray-light/30 ${isNodesCollapsed ? 'h-12 w-full justify-center' : 'min-w-0 flex-1 justify-between'}`}
                leading={!isNodesCollapsed ? <h2 className="text-xs font-semibold uppercase tracking-widest text-app-accent-dim">Nodes</h2> : undefined}
                chevron={isNodesCollapsed ? <ChevronRight className="h-5 w-5 text-app-white" /> : <ChevronLeft className="h-5 w-5 text-app-white" />}
              />
              {!isNodesCollapsed && (
                <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={() => setDialog('save')} aria-label="Save reusable workflow" tooltip="Save a reusable copy of this workflow on this machine" tooltipPosition="bottom" icon={<Save className="h-4 w-4" />} />
              )}
            </div>
            {!isNodesCollapsed && <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-3">
            {(['Inputs', 'Transforms', 'Outputs'] as const).map((category) => {
              const types: NodeKind[] = category === 'Inputs' ? ['image', 'all-images'] : category === 'Transforms'
                ? ['ocr', 'provenance', 'visual-identifiers'] : ['text', 'evidence'];
              return <div key={category} className="mb-4">
                <h3 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.12em] text-app-accent-dim">{category}</h3>
                {types.map((type) => <Tooltip key={type} className="mb-1 w-full" content={loading ? 'Loading project workflow' : `Drag ${portDefaults[type].title} onto the canvas, or click to add it`} position="right"><button type="button" draggable={!loading} disabled={loading} onDragStart={(event) => dragStart(event, type)} onClick={() => addNode(type)} className="flex min-h-10 w-full cursor-grab items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-app-white hover:border-app-gray-light hover:bg-app-gray focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent active:cursor-grabbing disabled:cursor-wait disabled:opacity-60" aria-label={`Add ${portDefaults[type].title} node`}>
                  <span className="h-2 w-2 rounded-full bg-app-accent-dim" />{portDefaults[type].title}<span className="ml-auto text-xs text-app-accent-dim">+</span>
                </button></Tooltip>)}
              </div>;
            })}
            <div className="mt-auto border-t border-app-gray-light/30 pt-3 text-[11px] leading-relaxed text-app-accent-dim">Drag nodes onto the canvas, connect their ports, then run the workflow.</div>
            </div>}
          </aside>

          <div className="relative min-h-0 min-w-0 flex-1" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
            {loading ? <div className="flex h-full items-center justify-center text-sm text-app-accent-dim">Loading project workflow…</div> : (
              <WorkbenchEligibleImageCountContext.Provider value={projectImageIds.length}>
                <ReactFlow className="h-full" nodes={nodes} edges={edges} nodeTypes={nodeTypes} defaultViewport={{ x: 0, y: 0, zoom: 1 }} connectionMode={ConnectionMode.Loose} isValidConnection={(connection) => isFlowConnectionAllowed(currentGraph, connection)} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={handleConnect}
                  onNodeClick={(_, node) => { setSelectedNodeId(node.id); if (node.type !== 'text') setResultEntries([]); if (node.type !== 'evidence') setEvidenceEntries([]); }} onPaneClick={() => { setSelectedNodeId(null); setResultEntries([]); setEvidenceEntries([]); }} minZoom={0.15} maxZoom={2} deleteKeyCode={['Backspace', 'Delete']} proOptions={{ hideAttribution: true }}>
                  <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--app-gray-light)" />
                  <Controls showInteractive={false} fitViewOptions={{ padding: 0.22, maxZoom: 1 }} />
                </ReactFlow>
              </WorkbenchEligibleImageCountContext.Provider>
            )}
            {!loading && nodes.length === 0 && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-xl border border-dashed border-app-gray-light bg-app-black/70 px-6 py-5 text-center"><p className="text-sm font-medium text-app-white">Start with an image</p><p className="mt-1 text-xs text-app-accent-dim">Drag a node from the catalog or click + to add it.</p></div></div>}
          </div>

          <aside className={`flex min-h-0 flex-none flex-col overflow-hidden border-l border-app-gray-light/40 bg-app-dark transition-all duration-300 ease-in-out ${isInspectorCollapsed ? 'w-12' : 'w-72'}`} aria-label="Node inspector">
            <SidebarRailToggle
              expanded={!isInspectorCollapsed}
              onToggle={() => setIsInspectorCollapsed((current) => !current)}
              screenReaderLabel="Node inspector panel"
              testId="workbench-inspector-toggle"
              className={`flex flex-none cursor-pointer items-center border-b border-app-gray-light/30 hover:bg-app-gray-light/30 ${isInspectorCollapsed ? 'h-12 justify-center' : 'justify-between gap-2 px-4 py-3'}`}
              leading={!isInspectorCollapsed ? (
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-app-accent-dim">Inspector</h2>
                  <p className="mt-1 truncate text-sm font-medium text-app-white">{selectedNode ? portDefaults[selectedNode.type as NodeKind].title : 'Select a node'}</p>
                </div>
              ) : undefined}
              chevron={isInspectorCollapsed ? <ChevronLeft className="h-5 w-5 text-app-white" /> : <ChevronRight className="h-5 w-5 text-app-white" />}
            />
            {!isInspectorCollapsed && <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{lastRunLabel && <p className="border-b border-app-gray-light/30 px-4 py-2 text-[11px] leading-relaxed text-app-accent-dim" title={lastRunLabel}>{lastRunLabel}</p>}{!selectedNode ? <p className="p-4 text-sm text-app-accent-dim">Select a node on the canvas to view its settings or output.</p> : selectedNode.type === 'image' ? (
              <div className="space-y-4 p-4">
                <label className="block text-xs font-medium text-app-accent-dim">Project image
                  <Select value={typeof selectedNode.data.settings.imageId === 'number' ? selectedNode.data.settings.imageId : ''} onChange={(event) => updateSettings(selectedNode.id, { ...selectedNode.data.settings, imageId: event.target.value ? Number(event.target.value) : null })}>
                    <option value="">Choose an image…</option>
                    {images.filter((image) => image.projectImageId !== undefined && !('hasImage' in image)).map((image) => <option key={image.projectImageId} value={image.projectImageId}>{image.file.name}</option>)}
                  </Select>
                </label>
                {images.filter((image) => image.projectImageId !== undefined && !('hasImage' in image)).length === 0 && <p className="text-xs text-app-accent-dim">Import an image into this project to use it in a workflow.</p>}
              </div>
            ) : selectedNode.type === 'all-images' ? (
              <div className="space-y-4 p-4">
                <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-1 text-sm text-app-white hover:bg-app-gray">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-app-gray-light accent-app-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    checked={selectedNode.data.settings.active !== false}
                    onChange={(event) => updateSettings(selectedNode.id, { ...selectedNode.data.settings, active: event.target.checked })}
                  />
                  Active
                </label>
                <p className="text-xs leading-relaxed text-app-accent-dim">When active, Run workflow processes each project image once, in order, and saves a separate run for each image.</p>
                {projectImageIds.length === 0 && <p className="text-xs text-app-accent-dim">Import an image into this project to use batch runs.</p>}
              </div>
            ) : selectedNode.type === 'ocr' ? (
              <div className="space-y-4 p-4">
                <label className="block text-xs font-medium text-app-accent-dim">OCR language<Select value={String(selectedNode.data.settings.language ?? 'eng')} onChange={(event) => updateSettings(selectedNode.id, { ...selectedNode.data.settings, language: event.target.value })}><option value="eng">English</option></Select></label>
                <p className="text-xs leading-relaxed text-app-accent-dim">PaddleOCR runs locally as one step in the connected workflow. Each run is saved with model attribution so you can compare results for the same image.</p>
              </div>
            ) : selectedNode.type === 'provenance' ? (
              <div className="space-y-3 p-4"><p className="text-xs leading-relaxed text-app-accent-dim">Inspect embedded metadata, recorded timestamp relationships, and available JPEG/container structure facts.</p><p className="rounded-lg border border-app-gray-light/50 bg-app-gray/50 p-3 text-xs leading-relaxed text-app-accent-dim">Findings are observable indicators for review. They do not determine whether an image is authentic or manipulated.</p></div>
            ) : selectedNode.type === 'visual-identifiers' ? (
              <div className="space-y-4 p-4">
                <label className="block text-xs font-medium text-app-accent-dim">OCR language<Select value={String(selectedNode.data.settings.language ?? 'eng')} onChange={(event) => updateSettings(selectedNode.id, { ...selectedNode.data.settings, language: event.target.value })}><option value="eng">English</option></Select></label>
                <fieldset><legend className="mb-2 text-xs font-medium text-app-accent-dim">Candidate patterns</legend><div className="space-y-1">{identifierFamilies.map((family) => {
                  const families = String(selectedNode.data.settings.enabledFamilies ?? defaultIdentifierFamilies).split(',');
                  const enabled = family.id === 'license-plate-like'
                    ? selectedNode.data.settings.licensePlateProfile !== 'off'
                    : families.includes(family.id);
                  return <label key={family.id} className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-1 text-sm text-app-white hover:bg-app-gray"><input type="checkbox" className="h-4 w-4 shrink-0 rounded border-app-gray-light accent-app-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent" checked={enabled} onChange={(event) => {
                    const current = new Set(String(selectedNode.data.settings.enabledFamilies ?? defaultIdentifierFamilies).split(',').filter(Boolean));
                    if (event.target.checked) current.add(family.id); else current.delete(family.id);
                    updateSettings(selectedNode.id, {
                      ...selectedNode.data.settings,
                      enabledFamilies: Array.from(current).join(','),
                      licensePlateProfile: current.has('license-plate-like') ? 'us-general' : 'off',
                    });
                  }} />{family.title}</label>;
                })}</div></fieldset>
                <p className="text-xs leading-relaxed text-app-accent-dim">Matches are pattern candidates with source coordinates, not identity claims. OCR uses local image bytes.</p>
              </div>
            ) : selectedNode.type === 'text' ? (
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-xs text-app-accent-dim">Saved output history</p><span className="text-[10px] text-app-accent-dim">{resultEntries.length} entries</span></div>
                {resultEntries.length === 0 ? <p className="rounded-lg border border-dashed border-app-gray-light p-3 text-xs text-app-accent-dim">Run the connected workflow to create an output.</p> : <ul className="space-y-3">{resultEntries.map((result) => <li key={result.id ?? `${result.workflowRunId}-${result.processedAt.toISOString()}`} className="rounded-lg border border-app-gray-light/60 bg-app-gray/60 p-3">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium text-app-white">{result.imageName} <span className="text-app-accent-dim">· ID {result.imageId}</span></p><p className="mt-1 text-[10px] text-app-accent-dim">{result.processedAt.toLocaleString()}{result.confidence == null ? '' : ` · ${Math.round(result.confidence)}% confidence`} · {result.provider === 'paddle' ? 'PaddleOCR' : 'Tesseract'}{result.engineVersion ? ` · ${result.engineVersion}` : ''}</p></div><Tooltip content="Copy extracted text" position="left"><button type="button" className="rounded p-2 text-app-accent-dim hover:bg-app-gray hover:text-app-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent" aria-label={`Copy extracted text from ${result.imageName}`} onClick={() => void navigator.clipboard.writeText(result.text).then(() => notify.success('Text copied to clipboard.')).catch(() => notify.error('Clipboard access is unavailable.'))}><Copy className="h-4 w-4" /></button></Tooltip></div>
                  <pre className="selectable-value mt-3 whitespace-pre-wrap break-words font-sans text-xs text-app-white">{result.text || 'No text could be extracted.'}</pre>
                  {result.words?.length ? <details className="mt-3"><summary className="cursor-pointer text-xs text-app-accent-dim">Recognized words and source coordinates ({result.words.length})</summary><ul className="mt-2 space-y-1">{result.words.map((word, index) => <li key={`${word.text}-${index}`} className="flex justify-between gap-2 rounded bg-app-black/30 px-2 py-1 text-[10px]"><span className="selectable-value break-all text-app-white">{word.text}</span><span className="selectable-value shrink-0 text-app-accent-dim">{formatOcrCoordinates(word?.boundingBox)}</span></li>)}</ul></details> : null}
                </li>)}</ul>}
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-xs text-app-accent-dim">Saved forensic history</p><span className="text-[10px] text-app-accent-dim">{evidenceEntries.length} entries</span></div>
                {evidenceEntries.length === 0 ? <p className="rounded-lg border border-dashed border-app-gray-light p-3 text-xs text-app-accent-dim">Run the connected workflow to create an evidence report.</p> : <ul className="space-y-3">{evidenceEntries.map(({ sourceNode, record }) => {
                  const payload = record.result as EvidencePayload;
                  return <li key={record.id ?? `${record.workflowRunId}-${record.nodeId}-${record.startedAt.toISOString()}`} className="rounded-lg border border-app-gray-light/60 bg-app-gray/60 p-3">
                    <div className="mb-2"><p className="truncate text-xs font-medium text-app-white">{record.imageName} <span className="text-app-accent-dim">· ID {record.imageId}</span></p><p className="mt-1 text-[10px] text-app-accent-dim">{sourceNode.type === 'provenance' ? 'Image Provenance' : 'Text & Identifiers'} · {record.finishedAt.toLocaleString()} · v{record.toolVersion}</p></div>
                    {record.resultStatus === 'failed' ? <p className="rounded bg-app-danger-bg p-2 text-xs text-app-danger">Analysis failed: {record.error ?? 'Unknown error'}</p> : <>
                      {payload.facts !== undefined && <details className="mb-3"><summary className="cursor-pointer text-xs text-app-accent">Image facts and timestamps</summary><pre className="selectable-value mt-2 whitespace-pre-wrap break-words text-[10px] text-app-accent-dim">{JSON.stringify(payload.facts, null, 2)}</pre></details>}
                      {payload.text !== undefined && <div className="mb-3"><p className="mb-1 text-[10px] uppercase tracking-wide text-app-accent-dim">Recognized text</p><pre className="selectable-value whitespace-pre-wrap break-words text-xs text-app-white">{payload.text || 'No text was recognized.'}</pre></div>}
                      {payload.indicators?.length ? <ul className="space-y-2">{payload.indicators.map((indicator, index) => <li key={`${indicator.code}-${index}`} className="rounded-lg border border-app-gray-light/40 p-2"><p className="text-xs font-medium text-app-white">{indicator.code ?? 'Indicator'}</p><p className="mt-1 text-[11px] leading-relaxed text-app-accent-dim">{indicator.message}</p>{indicator.observedValue && <p className="selectable-value mt-1 break-all text-xs text-app-white">{indicator.observedValue}</p>}<button type="button" className="mt-2 min-h-8 rounded px-2 text-xs text-app-accent hover:bg-app-gray focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent" onClick={() => void copyEvidenceValue(indicator.observedValue ?? indicator.message ?? indicator.code ?? '')}>Copy value</button></li>)}</ul> : payload.indicators && <p className="text-xs text-app-accent-dim">No provenance indicators were found in this run.</p>}
                      {payload.candidates?.length ? <ul className="space-y-2">{payload.candidates.map((candidate, index) => <li key={`${candidate.family}-${candidate.value}-${index}`} className="rounded-lg border border-app-gray-light/40 p-2"><p className="text-[10px] uppercase tracking-wide text-app-accent-dim">{candidate.family} · {Math.round(candidate.confidence)}% OCR confidence</p><p className="selectable-value mt-1 break-all text-sm text-app-white">{candidate.value}</p><p className="mt-1 text-[10px] text-app-accent-dim">Image region: {JSON.stringify(candidate.boundingBox)}</p><button type="button" className="mt-2 min-h-8 rounded px-2 text-xs text-app-accent hover:bg-app-gray focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent" onClick={() => void copyEvidenceValue(candidate.value)}>Copy candidate</button></li>)}</ul> : payload.candidates && <p className="text-xs text-app-accent-dim">No identifier candidates matched the enabled patterns.</p>}
                    </>}
                  </li>;
                })}</ul>}
              </div>
            )}</div>}
          </aside>
        </div>
      ) : (
        <div id="workbench-library-panel" role="tabpanel" aria-labelledby="workbench-library-tab" tabIndex={0} className="min-h-0 flex-1 overflow-y-auto p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-app-accent">
          <div className="mx-auto max-w-5xl"><div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-app-white">Saved workflows</h2><p className="mt-1 text-sm text-app-accent-dim">Reusable graphs stored on this machine.</p></div><Button variant="secondary" size="sm" onClick={() => void openLibrary()} icon={<FolderOpen className="h-4 w-4" />}>Refresh</Button></div>
            {templatesLoading ? <div role="status" className="rounded-xl border border-app-gray-light/50 px-6 py-12 text-center text-sm text-app-accent-dim">Loading saved workflows…</div> : templates.length === 0 ? <div className="rounded-xl border border-dashed border-app-gray-light px-6 py-12 text-center"><p className="text-sm text-app-white">No saved workflows yet</p><p className="mt-1 text-xs text-app-accent-dim">Use Save reusable workflow in the editor to add one here.</p></div> : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <li key={template.name}><button type="button" disabled={openingTemplate !== null} aria-busy={openingTemplate === template.name} onClick={() => void openTemplate(template)} className="group w-full rounded-xl border border-app-gray-light/50 bg-app-gray/50 p-4 text-left hover:border-app-accent/60 hover:bg-app-gray focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-accent disabled:cursor-wait disabled:opacity-60"><div className="flex items-center gap-3"><WorkflowIcon className="h-5 w-5 text-app-accent-dim group-hover:text-app-accent" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-app-white">{template.name}</span></div><p className="mt-3 text-xs text-app-accent-dim">{openingTemplate === template.name ? 'Opening workflow…' : 'Select to open in this project'}</p></button></li>)}</ul>}
          </div>
        </div>
      )}

      {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-app-modal-scrim p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }} onKeyDown={handleDialogKeyDown}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="workflow-name-title" className="w-full max-w-md rounded-xl border border-app-gray-light bg-app-gray p-5 shadow-2xl"><h2 id="workflow-name-title" className="text-base font-semibold text-app-white">{dialog === 'save' ? 'Save reusable workflow' : 'Create project workflow'}</h2><p className="mt-1 text-sm text-app-accent-dim">{dialog === 'save' ? 'This saves a portable copy in your machine-wide workflow library.' : 'Create a separate workflow in this project.'}</p><label className="mt-4 block text-xs font-medium text-app-accent-dim">Workflow name<input autoFocus value={nameInput} onChange={(event) => setNameInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void (dialog === 'save' ? saveTemplate() : createProjectWorkflow()); }} className={appControlBlockClassName} maxLength={80} /></label><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={() => void (dialog === 'save' ? saveTemplate() : createProjectWorkflow())} disabled={!nameInput.trim()}>{dialog === 'save' ? 'Save workflow' : 'Create workflow'}</Button></div></div></div>}
    </section>
  );

  async function createProjectWorkflow() {
    if (!store || !nameInput.trim()) return;
    const id = makeId();
    const graph: WorkflowGraph = { formatVersion: 1, name: nameInput.trim(), nodes: [], edges: [] };
    const record = { id, name: graph.name, graphJson: serializeWorkflow(graph), updatedAt: new Date() };
    try {
      await flushCurrentWorkflow();
      await store.saveWorkflow(record);
      setProjectWorkflows((current) => [...current, record]);
      setDialog(null);
      setNameInput('');
      await selectWorkflow(record);
    } catch (cause) { notify.error(cause instanceof Error ? cause.message : 'Could not create workflow.'); }
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'editor' : event.key === 'End' ? 'library'
      : event.key === 'ArrowLeft' ? 'editor' : 'library';
    document.getElementById(next === 'editor' ? 'workbench-editor-tab' : 'workbench-library-tab')?.focus();
    if (next === 'editor') setTab('editor');
    else void openLibrary();
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') { setDialog(null); return; }
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
};

const Workbench: React.FC<Props> = (props) => (
  <ReactFlowProvider><WorkbenchContent {...props} /></ReactFlowProvider>
);

export default Workbench;
