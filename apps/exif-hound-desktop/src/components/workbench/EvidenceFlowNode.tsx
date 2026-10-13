import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const EvidenceFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="evidence" input="evidence" inputLabel="Evidence" />
);

export default EvidenceFlowNode;
