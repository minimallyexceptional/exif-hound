import {
  canTransition,
  assertTransition,
  InvalidTransitionError,
  ALLOWED_TRANSITIONS,
  UpdateStateName,
} from '../UpdateState';

describe('UpdateState transitions', () => {
  it('allows the happy path', () => {
    expect(canTransition('idle', 'checking')).toBe(true);
    expect(canTransition('checking', 'available')).toBe(true);
    expect(canTransition('available', 'downloading')).toBe(true);
    expect(canTransition('downloading', 'ready-to-install')).toBe(true);
    expect(canTransition('ready-to-install', 'installing')).toBe(true);
    expect(canTransition('installing', 'restarting')).toBe(true);
  });

  it('allows check outcomes to fall back', () => {
    expect(canTransition('checking', 'idle')).toBe(true);
    expect(canTransition('checking', 'current')).toBe(true);
    expect(canTransition('checking', 'error')).toBe(true);
    expect(canTransition('downloading', 'error')).toBe(true);
    expect(canTransition('installing', 'error')).toBe(true);
    expect(canTransition('restarting', 'error')).toBe(true);
  });

  it('allows dismissing terminal informational states', () => {
    expect(canTransition('current', 'idle')).toBe(true);
    expect(canTransition('available', 'idle')).toBe(true);
    expect(canTransition('error', 'idle')).toBe(true);
  });

  it('allows restarting an automatic flow from a settled state', () => {
    expect(canTransition('idle', 'checking')).toBe(true);
    expect(canTransition('available', 'downloading')).toBe(true);
    expect(canTransition('ready-to-install', 'installing')).toBe(true);
  });

  it('rejects destructive or nonsensical transitions', () => {
    expect(canTransition('idle', 'downloading')).toBe(false);
    expect(canTransition('idle', 'installing')).toBe(false);
    expect(canTransition('current', 'downloading')).toBe(false);
    expect(canTransition('downloading', 'available')).toBe(false);
    expect(canTransition('restarting', 'idle')).toBe(false);
    expect(canTransition('installing', 'available')).toBe(false);
    expect(canTransition('ready-to-install', 'downloading')).toBe(false);
  });

  it('throws a descriptive error on invalid transitions', () => {
    expect(() => assertTransition('idle', 'installing')).toThrow(InvalidTransitionError);
    expect(() => assertTransition('idle', 'installing')).toThrow(
      'Invalid update state transition: idle -> installing'
    );
  });

  it('every state declares its transitions', () => {
    const states: UpdateStateName[] = [
      'idle',
      'checking',
      'current',
      'available',
      'downloading',
      'ready-to-install',
      'installing',
      'restarting',
      'error',
    ];
    for (const state of states) {
      expect(Array.isArray(ALLOWED_TRANSITIONS[state])).toBe(true);
    }
  });
});
