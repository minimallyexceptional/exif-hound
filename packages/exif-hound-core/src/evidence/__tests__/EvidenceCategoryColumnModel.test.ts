import { EvidenceCategoryColumnModel } from '../EvidenceCategoryColumnModel';

describe('EvidenceCategoryColumnModel', () => {
  const model = new EvidenceCategoryColumnModel();

  it('uses OCR-specific column labels', () => {
    expect(model.buildColumns('ocr-text').find((column) => column.id === 'value')?.label).toBe('Text');
    expect(model.buildColumns('emails').find((column) => column.id === 'value')?.label).toBe('Value');
  });

  it('adds provenance code column', () => {
    expect(model.buildColumns('provenance').some((column) => column.id === 'code')).toBe(true);
  });
});
