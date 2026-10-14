import React from 'react';
import type { NodeProps } from '@xyflow/react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';

const OcrFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => (
  <NodeFrame {...props} type="ocr" input="image" inputLabel="Image" outputs={[{ id: 'image', label: 'Image' }, { id: 'text', label: 'Text' }]} />
);

export default OcrFlowNode;
