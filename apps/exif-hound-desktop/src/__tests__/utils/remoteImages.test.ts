import {
  allowRemoteHost,
  fetchRemoteImageBlob,
  isAllowedRemoteImageUrl,
  readAllowedRemoteHosts,
} from '../../utils/remoteImages';

describe('remoteImages', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  it('accepts HTTPS URLs only', () => {
    expect(isAllowedRemoteImageUrl('https://example.com/a.jpg')).toBe(true);
    expect(isAllowedRemoteImageUrl('http://example.com/a.jpg')).toBe(false);
    expect(isAllowedRemoteImageUrl('not-a-url')).toBe(false);
  });

  it('blocks fetch until the host is allowlisted', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
    });
    await expect(fetchRemoteImageBlob('https://example.com/a.jpg')).rejects.toThrow(/not enabled/);
    allowRemoteHost('example.com');
    expect(readAllowedRemoteHosts().has('example.com')).toBe(true);
    await expect(fetchRemoteImageBlob('https://example.com/a.jpg')).resolves.toBeInstanceOf(Blob);
  });
});
