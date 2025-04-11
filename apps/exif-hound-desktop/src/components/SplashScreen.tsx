import React, { useEffect, useState } from 'react';
import { Eye, BarChart, Search } from 'lucide-react';
import Logomark from './common/Logomark';

const SplashScreen: React.FC = () => {
  const [showSecondary, setShowSecondary] = useState(false);
  const [showTertiary, setShowTertiary] = useState(false);

  useEffect(() => {
    const secondaryTimer = setTimeout(() => setShowSecondary(true), 400);
    const tertiaryTimer = setTimeout(() => setShowTertiary(true), 800);

    return () => {
      clearTimeout(secondaryTimer);
      clearTimeout(tertiaryTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-app-black flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto px-4">
        {/* Logo container */}
        <div className="relative h-40 flex items-center justify-center mb-10">
          <Logomark 
            className={`w-24 h-24 z-10 transform transition-all duration-700 ease-out ${
              showSecondary ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-app-white rounded-full transform transition-all duration-1000 ${
            showSecondary ? 'scale-100 opacity-20' : 'scale-50 opacity-0'
          }`} />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-app-accent rounded-full transform transition-all duration-1000 delay-200 ${
            showSecondary ? 'scale-100 opacity-10' : 'scale-50 opacity-0'
          }`} />
        </div>
        
        {/* Title */}
        <div className={`text-center mb-14 transition-all duration-700 ease-out ${
          showSecondary ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <h1 className="text-3xl font-bold text-app-white mb-2">
            EXIF HOUND PRO
          </h1>
          <p className="text-app-accent-dim font-mono">
            INITIALIZING METADATA ANALYSIS...
          </p>
        </div>
        
        {/* Feature icons */}
        <div className={`grid grid-cols-3 gap-8 mb-16 transition-all duration-700 ease-out ${
          showTertiary ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-app-white" />
            <p className="text-sm text-app-accent-dim font-mono">DETECT</p>
          </div>
          <div className="text-center">
            <BarChart className="w-8 h-8 mx-auto mb-2 text-app-white" />
            <p className="text-sm text-app-accent-dim font-mono">ANALYZE</p>
          </div>
          <div className="text-center">
            <Search className="w-8 h-8 mx-auto mb-2 text-app-white" />
            <p className="text-sm text-app-accent-dim font-mono">SOLVE</p>
          </div>
        </div>
        
        {/* Progress bar with explicit spacing */}
        <div className={`w-48 h-1 mx-auto bg-app-gray rounded-full overflow-hidden transition-all duration-700 ${
          showTertiary ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="h-full bg-app-white rounded-full animate-progress" />
        </div>
        
        {/* Version */}
        <div className={`text-center mt-16 font-mono text-xs text-app-accent-dim transition-all duration-700 ${
          showTertiary ? 'opacity-100' : 'opacity-0'
        }`}>
          SYSTEM v2.5.0
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;