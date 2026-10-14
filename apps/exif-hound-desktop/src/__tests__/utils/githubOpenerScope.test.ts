import { readFileSync } from 'fs';
import { join } from 'path';
import { GITHUB_REPOSITORY_URL, GITHUB_SPONSORS_URL } from '../../constants/github';

interface OpenerAllow {
  url?: string;
}

function openerAllowUrls(): string[] {
  const capabilities = JSON.parse(
    readFileSync(join(__dirname, '../../../src-tauri/capabilities/default.json'), 'utf8')
  ) as { permissions: Array<string | { identifier?: string; allow?: OpenerAllow[] }> };

  const opener = capabilities.permissions.find(
    (permission): permission is { identifier: string; allow: OpenerAllow[] } =>
      typeof permission === 'object' && permission.identifier === 'opener:allow-open-url'
  );

  return (opener?.allow ?? []).map(entry => entry.url).filter((url): url is string => Boolean(url));
}

describe('Tauri opener allowlist for GitHub links', () => {
  const urls = openerAllowUrls();

  it('allows the repository URL used by Star on GitHub', () => {
    expect(urls).toContain(GITHUB_REPOSITORY_URL);
    expect(urls).toContain(`${GITHUB_REPOSITORY_URL}/*`);
  });

  it('allows the GitHub Sponsors profile and any path under it', () => {
    expect(urls).toContain(GITHUB_SPONSORS_URL);
    expect(urls).toContain('https://github.com/sponsors/*');
  });
});
