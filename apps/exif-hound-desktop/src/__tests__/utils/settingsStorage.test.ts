import { readJsonStorage, writeJsonStorage } from '../../utils/settingsStorage';

describe('settingsStorage', () => {
  const key = 'testSettingsKey';

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when storage is empty', () => {
    const defaults = { reverseGeocoding: false };
    expect(readJsonStorage(key, defaults)).toEqual(defaults);
  });

  it('returns defaults when stored JSON is invalid', () => {
    localStorage.setItem(key, '{not-json');
    const defaults = { reverseGeocoding: false };
    expect(readJsonStorage(key, defaults)).toEqual(defaults);
  });

  it('merges valid stored object with defaults', () => {
    localStorage.setItem(key, JSON.stringify({ reverseGeocoding: true }));
    expect(readJsonStorage(key, { reverseGeocoding: false })).toEqual({
      reverseGeocoding: true,
    });
  });

  it('does not throw when setItem fails', () => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
    expect(() => writeJsonStorage(key, { reverseGeocoding: true })).not.toThrow();
    Storage.prototype.setItem = setItem;
  });
});
