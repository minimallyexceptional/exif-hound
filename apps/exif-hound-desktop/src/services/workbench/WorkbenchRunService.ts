import type { ProjectStore, WorkflowRunRecord, WorkflowToolResultRecord } from 'investigation-archive';
import {
  createImageNodeHandler,
  createImageProvenanceNodeHandler,
  createOcrNodeHandler,
  createVisualIdentifierNodeHandler,
  type OcrNodeOutput,
  type RunEvent,
  type WorkflowGraph,
  WorkflowRunQueue,
  WorkflowRunner,
} from 'workbench-workflow';
import { ImageProvenanceAnalyzer, VisualIdentifierDetector } from 'image-forensics-middleware';
import { mapProcessedBoxToSource, type ImageProcessingManifest } from 'image-processing-middleware';
import type { OcrResult } from 'ocr-middleware';
import type { ImageData } from '../../types';
import type { WorkbenchFlowData } from '../../components/workbench/NodeFrame';
import { preprocessImage } from '../../utils/preprocessImage';
import { WorkbenchGraphMapper, createWorkflowNodeId } from './WorkbenchGraphMapper';
import { hasOcrBoundingBox } from './workbenchOcrHelpers';
import { VisualIdentifierSettingsResolver } from './VisualIdentifierSettingsResolver';
import { WorkbenchRunPlanner } from './WorkbenchRunPlanner';

export interface WorkbenchRunProgressSnapshot {
  completed: number;
  total: number;
  current: number;
  nodeId: string;
}

export interface WorkbenchRunNodePatch {
  state?: WorkbenchFlowData['state'];
  progress?: number;
  status?: string;
}

export interface WorkbenchRunListeners {
  onRunProgress: (progress: WorkbenchRunProgressSnapshot) => void;
  onRunState: (nodeId: string, state: WorkbenchFlowData['state']) => void;
  onNodePatch: (nodeId: string, patch: WorkbenchRunNodePatch) => void;
  onBatchProgress?: (index: number, total: number) => void;
}

export interface WorkbenchRunOutcome {
  batchSize: number;
  failedImageName?: string;
  error?: unknown;
}

export interface WorkbenchRunServiceOptions {
  store: ProjectStore;
  images: ImageData[];
  recognizeImage: (
    image: Blob,
    language: string,
    onProgress: (progress: number, status?: string) => void,
  ) => Promise<OcrResult>;
  runner?: WorkflowRunner;
  batchQueue?: WorkflowRunQueue;
  provenanceAnalyzer?: ImageProvenanceAnalyzer;
}

/** Executes Workbench workflows (single image or batch) and persists tool results. */
export class WorkbenchRunService {
  private readonly runner: WorkflowRunner;
  private readonly batchQueue: WorkflowRunQueue;
  private readonly provenanceAnalyzer: ImageProvenanceAnalyzer;
  private readonly planner = new WorkbenchRunPlanner();
  private readonly identifierSettings = new VisualIdentifierSettingsResolver();
  private readonly preparedPackets = new Map<number, Awaited<ReturnType<typeof preprocessImage>>>();
  private stepStartedAt: Record<string, Date> = {};
  private runProgress: WorkbenchRunProgressSnapshot = { completed: 0, total: 0, current: 0, nodeId: '' };

  constructor(private readonly options: WorkbenchRunServiceOptions) {
    this.runner = options.runner ?? new WorkflowRunner();
    this.batchQueue = options.batchQueue ?? new WorkflowRunQueue();
    this.provenanceAnalyzer = options.provenanceAnalyzer ?? new ImageProvenanceAnalyzer();
  }

  get isBatchProcessing(): boolean {
    return this.batchQueue.isProcessing;
  }

  async execute(
    workflowId: string,
    graph: WorkflowGraph,
    projectImageIds: number[],
    listeners: WorkbenchRunListeners,
  ): Promise<WorkbenchRunOutcome> {
    const { jobs: batchJobs } = this.planner.planBatchJobs(graph, projectImageIds);
    let failedImageName: string | undefined;

    try {
      if (!batchJobs.length) {
        await this.runGraphOnce(workflowId, graph, listeners);
      } else {
        this.batchQueue.enqueue(batchJobs);
        let completedImages = 0;
        await this.batchQueue.process(async (job) => {
          const image = WorkbenchGraphMapper.findProjectImage(this.options.images, job.imageId);
          failedImageName = image?.file.name ?? `Image ${job.imageId}`;
          listeners.onBatchProgress?.(completedImages + 1, batchJobs.length);
          this.preparedPackets.clear();
          await this.runGraphOnce(workflowId, job.graph, listeners);
          completedImages += 1;
        });
      }
      return { batchSize: batchJobs.length };
    } catch (error) {
      return { batchSize: batchJobs.length, failedImageName, error };
    } finally {
      this.preparedPackets.clear();
    }
  }

  private async runGraphOnce(
    workflowId: string,
    graph: WorkflowGraph,
    listeners: WorkbenchRunListeners,
  ): Promise<void> {
    const total = this.planner.countPipelineNodes(graph);
    const runId = createWorkflowNodeId();
    const startedAt = new Date();
    const run: WorkflowRunRecord = {
      id: runId,
      workflowId,
      status: 'running',
      startedAt,
      finishedAt: null,
      currentNodeId: null,
      completedNodes: 0,
      totalNodes: total,
      error: null,
    };
    this.stepStartedAt = {};
    this.runProgress = { completed: 0, total, current: 0, nodeId: '' };
    listeners.onRunProgress(this.runProgress);
    await this.options.store.createWorkflowRun(run);

    try {
      await this.runner.run(graph, {
        handlers: {
          image: createImageNodeHandler(
            async (imageId) => {
              const image = WorkbenchGraphMapper.findProjectImage(this.options.images, imageId);
              if (!image || image.projectImageId === undefined) {
                throw new Error('The selected project image is unavailable.');
              }
              return {
                imageId,
                imageName: image.file.name,
                payload: image,
                sourceBytes: await WorkbenchGraphMapper.readImageBytes(image),
              };
            },
            async (image, reportProgress) => {
              let packet = this.preparedPackets.get(image.imageId);
              if (!packet) {
                packet = await preprocessImage(image.imageId, image.imageName, image.sourceBytes, reportProgress);
                this.preparedPackets.set(image.imageId, packet);
              }
              return { processedBytes: packet.processedBytes, manifest: packet.manifest };
            },
          ),
          ocr: createOcrNodeHandler(async (imageInput, language, reportProgress) => {
            const recognized = await this.options.recognizeImage(
              new Blob([imageInput.processedBytes.slice().buffer as ArrayBuffer], { type: 'image/png' }),
              language,
              (progress, status) => {
                this.runProgress = { ...this.runProgress, current: progress };
                listeners.onRunProgress(this.runProgress);
                reportProgress(progress, status);
              },
            );
            const manifest = imageInput.preprocessing as ImageProcessingManifest;
            return {
              ...recognized,
              words: recognized.words.filter(hasOcrBoundingBox).map((word) => ({
                ...word,
                boundingBox: mapProcessedBoxToSource(
                  word.boundingBox,
                  manifest.processedWidth,
                  manifest.processedHeight,
                  manifest.sourceWidth,
                  manifest.sourceHeight,
                  manifest.processedToSource,
                ),
              })),
            };
          }),
          provenance: createImageProvenanceNodeHandler(async (imageInput, _settings, reportProgress) => {
            const image = imageInput.payload as ImageData;
            reportProgress(0.1, 'Reading local image metadata');
            const result = await this.provenanceAnalyzer.analyze({
              imageId: imageInput.imageId,
              imageName: imageInput.imageName,
              bytes: imageInput.sourceBytes,
              metadata: image.exif as Record<string, unknown>,
            });
            reportProgress(1, 'Provenance indicators ready');
            return result;
          }),
          'visual-identifiers': createVisualIdentifierNodeHandler(async (imageInput, settings, reportProgress) => {
            const bytes = imageInput.processedBytes;
            const resolved = this.identifierSettings.resolve(settings);
            const detector = new VisualIdentifierDetector({
              recognize: async (localBytes, detectOptions) => {
                const recognized = await this.options.recognizeImage(
                  new Blob([localBytes.slice().buffer as ArrayBuffer], { type: 'image/png' }),
                  String(detectOptions?.languages ?? 'eng'),
                  (progress, status) => {
                    this.runProgress = { ...this.runProgress, current: progress };
                    listeners.onRunProgress(this.runProgress);
                    detectOptions?.onProgress?.({ progress, status: status ?? '' });
                  },
                );
                return { ...recognized, words: recognized.words ?? [] };
              },
            });
            const result = await detector.detect({
              imageId: imageInput.imageId,
              imageName: imageInput.imageName,
              bytes,
              settings: {
                language: resolved.language,
                enabledFamilies: resolved.enabledFamilies,
                licensePlateProfile: resolved.licensePlateProfile,
              },
            }, reportProgress);
            const manifest = imageInput.preprocessing as ImageProcessingManifest;
            const sourceBox = (box: { x: number; y: number; width: number; height: number }) => {
              const values = [
                box?.x, box?.y, box?.width, box?.height,
                manifest?.processedWidth, manifest?.processedHeight,
                manifest?.sourceWidth, manifest?.sourceHeight,
              ];
              if (!values.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)) {
                return { x: 0, y: 0, width: 0, height: 0 };
              }
              const mapped = mapProcessedBoxToSource(
                box,
                manifest.processedWidth,
                manifest.processedHeight,
                manifest.sourceWidth,
                manifest.sourceHeight,
                manifest.processedToSource,
              );
              if (![mapped.x, mapped.y, mapped.width, mapped.height].every((value) => Number.isFinite(value))) {
                return { x: 0, y: 0, width: 0, height: 0 };
              }
              return mapped;
            };
            return {
              ...result,
              words: result.words.map((word) => ({ ...word, boundingBox: sourceBox(word.boundingBox) })),
              candidates: result.candidates.map((candidate) => ({
                ...candidate,
                boundingBox: sourceBox(candidate.boundingBox),
              })),
            };
          }),
        },
        persistResult: async (node, result) => {
          const finishedAt = new Date();
          if (node.type === 'ocr') {
            const value = result.data as OcrNodeOutput;
            const packet = this.preparedPackets.get(value.imageId);
            await this.options.store.appendWorkflowOcrResult({
              ...value,
              processedAt: finishedAt,
              resultStatus: value.text.trim() ? 'success' : 'no-text',
              workflowId,
              workflowRunId: runId,
              nodeId: node.id,
              preprocessingManifest: packet?.manifest,
            });
            return;
          }
          if (node.type !== 'provenance' && node.type !== 'visual-identifiers') return;
          const value = result.data as { imageId: number; imageName: string; toolVersion: string };
          const packet = this.preparedPackets.get(value.imageId);
          const record: WorkflowToolResultRecord = {
            imageId: value.imageId,
            imageName: value.imageName,
            result: result.data,
            resultStatus: 'success',
            workflowId,
            workflowRunId: runId,
            nodeId: node.id,
            toolVersion: value.toolVersion,
            startedAt: this.stepStartedAt[node.id] ?? startedAt,
            finishedAt,
            preprocessingManifest: packet?.manifest,
          };
          if (node.type === 'provenance') await this.options.store.appendWorkflowProvenanceResult(record);
          else await this.options.store.appendWorkflowIdentifierResult(record);
        },
        persistFailure: async (node, errorMessage) => {
          if (node.type !== 'provenance' && node.type !== 'visual-identifiers') return;
          const imageEdge = graph.edges.find((edge) => edge.target === node.id && edge.targetPort === 'image');
          const imageNode = imageEdge && graph.nodes.find((candidate) => candidate.id === imageEdge.source);
          const imageId = imageNode?.settings.imageId;
          const image = typeof imageId === 'number'
            ? WorkbenchGraphMapper.findProjectImage(this.options.images, imageId)
            : undefined;
          if (!image || image.projectImageId === undefined) return;
          const packet = this.preparedPackets.get(image.projectImageId);
          const record: WorkflowToolResultRecord = {
            imageId: image.projectImageId,
            imageName: image.file.name,
            result: {},
            resultStatus: 'failed',
            workflowId,
            workflowRunId: runId,
            nodeId: node.id,
            toolVersion: '1.0.0',
            startedAt: this.stepStartedAt[node.id] ?? new Date(),
            finishedAt: new Date(),
            error: errorMessage,
            preprocessingManifest: packet?.manifest,
          };
          if (node.type === 'provenance') await this.options.store.appendWorkflowProvenanceResult(record);
          else await this.options.store.appendWorkflowIdentifierResult(record);
        },
        onEvent: async (event: RunEvent) => {
          if (event.type === 'node-started') {
            this.stepStartedAt[event.nodeId] = new Date();
            this.runProgress = { completed: event.completed, total: event.total, current: 0, nodeId: event.nodeId };
            listeners.onRunProgress(this.runProgress);
            listeners.onRunState(event.nodeId, 'running');
            await this.options.store.updateWorkflowRun({ ...run, currentNodeId: event.nodeId, completedNodes: event.completed });
          } else if (event.type === 'node-completed') {
            listeners.onRunState(event.nodeId, 'completed');
            this.runProgress = { completed: event.completed, total: event.total, current: 0, nodeId: '' };
            listeners.onRunProgress(this.runProgress);
            await this.options.store.updateWorkflowRun({ ...run, currentNodeId: null, completedNodes: event.completed });
          } else if (event.type === 'node-progress') {
            this.runProgress = { ...this.runProgress, nodeId: event.nodeId, current: event.progress };
            listeners.onRunProgress(this.runProgress);
            listeners.onNodePatch(event.nodeId, {
              state: 'running',
              progress: event.progress,
              status: event.status,
            });
          } else if (event.type === 'failed') {
            listeners.onRunState(event.nodeId, 'failed');
            listeners.onNodePatch(event.nodeId, { state: 'failed', status: event.error });
            this.runProgress = { completed: event.completed, total: event.total, current: 0, nodeId: event.nodeId };
            listeners.onRunProgress(this.runProgress);
          }
        },
      });
      await this.options.store.updateWorkflowRun({
        ...run,
        status: 'completed',
        finishedAt: new Date(),
        completedNodes: total,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      await this.options.store.updateWorkflowRun({
        ...run,
        status: 'failed',
        finishedAt: new Date(),
        currentNodeId: this.runProgress.nodeId || null,
        completedNodes: this.runProgress.completed,
        error: message,
      });
      throw cause;
    }
  }
}
