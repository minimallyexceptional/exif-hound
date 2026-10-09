import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const ImageFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="image" output="image">
    <div className="p-2">
      {props.data.image ? (
        <>
          <div className="aspect-[16/10] overflow-hidden rounded-lg bg-app-black/40">
            <img src={props.data.image.url} alt={props.data.image.file.name} className="h-full w-full object-contain" draggable={false} />
          </div>
          <p className="mt-2 truncate px-1 text-xs text-app-accent-dim" title={props.data.image.file.name}>{props.data.image.file.name}</p>
        </>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-app-gray-light px-3 text-center text-xs text-app-accent-dim">
          Choose an image in the inspector
        </div>
      )}
    </div>
  </NodeFrame>
);

export default ImageFlowNode;
