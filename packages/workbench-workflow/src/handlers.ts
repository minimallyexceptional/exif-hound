import type { NodeContext, NodeHandler } from './runner';
import type { WorkflowGraph, WorkflowNode } from './workflow';

export interface ImageNodeInput {
  imageId: number;
  imageName: string;
  payload: unknown;
}

export interface OcrNodeOutput {
  imageId: number;
  imageName: string;
  text: string;
  confidence: number | null;
}

export function createImageNodeHandler(resolveImage: (imageId: number) => Promise<ImageNodeInput> | ImageNodeInput): NodeHandler {
  return async (node) => {
    const imageId = node.settings.imageId;
    if (typeof imageId !== 'number') throw new Error(`Choose a project image for ${node.id}.`);
    return { data: await resolveImage(imageId) };
  };
}

export function createOcrNodeHandler(recognize: (
  image: ImageNodeInput,
  language: string,
  reportProgress: NodeContext['reportProgress'],
) => Promise<{ text: string; confidence: number | null }>): NodeHandler {
  return async (node, context) => {
    const image = context.inputs.get('image') as ImageNodeInput | undefined;
    if (!image) throw new Error('OCR needs a connected project image.');
    const result = await recognize(image, String(node.settings.language ?? 'eng'), context.reportProgress);
    const data: OcrNodeOutput = {
      imageId: image.imageId, imageName: image.imageName,
      text: result.text, confidence: result.confidence,
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
