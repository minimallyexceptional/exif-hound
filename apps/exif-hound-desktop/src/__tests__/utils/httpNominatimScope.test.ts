import { readFileSync } from 'fs';
import { join } from 'path';

const NOMINATIM_ORIGIN = 'https://nominatim.openstreetmap.org';

type HttpAllowEntry = string | { url?: string };

function httpDefaultAllowUrls(): string[] {
  const capabilities = JSON.parse(
    readFileSync(join(__dirname, '../../../src-tauri/capabilities/default.json'), 'utf8')
  ) as {
    permissions: Array<string | { identifier?: string; allow?: HttpAllowEntry[] }>;
  };

  const httpDefault = capabilities.permissions.find(
    (permission): permission is { identifier: string; allow: HttpAllowEntry[] } =>
      typeof permission === 'object' && permission.identifier === 'http:default'
  );

  return (httpDefault?.allow ?? []).map(entry =>
    typeof entry === 'string' ? entry : entry.url ?? ''
  );
}

describe('Tauri HTTP scope for Nominatim reverse geocoding', () => {
  it('allows Nominatim on http:default so the HTTP plugin can fetch place names', () => {
    const urls = httpDefaultAllowUrls();
    expect(urls.some(url => url.startsWith(NOMINATIM_ORIGIN))).toBe(true);
  });
});
