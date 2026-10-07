import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './common/Button';
import Logomark from './common/Logomark';

interface SplashScreenProps {
  onStart: () => void;
}

// Start fully composed (no hidden pre-entrance state) when the OS prefers
// reduced motion, so nothing fades in for those users.
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * App entrypoint: full-bleed stage with the logomark on the left and the
 * "Start new investigation" action plus the (currently empty) recent
 * investigations region on the right. Entering the app hands off to the
 * existing upload flow; everything downstream is untouched by this surface.
 */
const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
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

      {/* Right — action + recent investigations */}
      <div
        data-testid="splash-actions"
        className={`flex-none lg:flex-1 flex items-center justify-center p-8 transition-all duration-700 ease-out ${
          showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="w-full max-w-md">
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="w-4 h-4" />}
            fullWidth
            onClick={onStart}
          >
            Start new investigation
          </Button>

          <h2 className="mt-10 mb-3 text-xs font-mono uppercase tracking-widest text-app-accent-dim">
            Recent investigations
          </h2>
          <div className="rounded-lg border border-dashed border-app-gray-light/50 px-4 py-8 text-center">
            <p className="font-mono text-xs text-app-accent-dim">
              No investigations yet — start your first above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
