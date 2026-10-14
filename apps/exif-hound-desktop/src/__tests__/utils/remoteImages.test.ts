import {
  allowRemoteHost,
  fetchRemoteImageBlob,
  isAllowedRemoteImageUrl,
  readAllowedRemoteHosts,
} from '../../utils/remoteImages';
import { fetchBytesViaRust } from '../../utils/rustNetwork';

jest.mock('../../utils/rustNetwork', () => ({
  fetchBytesViaRust: jest.fn(),
  syncRemoteImageHosts: jest.fn(),
}));

const mockFetchBytes = fetchBytesViaRust as jest.MockedFunction<typeof fetchBytesViaRust>;

describe('remoteImages', () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetchBytes.mockReset();
    mockFetchBytes.mockResolvedValue(new Uint8Array([0xff, 0xd8, 0xff]));
  });

  it('accepts HTTPS URLs only', () => {
    expect(isAllowedRemoteImageUrl('https://example.com/a.jpg')).toBe(true);
    expect(isAllowedRemoteImageUrl('http://example.com/a.jpg')).toBe(false);
    expect(isAllowedRemoteImageUrl('not-a-url')).toBe(false);
  });

  it('blocks fetch until the host is allowlisted', async () => {
    await expect(fetchRemoteImageBlob('https://example.com/a.jpg')).rejects.toThrow(/not enabled/);
    allowRemoteHost('example.com');
    expect(readAllowedRemoteHosts().has('example.com')).toBe(true);
    await expect(fetchRemoteImageBlob('https://example.com/a.jpg')).resolves.toBeInstanceOf(Blob);
    expect(mockFetchBytes).toHaveBeenCalledWith('fetch_remote_image_bytes', 'https://example.com/a.jpg');
  });
});
