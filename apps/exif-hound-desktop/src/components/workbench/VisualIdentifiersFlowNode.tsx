import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const VisualIdentifiersFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="visual-identifiers" input="image" output="evidence">
    <div className="px-3 py-3 text-xs leading-relaxed text-app-accent-dim">Find visible text and local identifier-pattern candidates.</div>
  </NodeFrame>
);

export default VisualIdentifiersFlowNode;
