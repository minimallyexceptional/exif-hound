import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const EvidenceFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="evidence" input="evidence">
    <div className="px-3 py-3 text-xs text-app-accent-dim">Select to inspect saved forensic evidence</div>
  </NodeFrame>
);

export default EvidenceFlowNode;
