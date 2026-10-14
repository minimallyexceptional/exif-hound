const portColors: Record<string, string> = {
  image: 'var(--port-image)',
  text: 'var(--port-text)',
  evidence: 'var(--port-evidence)',
};

const handleSize = '!h-[18px] !w-[18px] !border-2 !border-app-gray';

const handleClasses: Record<string, string> = {
  image: `${handleSize} !bg-[var(--port-image)]`,
  text: `${handleSize} !bg-[var(--port-text)]`,
  evidence: `${handleSize} !bg-[var(--port-evidence)]`,
};

export function portColor(portId: string): string {
  return portColors[portId] ?? 'var(--app-accent)';
}

export function portHandleClass(portId: string): string {
  return handleClasses[portId] ?? `${handleSize} !bg-app-accent`;
}

export function portEdgeStyle(portId: string): { stroke: string; strokeWidth: number } {
  return { stroke: portColors[portId] ?? 'var(--app-accent-dim)', strokeWidth: 2.5 };
}
