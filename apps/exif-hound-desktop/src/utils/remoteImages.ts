/**
 * Opt-in loading for HTTPS remote image URLs from imported CSV/KML metadata.
 * Host allowlists are persisted in localStorage; images are never fetched until
 * the investigator explicitly loads them.
 */

import { fetchBytesViaRust, syncRemoteImageHosts } from './rustNetwork';

const ALLOWED_HOSTS_KEY = 'remoteImageAllowedHosts';

async function pushAllowedHostsToRust(): Promise<void> {
  await syncRemoteImageHosts([...readAllowedRemoteHosts()]);
}

export class RemoteImageUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoteImageUrlError';
  }
}

/** Returns true when the URL uses HTTPS and has a host. */
export function isAllowedRemoteImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export function remoteImageHost(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new RemoteImageUrlError('Only HTTPS image URLs are supported.');
  }
  return parsed.hostname.toLowerCase();
}

export function readAllowedRemoteHosts(): Set<string> {
  try {
    const raw = localStorage.getItem(ALLOWED_HOSTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((entry): entry is string => typeof entry === 'string'));
  } catch {
    return new Set();
  }
}

function writeAllowedRemoteHosts(hosts: Set<string>): void {
  localStorage.setItem(ALLOWED_HOSTS_KEY, JSON.stringify([...hosts].sort()));
}

export function isRemoteHostAllowed(host: string): boolean {
  return readAllowedRemoteHosts().has(host.toLowerCase());
}

export function allowRemoteHost(host: string): void {
  const normalized = host.toLowerCase();
  const hosts = readAllowedRemoteHosts();
  hosts.add(normalized);
  writeAllowedRemoteHosts(hosts);
  void pushAllowedHostsToRust();
}

export function revokeRemoteHost(host: string): void {
  const normalized = host.toLowerCase();
  const hosts = readAllowedRemoteHosts();
  hosts.delete(normalized);
  writeAllowedRemoteHosts(hosts);
  void pushAllowedHostsToRust();
}

export function allowRemoteHostsForUrls(urls: string[]): string[] {
  const hosts = readAllowedRemoteHosts();
  const added: string[] = [];
  for (const url of urls) {
    if (!isAllowedRemoteImageUrl(url)) continue;
    const host = remoteImageHost(url);
    if (!hosts.has(host)) {
      hosts.add(host);
      added.push(host);
    }
  }
  if (added.length > 0) {
    writeAllowedRemoteHosts(hosts);
    void pushAllowedHostsToRust();
  }
  return added;
}

export async function fetchRemoteImageBlob(url: string): Promise<Blob> {
  if (!isAllowedRemoteImageUrl(url)) {
    throw new RemoteImageUrlError('Remote images must use HTTPS URLs.');
  }
  const host = remoteImageHost(url);
  if (!isRemoteHostAllowed(host)) {
    throw new RemoteImageUrlError(`Loading images from ${host} is not enabled.`);
  }
  try {
    const bytes = await fetchBytesViaRust('fetch_remote_image_bytes', url);
    const blob = new Blob([Uint8Array.from(bytes)]);
    if (blob.type && !blob.type.startsWith('image/')) {
      throw new RemoteImageUrlError('The remote URL did not return an image.');
    }
    return blob;
  } catch (error) {
    if (error instanceof RemoteImageUrlError) throw error;
    throw new RemoteImageUrlError(
      error instanceof Error ? error.message : 'Could not load remote image.',
    );
  }
}
