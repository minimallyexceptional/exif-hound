#!/usr/bin/env node
/**
 * Update the GitHub Pages branch with the static site and, optionally, one
 * generated channel manifest. Existing channel manifests are preserved.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    'repo-root': { type: 'string' },
    'site-dir': { type: 'string', default: 'update-site' },
    channel: { type: 'string' },
    manifest: { type: 'string' },
  },
});

const repoRoot = path.resolve(values['repo-root'] ?? process.env.GITHUB_WORKSPACE ?? process.cwd());
const siteDir = path.resolve(repoRoot, values['site-dir']);
const channel = values.channel;
const manifestPath = values.manifest ? path.resolve(repoRoot, values.manifest) : undefined;
const channels = ['stable', 'beta', 'internal'];

function git(args, cwd = repoRoot, allowedStatuses = []) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowedStatuses.includes(result.status)) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed (${result.status})`);
  }
  return result;
}

if (!await fs.stat(siteDir).then(stat => stat.isDirectory()).catch(() => false)) {
  throw new Error(`Static site directory does not exist: ${siteDir}`);
}
if (Boolean(channel) !== Boolean(manifestPath)) {
  throw new Error('Pass both --channel and --manifest when publishing a manifest.');
}
if (channel && !channels.includes(channel)) {
  throw new Error(`--channel must be one of: ${channels.join(', ')}`);
}
if (manifestPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (typeof manifest.version !== 'string' || !manifest.platforms || typeof manifest.platforms !== 'object') {
    throw new Error(`Invalid updater manifest: ${manifestPath}`);
  }
}

const branch = git(['ls-remote', '--exit-code', '--heads', 'origin', 'gh-pages'], repoRoot, [2]).status === 0;
if (branch) {
  git(['fetch', 'origin', '+refs/heads/gh-pages:refs/remotes/origin/gh-pages']);
}

const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'exif-hound-pages-'));
const worktree = path.join(tempDir, 'site');
try {
  if (branch) {
    git(['worktree', 'add', '--detach', worktree, 'refs/remotes/origin/gh-pages']);
    git(['checkout', '-B', 'gh-pages'], worktree);
  } else {
    git(['worktree', 'add', '--detach', worktree, 'HEAD']);
    git(['checkout', '--orphan', 'gh-pages'], worktree);
    git(['rm', '-rf', '.'], worktree);
  }

  for (const entry of await fs.readdir(siteDir)) {
    await fs.cp(path.join(siteDir, entry), path.join(worktree, entry), { recursive: true, force: true });
  }
  if (manifestPath) {
    const channelDir = path.join(worktree, channel);
    await fs.mkdir(channelDir, { recursive: true });
    await fs.copyFile(manifestPath, path.join(channelDir, 'latest.json'));
  }

  git(['config', 'user.name', 'github-actions[bot]'], worktree);
  git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], worktree);
  git(['add', '--all'], worktree);
  const changes = git(['diff', '--cached', '--quiet'], worktree, [1]);
  if (changes.status === 0) {
    process.stdout.write('GitHub Pages content is already up to date.\n');
  } else if (changes.status === 1) {
    git(['commit', '-m', manifestPath ? `Publish ${channel} update manifest` : 'Publish update site'], worktree);
    git(['push', 'origin', 'HEAD:refs/heads/gh-pages'], worktree);
    process.stdout.write(`Published GitHub Pages ${manifestPath ? `${channel} manifest` : 'site'}.\n`);
  } else {
    throw new Error('Unable to inspect staged GitHub Pages changes.');
  }
} finally {
  if (await fs.stat(worktree).then(() => true).catch(() => false)) {
    git(['worktree', 'remove', '--force', worktree]);
  }
  await fs.rm(tempDir, { recursive: true, force: true });
}
