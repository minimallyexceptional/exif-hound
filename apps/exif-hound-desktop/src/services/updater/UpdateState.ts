/**
 * Update state machine.
 *
 * IDLE              — no update activity, app fully usable
 * CHECKING          — a check (silent or manual) is in flight
 * CURRENT           — a manual check confirmed the app is up to date
 * AVAILABLE         — an update was discovered, waiting for the user
 * DOWNLOADING       — the update artifact is downloading
 * READY_TO_INSTALL  — the update is downloaded (and signature-verified by
 *                     the Rust updater); waiting for the user to restart
 * INSTALLING        — the update is being installed
 * RESTARTING        — the app is relaunching into the new version
 * ERROR             — an update operation failed; the app keeps working
 *
 * Invalid transitions are rejected by `assertTransition` so state bugs are
 * caught loudly in tests instead of corrupting UI state in production.
 */

import { UpdateError } from './UpdateError';

export type UpdateStateName =
  | 'idle'
  | 'checking'
  | 'current'
  | 'available'
  | 'downloading'
  | 'ready-to-install'
  | 'installing'
  | 'restarting'
  | 'error';

export interface DownloadProgress {
  receivedBytes: number;
  /** Undefined until the server sends a content length. */
  totalBytes?: number;
}

export interface UpdateState {
  name: UpdateStateName;
  /** Info about the discovered update (available / downloading / ready). */
  update?: UpdateInfo;
  /** Download progress while DOWNLOADING. */
  progress?: DownloadProgress;
  /** Present only when state is ERROR. `visible` marks user-initiated failures. */
  error?: UpdateError;
  /** True when the failing operation was user-initiated (manual check etc). */
  errorVisible?: boolean;
}

export interface UpdateInfo {
  version: string;
  /** RFC 3339 publish date, when the manifest provided one. */
  date?: string;
  /** Release notes, when the manifest provided them. */
  notes?: string;
}

const IDLE: UpdateStateName[] = ['checking'];
const CHECKING: UpdateStateName[] = ['idle', 'current', 'available', 'error'];
const CURRENT: UpdateStateName[] = ['idle', 'checking'];
const AVAILABLE: UpdateStateName[] = ['idle', 'checking', 'downloading'];
const DOWNLOADING: UpdateStateName[] = ['ready-to-install', 'error'];
const READY_TO_INSTALL: UpdateStateName[] = ['idle', 'installing'];
const INSTALLING: UpdateStateName[] = ['idle', 'restarting', 'error'];
const RESTARTING: UpdateStateName[] = ['error'];
const ERROR: UpdateStateName[] = ['idle', 'checking'];

export const ALLOWED_TRANSITIONS: Record<UpdateStateName, UpdateStateName[]> = {
  idle: IDLE,
  checking: CHECKING,
  current: CURRENT,
  available: AVAILABLE,
  downloading: DOWNLOADING,
  'ready-to-install': READY_TO_INSTALL,
  installing: INSTALLING,
  restarting: RESTARTING,
  error: ERROR,
};

export function canTransition(from: UpdateStateName, to: UpdateStateName): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(from: UpdateStateName, to: UpdateStateName) {
    super(`Invalid update state transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export function assertTransition(from: UpdateStateName, to: UpdateStateName): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export const IDLE_STATE: UpdateState = { name: 'idle' };

export function errorState(error: UpdateError, visible: boolean): UpdateState {
  return { name: 'error', error, errorVisible: visible };
}
