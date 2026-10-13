import type { Edge, Node } from '@xyflow/react';
import type { NodeKind, WorkflowGraph, WorkflowNode } from 'workbench-workflow';
import type { ImageData } from '../types/imageData';
import type { WorkbenchFlowData } from '../types/workbenchFlow';
import { portFromHandle, sourceHandleId, targetHandleId } from './flowHandles';
import { portEdgeStyle } from './portStyle';

export type WorkbenchCanvasNode = Node<WorkbenchFlowData, NodeKind>;

export class WorkbenchGraphMapper {
  static eligibleProjectImages(images: ImageData[]): ImageData[] {
    return images.filter((image) => image.projectImageId !== undefined && !('hasImage' in image));
  }

  static projectImageIds(images: ImageData[]): number[] {
    return WorkbenchGraphMapper.eligibleProjectImages(images).map((image) => image.projectImageId as number);
  }

  static async readImageBytes(image: ImageData): Promise<Uint8Array> {
    const file = image.file as unknown as Blob;
    if (typeof file.arrayBuffer !== 'function') {
      throw new Error('The selected project image bytes are unavailable.');
    }
    return new Uint8Array(await file.arrayBuffer());
  }

  static findProjectImage(images: ImageData[], imageId: number): ImageData | undefined {
    return images.find((item) => item.projectImageId === imageId && !('hasImage' in item));
  }

  toCanvas(
    graph: WorkflowGraph,
    images: ImageData[],
    states: Record<string, WorkbenchFlowData['state']> = {},
  ): { nodes: WorkbenchCanvasNode[]; edges: Edge[] } {
    return {
      nodes: graph.nodes.map((node) => {
        const imageId = node.settings.imageId;
        const image = node.type === 'image' && typeof imageId === 'number'
          ? WorkbenchGraphMapper.findProjectImage(images, imageId)
          : undefined;
        return {
          id: node.id,
          type: node.type,
          position: node.position,
          data: { settings: node.settings, image, state: states[node.id] ?? 'idle' },
        } as WorkbenchCanvasNode;
      }),
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: sourceHandleId(edge.sourcePort),
        target: edge.target,
        targetHandle: targetHandleId(edge.targetPort),
        animated: false,
        style: portEdgeStyle(edge.sourcePort),
      })),
    };
  }

  toGraph(id: string, name: string, nodes: WorkbenchCanvasNode[], edges: Edge[]): WorkflowGraph {
    return {
      formatVersion: 1,
      name,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type as NodeKind,
        position: { x: node.position.x, y: node.position.y },
        settings: { ...node.data.settings },
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourcePort: portFromHandle(edge.sourceHandle),
        target: edge.target,
        targetPort: portFromHandle(edge.targetHandle),
      })),
    };
  }

  attachImagesToNodes(nodes: WorkbenchCanvasNode[], images: ImageData[]): WorkbenchCanvasNode[] {
    return nodes.map((node) => {
      const imageId = node.data.settings.imageId;
      const image = node.type === 'image' && typeof imageId === 'number'
        ? WorkbenchGraphMapper.findProjectImage(images, imageId)
        : undefined;
      return node.data.image === image ? node : { ...node, data: { ...node.data, image } };
    });
  }
}

export function createWorkflowNodeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyWorkflowGraph(name: string): WorkflowGraph {
  return { formatVersion: 1, name, nodes: [] as WorkflowNode[], edges: [] };
}
