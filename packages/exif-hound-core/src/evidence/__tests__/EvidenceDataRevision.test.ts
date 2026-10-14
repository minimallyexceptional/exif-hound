import { EvidenceDataRevision } from '../EvidenceDataRevision';

describe('EvidenceDataRevision', () => {
  it('notifies subscribers when evidence data changes', () => {
    const revision = new EvidenceDataRevision();
    const seen: number[] = [];
    const unsubscribe = revision.subscribe(() => {
      seen.push(revision.getRevision());
    });

    revision.bump();
    revision.bump();
    unsubscribe();
    revision.bump();

    expect(seen).toEqual([1, 2]);
    expect(revision.getRevision()).toBe(3);
  });
});
