import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const workspace = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
  cwd: workspace,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Unable to start Playwright: ${result.error.message}`);
  process.exitCode = 1;
} else if (result.signal) {
  console.error(`Playwright stopped by signal ${result.signal}`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
