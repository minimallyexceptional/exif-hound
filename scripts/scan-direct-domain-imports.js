#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const scanRoot = path.join(repoRoot, 'apps/exif-hound-desktop/src');
const forbidden = [
  'investigation-archive',
  'workbench-workflow',
  'exif-middleware',
  'ocr-middleware',
  'image-processing-middleware',
  'image-forensics-middleware',
  'exifreader',
];
const pattern = new RegExp(
  `from\\s+['"](${forbidden.map((p) => p.replace(/-/g, '\\-')).join('|')})['"]`,
  'g',
);

const allowFiles = new Set([
  path.normalize('apps/exif-hound-desktop/src/core/archiveDbProvider.ts'),
]);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      yield* walk(full);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

let violations = 0;
for (const file of walk(scanRoot)) {
  const rel = path.relative(repoRoot, file);
  if (allowFiles.has(rel)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(pattern)) {
    console.error(`${rel}: forbidden import "${match[1]}"`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error(`scan-direct-domain-imports: ${violations} violation(s)`);
  process.exit(1);
}

console.log('scan-direct-domain-imports: OK');
