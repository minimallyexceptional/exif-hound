import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow, type Connection, type Edge, type Node,
} from '@xyflow/react';
import { Copy, FilePlus2, FolderOpen, Play, Save, Workflow as WorkflowIcon } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import type { ProjectStore, ProjectWorkflowRecord, OcrResultRecord, WorkflowRunRecord } from 'investigation-archive';
import { clearProjectImageSelections, createImageNodeHandler, createOcrNodeHandler, getTextOutputSource, parseWorkflow, serializeWorkflow, validateConnection, validateRunnableWorkflow, WorkflowRunner, type NodeKind, type OcrNodeOutput, type RunEvent, type WorkflowGraph, type WorkflowNode } from 'workbench-workflow';
import type { ImageData } from '../types';
import { Button } from './common/Button';
import ImageFlowNode from './workbench/ImageFlowNode';
import OcrFlowNode from './workbench/OcrFlowNode';
import TextFlowNode from './workbench/TextFlowNode';
import type { WorkbenchFlowData } from './workbench/NodeFrame';

interface Template { name: string; content: string }
interface Props {
  images: ImageData[];
  store: ProjectStore | null;
  recognizeImage: (image: ImageData, language: string, onProgress: (progress: number, status?: string) => void) => Promise<{ text: string; confidence: number }>;
}

type CanvasNode = Node<WorkbenchFlowData, NodeKind>;
const nodeTypes = { image: ImageFlowNode, ocr: OcrFlowNode, text: TextFlowNode };
const portDefaults: Record<NodeKind, { title: string; settings: WorkflowNode['settings'] }> = {
  image: { title: 'Image', settings: { imageId: null } },
  ocr: { title: 'OCR', settings: { language: 'eng' } },
  text: { title: 'Text output', settings: {} },
};

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    edges: graph.edges.map((edge) => ({ id: edge.id, source: edge.source, sourceHandle: edge.sourcePort, target: edge.target, targetHandle: edge.targetPort, animated: false, style: { stroke: 'var(--app-accent-dim)', strokeWidth: 1.5 } })),
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
      id: edge.id, source: edge.source, sourcePort: edge.sourceHandle ?? '',
      target: edge.target, targetPort: edge.targetHandle ?? '',
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [resultEntries, setResultEntries] = useState<OcrResultRecord[]>([]);
  const [runHistory, setRunHistory] = useState<WorkflowRunRecord[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'save' | 'new' | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState({ completed: 0, total: 0, current: 0, nodeId: '' });
  const [runStates, setRunStates] = useState<Record<string, WorkbenchFlowData['state']>>({});
  const runner = useRef(new WorkflowRunner());
  const runProgressRef = useRef({ completed: 0, total: 0, current: 0, nodeId: '' });
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
      initialized.current = true;
      setLoading(false);
    }).catch((cause: unknown) => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Could not load project workflows.'); setLoading(false); }
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
          .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not save workflow changes.'));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not serialize workflow.');
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
      setRunStates({});
      setRunHistory([]);
      setResultEntries([]);
      setSelectedNodeId(null);
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The project workflow is invalid.'); }
  }, [flushCurrentWorkflow, images, setEdges, setNodes]);

  const addNode = useCallback((type: NodeKind, position?: { x: number; y: number }) => {
    const node: CanvasNode = {
      id: makeId(), type, position: position ?? { x: 100 + nodes.length * 28, y: 80 + nodes.length * 28 },
      data: { settings: { ...portDefaults[type].settings }, state: 'idle' },
    };
    setNodes((current) => [...current, node]);
    setSelectedNodeId(node.id);
  }, [nodes.length, setNodes]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!currentGraph || !connection.source || !connection.target) return;
    const edge = {
      id: makeId(), source: connection.source, sourcePort: connection.sourceHandle ?? '',
      target: connection.target, targetPort: connection.targetHandle ?? '',
    };
    const issue = validateConnection(currentGraph, edge);
    if (issue) { setError(issue.message); return; }
    setError(null);
    setEdges((current) => addEdge({ ...edge, sourceHandle: edge.sourcePort, targetHandle: edge.targetPort, style: { stroke: 'var(--app-accent-dim)', strokeWidth: 1.5 } }, current));
  }, [currentGraph, setEdges]);

  const updateSettings = (nodeId: string, settings: WorkflowNode['settings']) => {
    setNodes((current) => current.map((node) => node.id === nodeId
      ? { ...node, data: { ...node.data, settings, image: typeof settings.imageId === 'number' ? images.find((image) => image.projectImageId === settings.imageId) : undefined } }
      : node));
  };

  const openLibrary = async () => {
    setTab('library');
    setError(null);
    try { setTemplates(await invoke<Template[]>('list_workflow_templates')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
  };

  const openTemplate = async (template: Template) => {
    if (!store) return;
    try {
      const graph = clearProjectImageSelections(parseWorkflow(template.content));
      await flushCurrentWorkflow();
      const id = makeId();
      const record = { id, name: template.name, graphJson: serializeWorkflow(graph), updatedAt: new Date() };
      await store.saveWorkflow(record);
      setProjectWorkflows((current) => [...current, record]);
      setTab('editor');
      await selectWorkflow(record);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not open this workflow.'); }
  };

  const runWorkflow = async () => {
    if (!currentGraph || !store || !activeWorkflowId || isRunning) return;
    const issues = validateRunnableWorkflow(currentGraph);
    if (issues.length) { setError(issues[0].message); return; }
    const id = makeId();
    const startedAt = new Date();
    const pipelineNodeIds = new Set<string>();
    for (const transform of currentGraph.nodes.filter((node) => node.type === 'ocr')) {
      pipelineNodeIds.add(transform.id);
      const imageEdge = currentGraph.edges.find((edge) => edge.target === transform.id && edge.targetPort === 'image');
      if (imageEdge) pipelineNodeIds.add(imageEdge.source);
    }
    const total = pipelineNodeIds.size;
    const run: WorkflowRunRecord = { id, workflowId: activeWorkflowId, status: 'running', startedAt, finishedAt: null, currentNodeId: null, completedNodes: 0, totalNodes: total, error: null };
    setIsRunning(true);
    setError(null);
    runProgressRef.current = { completed: 0, total, current: 0, nodeId: '' };
    setRunProgress(runProgressRef.current);
    setRunStates({});
    try {
      await store.createWorkflowRun(run);
      await runner.current.run(currentGraph, {
        handlers: {
          image: createImageNodeHandler((imageId) => {
            const image = images.find((item) => item.projectImageId === imageId && !('hasImage' in item));
            if (!image || image.projectImageId === undefined) throw new Error('The selected project image is unavailable.');
            return { imageId, imageName: image.file.name, payload: image };
          }),
          ocr: createOcrNodeHandler(async (imageInput, language, reportProgress) => {
            const recognized = await recognizeImage(imageInput.payload as ImageData, language, (progress, status) => {
              setRunProgress((current) => ({ ...current, current: progress }));
              reportProgress(progress, status);
            });
            return recognized;
          }),
        },
        persistResult: async (node, result) => {
          if (node.type !== 'ocr') return;
          const value = result.data as OcrNodeOutput;
          await store.appendWorkflowOcrResult({
            ...value, processedAt: new Date(), resultStatus: value.text.trim() ? 'success' : 'no-text',
            workflowId: activeWorkflowId, workflowRunId: id, nodeId: node.id,
          });
        },
        onEvent: async (event: RunEvent) => {
          if (event.type === 'node-started') {
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
            runProgressRef.current = { completed: event.completed, total: event.total, current: 0, nodeId: event.nodeId };
            setRunProgress(runProgressRef.current);
          }
        },
      });
      await store.updateWorkflowRun({ ...run, status: 'completed', finishedAt: new Date(), completedNodes: total });
      setRunHistory(await store.listWorkflowRuns(activeWorkflowId));
      if (selectedNode?.type === 'text') await loadOutputResults(selectedNode.id, currentGraph);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
      await store.updateWorkflowRun({ ...run, status: 'failed', finishedAt: new Date(), currentNodeId: runProgressRef.current.nodeId || null, completedNodes: runProgressRef.current.completed, error: message });
      setRunHistory(await store.listWorkflowRuns(activeWorkflowId));
    } finally { setIsRunning(false); }
  };

  const loadOutputResults = async (textNodeId: string, graph = currentGraph) => {
    if (!store || !activeWorkflowId || !graph) return;
    const source = getTextOutputSource(graph, textNodeId);
    if (!source) { setResultEntries([]); return; }
    setResultEntries(await store.listWorkflowOcrResults(activeWorkflowId, source.id));
  };

  useEffect(() => {
    if (selectedNode?.type === 'text') void loadOutputResults(selectedNode.id);
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
    if (type in portDefaults) addNode(type, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  };

  const overallProgress = runProgress.total ? Math.min(1, (runProgress.completed + runProgress.current) / runProgress.total) : 0;
  const iconButton = 'inline-flex items-center gap-2 rounded-lg border border-app-gray-light bg-app-gray px-3 py-2 text-sm text-app-white hover:bg-app-gray-light disabled:opacity-50';

  return (
    <section className="flex h-full min-h-0 flex-col bg-app-black" aria-label="Workbench">
      <header className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-app-gray-light/40 bg-app-dark px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <WorkflowIcon className="h-5 w-5 text-app-accent" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-app-white">Workbench</h1>
            <select aria-label="Project workflow" className="mt-1 max-w-56 border-0 bg-transparent p-0 text-xs text-app-accent-dim focus:ring-0" value={activeWorkflowId ?? ''} onChange={(event) => {
              const next = projectWorkflows.find((item) => item.id === event.target.value);
              if (next) void selectWorkflow(next);
            }}>
              {projectWorkflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setNameInput(''); setDialog('new'); }} icon={<FilePlus2 className="h-4 w-4" />}>New</Button>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && <div className="flex w-40 items-center gap-2" aria-live="polite">
            <div role="progressbar" aria-label="Workflow progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overallProgress * 100)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-gray-light"><div className="h-full bg-app-accent transition-[width]" style={{ width: `${Math.round(overallProgress * 100)}%` }} /></div>
            <span className="w-9 text-right text-xs tabular-nums text-app-accent-dim">{Math.round(overallProgress * 100)}%</span>
          </div>}
          <Button onClick={runWorkflow} disabled={isRunning || loading || tab !== 'editor'} icon={<Play className="h-4 w-4" />}>{isRunning ? 'Running' : 'Run Workflow'}</Button>
        </div>
      </header>

      <nav className="flex flex-none gap-1 border-b border-app-gray-light/30 px-4" role="tablist" aria-label="Workbench views">
        <button role="tab" aria-selected={tab === 'editor'} className={`border-b-2 px-3 py-2 text-sm ${tab === 'editor' ? 'border-app-accent text-app-white' : 'border-transparent text-app-accent-dim'}`} onClick={() => setTab('editor')}>Editor</button>
        <button role="tab" aria-selected={tab === 'library'} className={`border-b-2 px-3 py-2 text-sm ${tab === 'library' ? 'border-app-accent text-app-white' : 'border-transparent text-app-accent-dim'}`} onClick={() => void openLibrary()}>Saved workflows</button>
      </nav>

      {error && <div role="alert" className="flex flex-none items-center justify-between gap-3 border-b border-red-500/30 bg-red-950/30 px-4 py-2 text-sm text-red-300"><span>{error}</span><button type="button" aria-label="Dismiss error" className="text-red-200" onClick={() => setError(null)}>×</button></div>}

      {tab === 'editor' ? (
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-52 flex-none flex-col border-r border-app-gray-light/40 bg-app-dark p-3" aria-label="Workflow nodes">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold uppercase tracking-widest text-app-accent-dim">Nodes</h2><button type="button" className="text-xs text-app-accent-dim hover:text-app-white" onClick={() => setDialog('save')} title="Save reusable workflow"><Save className="h-4 w-4" /></button></div>
            {(['Inputs', 'Transforms', 'Outputs'] as const).map((category) => {
              const types: NodeKind[] = category === 'Inputs' ? ['image'] : category === 'Transforms' ? ['ocr'] : ['text'];
              return <div key={category} className="mb-4">
                <h3 className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-app-accent-dim">{category}</h3>
                {types.map((type) => <button key={type} draggable onDragStart={(event) => dragStart(event, type)} onClick={() => addNode(type)} className="mb-1 flex w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-app-white hover:border-app-gray-light hover:bg-app-gray" aria-label={`Add ${portDefaults[type].title} node`}>
                  <span className="h-2 w-2 rounded-full bg-app-accent-dim" />{portDefaults[type].title}<span className="ml-auto text-xs text-app-accent-dim">+</span>
                </button>)}
              </div>;
            })}
            <div className="mt-auto border-t border-app-gray-light/30 pt-3 text-[11px] leading-relaxed text-app-accent-dim">Drag nodes onto the canvas, connect their ports, then run the workflow.</div>
          </aside>

          <div className="relative min-w-0 flex-1" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
            {loading ? <div className="flex h-full items-center justify-center text-sm text-app-accent-dim">Loading project workflow…</div> : (
              <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={handleConnect}
                onNodeClick={(_, node) => { setSelectedNodeId(node.id); if (node.type !== 'text') setResultEntries([]); }} onPaneClick={() => { setSelectedNodeId(null); setResultEntries([]); }} fitView minZoom={0.15} maxZoom={2} deleteKeyCode={['Backspace', 'Delete']} proOptions={{ hideAttribution: true }}>
                <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--app-gray-light)" />
                <Controls showInteractive={false} />
              </ReactFlow>
            )}
            {!loading && nodes.length === 0 && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="rounded-xl border border-dashed border-app-gray-light bg-app-black/70 px-6 py-5 text-center"><p className="text-sm font-medium text-app-white">Start with an image</p><p className="mt-1 text-xs text-app-accent-dim">Drag a node from the catalog or click + to add it.</p></div></div>}
          </div>

          <aside className="flex w-72 flex-none flex-col border-l border-app-gray-light/40 bg-app-dark" aria-label="Node inspector">
            <div className="border-b border-app-gray-light/30 px-4 py-3"><h2 className="text-xs font-semibold uppercase tracking-widest text-app-accent-dim">Inspector</h2><p className="mt-1 truncate text-sm font-medium text-app-white">{selectedNode ? portDefaults[selectedNode.type as NodeKind].title : 'Select a node'}</p>{runHistory[0] && <p className="mt-1 text-[10px] text-app-accent-dim">Last run: {runHistory[0].status} · started {runHistory[0].startedAt.toLocaleString()}{runHistory[0].finishedAt ? ` · finished ${runHistory[0].finishedAt.toLocaleString()}` : ''}</p>}</div>
            {!selectedNode ? <p className="p-4 text-sm text-app-accent-dim">Select a node on the canvas to view its settings or output.</p> : selectedNode.type === 'image' ? (
              <div className="space-y-4 p-4">
                <label className="block text-xs font-medium text-app-accent-dim">Project image
                  <select className="mt-2 w-full rounded-lg border border-app-gray-light bg-app-gray px-3 py-2 text-sm text-app-white" value={typeof selectedNode.data.settings.imageId === 'number' ? selectedNode.data.settings.imageId : ''} onChange={(event) => updateSettings(selectedNode.id, { ...selectedNode.data.settings, imageId: event.target.value ? Number(event.target.value) : null })}>
                    <option value="">Choose an image…</option>
                    {images.filter((image) => image.projectImageId !== undefined && !('hasImage' in image)).map((image) => <option key={image.projectImageId} value={image.projectImageId}>{image.file.name}</option>)}
                  </select>
                </label>
                {images.filter((image) => image.projectImageId !== undefined && !('hasImage' in image)).length === 0 && <p className="text-xs text-app-accent-dim">Import an image into this project to use it in a workflow.</p>}
              </div>
            ) : selectedNode.type === 'ocr' ? (
              <div className="space-y-4 p-4"><label className="block text-xs font-medium text-app-accent-dim">OCR language<select className="mt-2 w-full rounded-lg border border-app-gray-light bg-app-gray px-3 py-2 text-sm text-app-white" value={String(selectedNode.data.settings.language ?? 'eng')} onChange={(event) => updateSettings(selectedNode.id, { ...selectedNode.data.settings, language: event.target.value })}><option value="eng">English</option></select></label><p className="text-xs leading-relaxed text-app-accent-dim">OCR runs as one step in the connected workflow. Each run is saved to this project.</p></div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-xs text-app-accent-dim">Saved output history</p><span className="text-[10px] text-app-accent-dim">{resultEntries.length} entries</span></div>
                {resultEntries.length === 0 ? <p className="rounded-lg border border-dashed border-app-gray-light p-3 text-xs text-app-accent-dim">Run the connected workflow to create an output.</p> : <ul className="space-y-3">{resultEntries.map((result) => <li key={result.id ?? `${result.workflowRunId}-${result.processedAt.toISOString()}`} className="rounded-lg border border-app-gray-light/60 bg-app-gray/60 p-3">
                  <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-medium text-app-white">{result.imageName} <span className="text-app-accent-dim">· ID {result.imageId}</span></p><p className="mt-1 text-[10px] text-app-accent-dim">{result.processedAt.toLocaleString()}{result.confidence == null ? '' : ` · ${Math.round(result.confidence)}% confidence`}</p></div><button type="button" className="rounded p-1 text-app-accent-dim hover:text-app-white" aria-label="Copy extracted text" onClick={() => void navigator.clipboard.writeText(result.text).then(() => setNotice('Text copied to clipboard.')).catch(() => setError('Clipboard access is unavailable.'))}><Copy className="h-3.5 w-3.5" /></button></div>
                  <pre className="selectable-value mt-3 whitespace-pre-wrap break-words font-sans text-xs text-app-white">{result.text || 'No text could be extracted.'}</pre>
                </li>)}</ul>}
                {notice && <p className="mt-2 text-xs text-app-accent-dim" role="status">{notice}</p>}
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mx-auto max-w-5xl"><div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-lg font-semibold text-app-white">Saved workflows</h2><p className="mt-1 text-sm text-app-accent-dim">Reusable graphs stored on this machine.</p></div><button className={iconButton} onClick={() => void openLibrary()}><FolderOpen className="h-4 w-4" />Refresh</button></div>
            {templates.length === 0 ? <div className="rounded-xl border border-dashed border-app-gray-light px-6 py-12 text-center"><p className="text-sm text-app-white">No saved workflows yet</p><p className="mt-1 text-xs text-app-accent-dim">Use Save workflow in the editor to add one here.</p></div> : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{templates.map((template) => <li key={template.name}><button type="button" onDoubleClick={() => void openTemplate(template)} onKeyDown={(event) => { if (event.key === 'Enter') void openTemplate(template); }} className="group w-full rounded-xl border border-app-gray-light/50 bg-app-gray/50 p-4 text-left hover:border-app-accent/60 hover:bg-app-gray"><div className="flex items-center gap-3"><WorkflowIcon className="h-5 w-5 text-app-accent-dim group-hover:text-app-accent" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-app-white">{template.name}</span></div><p className="mt-3 text-xs text-app-accent-dim">Double-click to open in this project</p></button></li>)}</ul>}
          </div>
        </div>
      )}

      {dialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="workflow-name-title" className="w-full max-w-md rounded-xl border border-app-gray-light bg-app-gray p-5 shadow-2xl"><h2 id="workflow-name-title" className="text-base font-semibold text-app-white">{dialog === 'save' ? 'Save reusable workflow' : 'Create project workflow'}</h2><p className="mt-1 text-sm text-app-accent-dim">{dialog === 'save' ? 'This saves a portable copy in your machine-wide workflow library.' : 'Create a separate workflow in this project.'}</p><label className="mt-4 block text-xs font-medium text-app-accent-dim">Workflow name<input autoFocus value={nameInput} onChange={(event) => setNameInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void (dialog === 'save' ? saveTemplate() : createProjectWorkflow()); }} className="mt-2 w-full rounded-lg px-3 py-2 text-sm" maxLength={80} /></label><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={() => void (dialog === 'save' ? saveTemplate() : createProjectWorkflow())} disabled={!nameInput.trim()}>{dialog === 'save' ? 'Save workflow' : 'Create workflow'}</Button></div></div></div>}
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
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not create workflow.'); }
  }
};

const Workbench: React.FC<Props> = (props) => (
  <ReactFlowProvider><WorkbenchContent {...props} /></ReactFlowProvider>
);

export default Workbench;
