const portColors: Record<string, string> = {
  image: 'var(--port-image)',
  text: 'var(--port-text)',
  evidence: 'var(--port-evidence)',
};

export function portEdgeStyle(portId: string): { stroke: string; strokeWidth: number } {
  return { stroke: portColors[portId] ?? 'var(--app-accent-dim)', strokeWidth: 2.5 };
}
