import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const VisualIdentifiersFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="visual-identifiers" input="image" inputLabel="Image" outputs={[{ id: 'image', label: 'Image' }, { id: 'evidence', label: 'Evidence' }]} />
);

export default VisualIdentifiersFlowNode;
