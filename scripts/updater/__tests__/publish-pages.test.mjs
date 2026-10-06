import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const script = fileURLToPath(new URL('../publish-pages.mjs', import.meta.url));

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'exif-hound-pages-test-'));
  const repo = path.join(root, 'repo');
  const remote = path.join(root, 'origin.git');
  fs.mkdirSync(repo);
  git(root, 'init', '--bare', '--initial-branch=main', remote);
  git(repo, 'init', '--initial-branch=main');
  git(repo, 'config', 'user.name', 'Updater test');
  git(repo, 'config', 'user.email', 'updater-test@example.invalid');
  fs.mkdirSync(path.join(repo, 'update-site'));
  fs.writeFileSync(path.join(repo, 'update-site', 'index.html'), '<h1>Exif Hound</h1>');
  fs.writeFileSync(path.join(repo, 'update-site', '.nojekyll'), '');
  fs.writeFileSync(path.join(repo, 'README.md'), 'source repo');
  git(repo, 'add', '.');
  git(repo, 'commit', '-m', 'Initial source');
  git(repo, 'remote', 'add', 'origin', remote);
  git(repo, 'push', '-u', 'origin', 'main');
  return { root, repo, remote };
}

function publish(repo, channel, version) {
  const manifest = path.join(repo, `${channel}-manifest.json`);
  fs.writeFileSync(manifest, JSON.stringify({ version, platforms: { 'linux-x86_64': {} } }));
  execFileSync(process.execPath, [
    script,
    '--repo-root', repo,
    '--site-dir', path.join(repo, 'update-site'),
    '--channel', channel,
    '--manifest', manifest,
  ], { cwd: repo, stdio: 'pipe' });
}

function readPagesFile(remote, file) {
  const clone = `${remote}.clone`;
  execFileSync('git', ['clone', '--quiet', '--branch', 'gh-pages', remote, clone], { stdio: 'pipe' });
  try {
    return fs.readFileSync(path.join(clone, file), 'utf8');
  } finally {
    fs.rmSync(clone, { recursive: true, force: true });
  }
}

test('creates gh-pages and retains earlier channel manifests when publishing another channel', () => {
  const { root, repo, remote } = makeRepo();
  try {
    publish(repo, 'internal', '2.6.0-test.1');
    publish(repo, 'stable', '2.6.0');

    assert.equal(readPagesFile(remote, 'index.html'), '<h1>Exif Hound</h1>');
    assert.equal(readPagesFile(remote, '.nojekyll'), '');
    assert.equal(JSON.parse(readPagesFile(remote, 'stable/latest.json')).version, '2.6.0');
    assert.equal(JSON.parse(readPagesFile(remote, 'internal/latest.json')).version, '2.6.0-test.1');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
