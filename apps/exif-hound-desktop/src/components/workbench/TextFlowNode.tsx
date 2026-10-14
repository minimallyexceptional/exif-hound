import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const TextFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="text" input="text" inputLabel="Text" />
);

export default TextFlowNode;
