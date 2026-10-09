import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const TextFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="text" input="text">
    <div className="px-3 py-3 text-xs text-app-accent-dim">Select to inspect saved OCR output</div>
  </NodeFrame>
);

export default TextFlowNode;
