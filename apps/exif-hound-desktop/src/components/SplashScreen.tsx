import React, { useEffect, useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from './common/Button';
import Logomark from './common/Logomark';
import { RecentInvestigation } from '../utils/recentInvestigations';

interface SplashScreenProps {
  onStart: () => void;
  onOpen: () => void;
  onResume: (path: string) => void;
  recent?: RecentInvestigation[];
  /** Error surfaced by a failed open/resume; naming the problem. */
  error?: string | null;
}

// Start fully composed (no hidden pre-entrance state) when the OS prefers
// reduced motion, so nothing fades in for those users.
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function formatRelativeTime(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * App entrypoint: full-bleed stage with the logomark on the left and the
 * "Start new investigation" / "Open investigation…" actions plus the
 * resumable recent investigations list on the right. Entering the app hands
 * off to the existing flows; everything downstream is untouched here.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onOpen, onResume, recent = [], error }) => {
  const [reduceMotion] = useState(prefersReducedMotion);
  const [showActions, setShowActions] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const timer = setTimeout(() => setShowActions(true), 200);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div
      className="h-screen w-full bg-app-black flex flex-col justify-center lg:justify-stretch lg:flex-row overflow-hidden"
      aria-label="Exif Hound"
    >
      {/* Left — the logomark alone, centered */}
      <div className="relative flex-none lg:w-[45%] flex items-center justify-center p-8 pb-2 lg:pb-8">
        <div data-testid="splash-logomark">
          <Logomark className="w-52 h-52 lg:h-[70vh] lg:w-[70vh]" />
        </div>
        <div className="absolute bottom-6 left-6 font-mono text-xs text-app-accent-dim">
          v{__APP_VERSION__}
        </div>
      </div>

      {/* Hairline divider — desktop split only */}
      <div
        className="hidden lg:block w-px self-stretch my-24 bg-app-gray-light"
        aria-hidden="true"
      />

      {/* Right — actions + recent investigations */}
      <div
        data-testid="splash-actions"
        className={`flex-none lg:flex-1 flex items-center justify-center p-8 transition-all duration-700 ease-out ${
          showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="w-full max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={<Plus className="w-4 h-4" />}
              onClick={onStart}
            >
              Start new investigation
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={<FolderOpen className="w-4 h-4" />}
              onClick={onOpen}
            >
              Open investigation…
            </Button>
          </div>

          {error && (
            <div
              className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          <h2 className="mt-10 mb-3 text-xs font-mono uppercase tracking-widest text-app-accent-dim">
            Recent investigations
          </h2>

          {recent.length === 0 ? (
            <div className="rounded-lg border border-dashed border-app-gray-light/50 px-4 py-8 text-center">
              <p className="font-mono text-xs text-app-accent-dim">
                No investigations yet — start your first above
              </p>
            </div>
          ) : (
            <ul className="rounded-lg border border-app-gray-light/30 divide-y divide-app-gray-light/30 overflow-hidden">
              {recent.map((entry) => (
                <li key={entry.path}>
                  <button
                    type="button"
                    onClick={() => onResume(entry.path)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-app-gray-light/30 transition-colors duration-200 focus-visible:outline-none"
                    data-testid="recent-investigation-entry"
                  >
                    <span className="text-sm text-app-white truncate">{entry.name}</span>
                    <span className="text-xs font-mono text-app-accent-dim flex-shrink-0">
                      {formatRelativeTime(entry.lastOpenedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;