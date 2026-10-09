import type { NodeContext, NodeHandler } from './runner';
import type { WorkflowGraph, WorkflowNode } from './workflow';
import type { OcrProvider } from 'ocr-middleware';

export interface ImageNodeInput {
  imageId: number;
  imageName: string;
  payload: unknown;
  sourceBytes: Uint8Array;
  processedBytes: Uint8Array;
  preprocessing: unknown;
}

export interface OcrNodeOutput {
  imageId: number;
  imageName: string;
  text: string;
  confidence: number | null;
  words: Array<{ text: string; confidence: number; boundingBox: { x: number; y: number; width: number; height: number } }>;
  provider: OcrProvider;
  engineVersion: string;
}

export function createImageNodeHandler(
  resolveImage: (imageId: number) => Promise<Omit<ImageNodeInput, 'sourceBytes' | 'processedBytes' | 'preprocessing'> & { sourceBytes: Uint8Array }> | Omit<ImageNodeInput, 'sourceBytes' | 'processedBytes' | 'preprocessing'> & { sourceBytes: Uint8Array },
  preprocess: (image: { imageId: number; imageName: string; sourceBytes: Uint8Array }, reportProgress: NodeContext['reportProgress']) => Promise<{ processedBytes: Uint8Array; manifest: unknown }>,
): NodeHandler {
  return async (node, context) => {
    const imageId = node.settings.imageId;
    if (typeof imageId !== 'number') throw new Error(`Choose a project image for ${node.id}.`);
    const image = await resolveImage(imageId);
    const prepared = await preprocess(image, context.reportProgress);
    return { data: { ...image, processedBytes: prepared.processedBytes, preprocessing: prepared.manifest } };
  };
}

export function createOcrNodeHandler(recognize: (
  image: ImageNodeInput,
  language: string,
  reportProgress: NodeContext['reportProgress'],
) => Promise<{ text: string; confidence: number | null; words?: OcrNodeOutput['words']; provider: OcrProvider; engineVersion: string }>): NodeHandler {
  return async (node, context) => {
    const image = context.inputs.get('image') as ImageNodeInput | undefined;
    if (!image) throw new Error('OCR needs a connected project image.');
    const result = await recognize(image, String(node.settings.language ?? 'eng'), context.reportProgress);
    const data: OcrNodeOutput = {
      imageId: image.imageId, imageName: image.imageName,
      text: result.text, confidence: result.confidence,
      words: result.words ?? [],
      provider: result.provider,
      engineVersion: result.engineVersion,
    };
    return { data, status: result.text.trim() ? 'success' : 'no-text' };
  };
}

export type ForensicNodeProcessor = (
  image: ImageNodeInput,
  settings: WorkflowNode['settings'],
  reportProgress: NodeContext['reportProgress'],
) => Promise<unknown>;

export function createImageProvenanceNodeHandler(analyze: ForensicNodeProcessor): NodeHandler {
  return createForensicNodeHandler(analyze, 'Image Provenance');
}

export function createVisualIdentifierNodeHandler(detect: ForensicNodeProcessor): NodeHandler {
  return createForensicNodeHandler(detect, 'Visual Text & Identifiers');
}

function createForensicNodeHandler(process: ForensicNodeProcessor, title: string): NodeHandler {
  return async (node, context) => {
    const image = context.inputs.get('image') as ImageNodeInput | undefined;
    if (!image) throw new Error(`${title} needs a connected project image.`);
    return { data: await process(image, node.settings, context.reportProgress) };
  };
}

export function getTextOutputSource(graph: WorkflowGraph, textNodeId: string): WorkflowNode | null {
  const edge = graph.edges.find((item) => item.target === textNodeId && item.targetPort === 'text');
  if (!edge) return null;
  const node = graph.nodes.find((item) => item.id === edge.source);
  return node?.type === 'ocr' ? node : null;
}

export function getEvidenceOutputSources(graph: WorkflowGraph, evidenceNodeId: string): WorkflowNode[] {
  return graph.edges
    .filter((edge) => edge.target === evidenceNodeId && edge.targetPort === 'evidence')
    .map((edge) => graph.nodes.find((node) => node.id === edge.source))
    .filter((node): node is WorkflowNode => node?.type === 'provenance' || node?.type === 'visual-identifiers');
}
