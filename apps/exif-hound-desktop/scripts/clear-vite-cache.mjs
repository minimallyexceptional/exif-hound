import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const viteCache = path.join(root, '..', 'node_modules', '.vite');
fs.rmSync(viteCache, { recursive: true, force: true });
