import type { CandidateFamily } from 'image-forensics-middleware';
import type { NodeKind, WorkflowNode } from 'workbench-workflow';

export const WORKBENCH_PORT_DEFAULTS: Record<NodeKind, { title: string; settings: WorkflowNode['settings'] }> = {
  image: { title: 'Image', settings: { imageId: null } },
  'all-images': { title: 'All images', settings: { active: true } },
  ocr: { title: 'OCR', settings: { language: 'eng' } },
  provenance: { title: 'Image Provenance', settings: {} },
  'visual-identifiers': {
    title: 'Text & Identifiers',
    settings: {
      language: 'eng',
      enabledFamilies: 'email,url-domain,phone-like,coordinate-pair,license-plate-like',
      licensePlateProfile: 'us-general',
    },
  },
  text: { title: 'Text output', settings: {} },
  evidence: { title: 'Evidence Report', settings: {} },
};

export const IDENTIFIER_FAMILY_OPTIONS: Array<{ id: CandidateFamily; title: string }> = [
  { id: 'email', title: 'Email addresses' },
  { id: 'url-domain', title: 'URLs and domains' },
  { id: 'phone-like', title: 'Phone-like numbers' },
  { id: 'coordinate-pair', title: 'Coordinate pairs' },
  { id: 'license-plate-like', title: 'License plates' },
];

export const DEFAULT_IDENTIFIER_FAMILIES = 'email,url-domain,phone-like,coordinate-pair,license-plate-like';
