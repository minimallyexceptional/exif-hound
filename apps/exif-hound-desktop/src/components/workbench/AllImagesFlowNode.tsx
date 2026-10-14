import React, { useContext } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Images } from 'lucide-react';
import type { WorkbenchFlowData } from './NodeFrame';
import { NodeFrame } from './NodeFrame';
import { WorkbenchEligibleImageCountContext } from './WorkbenchEligibleImageCountContext';

const AllImagesFlowNode: React.FC<NodeProps & { data: WorkbenchFlowData }> = (props) => {
  const count = useContext(WorkbenchEligibleImageCountContext);
  const active = props.data.settings.active !== false;
  return (
    <NodeFrame {...props} type="all-images" output="image">
      <div className="flex flex-col items-center gap-2 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-app-black/40 text-app-accent">
          <Images className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="text-center text-xs text-app-accent-dim">
          {active ? 'Runs once per project image' : 'Enable in the inspector to run'}
        </p>
        <span className="rounded-full bg-app-gray px-2 py-0.5 text-[11px] font-medium tabular-nums text-app-white">
          {count} {count === 1 ? 'image' : 'images'}
        </span>
      </div>
    </NodeFrame>
  );
};

export default AllImagesFlowNode;
