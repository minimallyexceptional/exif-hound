import { normalizeWorkflowName, validateWorkflowName } from '../src/library';

describe('portable workflow names', () => {
  it('accepts Unicode and rejects names invalid on supported filesystems', () => {
    expect(validateWorkflowName('Field notes – café')).toBeNull();
    for (const name of ['', ' two ', '..', 'bad/name', 'CON.txt', 'trailing.', 'aux']) {
      expect(validateWorkflowName(name)).not.toBeNull();
    }
  });

  it('normalizes equivalent Unicode and case variants for collision checks', () => {
    expect(normalizeWorkflowName('Café')).toBe(normalizeWorkflowName('CAFE\u0301'));
  });
});
