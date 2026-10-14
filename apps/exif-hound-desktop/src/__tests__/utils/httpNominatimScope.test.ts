import { readFileSync } from 'fs';
import { join } from 'path';

describe('Nominatim reverse geocoding network path', () => {
  it('uses a Rust command instead of the HTTP plugin allowlist', () => {
    const libRs = readFileSync(
      join(__dirname, '../../../src-tauri/src/lib.rs'),
      'utf8',
    );
    expect(libRs).toContain('fetch_nominatim_bytes');

    const capabilities = JSON.parse(
      readFileSync(join(__dirname, '../../../src-tauri/capabilities/default.json'), 'utf8'),
    ) as { permissions: unknown[] };

    const hasHttpPlugin = capabilities.permissions.some(
      permission =>
        typeof permission === 'object' &&
        permission !== null &&
        'identifier' in permission &&
        (permission as { identifier?: string }).identifier === 'http:default',
    );
    expect(hasHttpPlugin).toBe(false);
  });
});
