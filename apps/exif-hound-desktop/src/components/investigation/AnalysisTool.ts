/**
 * Identifiers for the deep-analysis tools reachable from the
 * Investigations dashboard. Kept as a separate module so the dashboard
 * components can reference tool ids without importing the tool
 * implementations.
 */
export type AnalysisTool = 'pattern' | 'geolocation' | 'timeline' | 'software' | null;
