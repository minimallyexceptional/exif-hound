import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const ProvenanceFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="provenance" input="image" inputLabel="Image" outputs={[{ id: 'image', label: 'Image' }, { id: 'evidence', label: 'Evidence' }]} />
);

export default ProvenanceFlowNode;
