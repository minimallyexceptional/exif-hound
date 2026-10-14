#!/usr/bin/env node
/**
 * Strips Cursor agent attribution lines from the commit message file.
 * Used by .husky/commit-msg so Co-authored-by / Made-with trailers are not kept.
 */
import fs from 'fs';

const msgFile = process.argv[2];
if (!msgFile) process.exit(0);

const stripPattern =
  /^(Co-authored-by:\s*Cursor\b|Made-with:\s*Cursor\b)/i;

const original = fs.readFileSync(msgFile, 'utf8');
const lines = original.split(/\n/);
const kept = lines.filter((line) => !stripPattern.test(line.trim()));

let next = kept.join('\n');
if (original.endsWith('\n') && !next.endsWith('\n')) {
  next += '\n';
}

if (next !== original) {
  fs.writeFileSync(msgFile, next);
}
