import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const OcrFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="ocr" input="image" output="text">
    <div className="px-3 py-3 text-xs text-app-accent-dim">Extract text from the connected image</div>
  </NodeFrame>
);

export default OcrFlowNode;
