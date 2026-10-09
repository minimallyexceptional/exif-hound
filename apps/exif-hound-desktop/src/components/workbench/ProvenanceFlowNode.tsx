import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const ProvenanceFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="provenance" input="image" output="evidence">
    <div className="px-3 py-3 text-xs leading-relaxed text-app-accent-dim">Review metadata, timestamps, and local file-structure indicators.</div>
  </NodeFrame>
);

export default ProvenanceFlowNode;
