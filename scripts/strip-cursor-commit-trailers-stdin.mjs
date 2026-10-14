#!/usr/bin/env node
/** Read commit message on stdin; write stripped message on stdout (for git filter-branch). */
import fs from 'fs';

const stripPattern =
  /^(Co-authored-by:\s*Cursor\b|Made-with:\s*Cursor\b)/i;

const original = fs.readFileSync(0, 'utf8');
const lines = original.split(/\n/);
const kept = lines.filter((line) => !stripPattern.test(line.trim()));

let next = kept.join('\n');
if (original.endsWith('\n') && next.length > 0 && !next.endsWith('\n')) {
  next += '\n';
}

process.stdout.write(next);
