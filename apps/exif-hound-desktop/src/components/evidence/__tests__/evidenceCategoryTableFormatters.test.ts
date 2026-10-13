import {
  evidenceRowDisplayValue,
  formatEvidenceConfidence,
  formatEvidenceWhen,
} from '../../../services/evidence/evidenceTableFormatters';

describe('evidenceCategoryTableFormatters', () => {
  describe('formatEvidenceWhen', () => {
    it('returns em dash when date is null', () => {
      expect(formatEvidenceWhen(null)).toBe('—');
    });

    it('formats a valid date', () => {
      const formatted = formatEvidenceWhen(new Date('2026-06-15T14:30:00Z'));
      expect(formatted).not.toBe('—');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('formatEvidenceConfidence', () => {
    it('returns em dash for null and non-finite values', () => {
      expect(formatEvidenceConfidence(null)).toBe('—');
      expect(formatEvidenceConfidence(Number.NaN)).toBe('—');
      expect(formatEvidenceConfidence(Number.POSITIVE_INFINITY)).toBe('—');
    });

    it('rounds finite confidence to a percentage', () => {
      expect(formatEvidenceConfidence(88.4)).toBe('88%');
      expect(formatEvidenceConfidence(0)).toBe('0%');
    });
  });

  describe('evidenceRowDisplayValue', () => {
    it('formats identifier, ocr, gps, and provenance rows', () => {
      expect(evidenceRowDisplayValue({
        id: '1', kind: 'identifier', family: 'email', value: 'a@b.com', confidence: 90,
        imageId: 1, imageName: 'a.jpg', detectedAt: null, workflowId: null, workflowRunId: null,
      })).toBe('a@b.com');

      expect(evidenceRowDisplayValue({
        id: '2', kind: 'ocr', text: '  ', confidence: 50, resultStatus: 'success',
        imageId: 1, imageName: 'a.jpg', detectedAt: new Date(), workflowId: null, workflowRunId: null,
      })).toBe('(no text)');

      expect(evidenceRowDisplayValue({
        id: '3', kind: 'gps', latitude: 40.7128, longitude: -74.006, locationLabel: null,
        imageId: 1, imageName: 'a.jpg', detectedAt: null, workflowId: null, workflowRunId: null,
      })).toBe('40.712800, -74.006000');

      expect(evidenceRowDisplayValue({
        id: '4', kind: 'provenance', code: 'C1', message: 'msg', observedValue: null, severity: null,
        imageId: 1, imageName: 'a.jpg', detectedAt: null, workflowId: 'wf', workflowRunId: 'run',
      })).toBe('msg');

      expect(evidenceRowDisplayValue({
        id: '5', kind: 'provenance', code: 'C2', message: '', observedValue: 'obs', severity: 'low',
        imageId: 1, imageName: 'a.jpg', detectedAt: null, workflowId: 'wf', workflowRunId: 'run',
      })).toBe('obs');
    });
  });
});
