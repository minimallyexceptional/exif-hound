import React, { useEffect, useState } from 'react';
import { Upload, List, Map as MapIcon, Download, Settings as SettingsIcon, Menu, X, Search, CircleHelp, Info, RefreshCw, Star, PanelsTopLeft } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { isFeatureEnabled } from '../config/featureFlags';
import { Button } from './common/Button';
import ThemeToggle from './ThemeToggle';
import { Panel } from './common/Panel';
import Logomark from './common/Logomark';
import { isTauriEnvironment } from '../utils/fileSystem';
import { GITHUB_REPOSITORY_URL } from '../constants/github';

type ViewMode = 'map' | 'list' | 'investigation' | 'workbench';

interface Props {
  imagesCount: number;
  viewMode: ViewMode;
  onUpload: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
  onSetView: (view: ViewMode) => void;
  /** Manual update check (Help -> Check for Updates). */
  onCheckForUpdates: () => void;
}

export const AppHeader: React.FC<Props> = ({
  imagesCount,
  viewMode,
  onUpload,
  onExport,
  onOpenSettings,
  onSetView,
  onCheckForUpdates,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);

  const handleStarOnGitHub = () => {
    if (!isTauriEnvironment()) {
      window.open(GITHUB_REPOSITORY_URL, '_blank', 'noopener,noreferrer');
      setIsMobileMenuOpen(false);
      return;
    }

    void openUrl(GITHUB_REPOSITORY_URL).catch((error: unknown) => {
      console.error('Unable to open the Exif Hound GitHub repository:', error);
    });
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (!isHelpMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsHelpMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isHelpMenuOpen]);

  const mobileMenu = (
    <div data-testid="mobile-menu" className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 z-0 bg-app-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      <Panel className="absolute right-4 top-[4.5rem] w-64">
        <div className="p-4 space-y-4">
          <Button
            variant="primary"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => { onUpload(); setIsMobileMenuOpen(false); }}
            fullWidth
          >
            Import
          </Button>

          {(
            <>
              {imagesCount > 0 && (
                <Button
                  variant="secondary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => { onExport(); setIsMobileMenuOpen(false); }}
                  fullWidth
                >
                  Export
                </Button>
              )}

              {imagesCount > 0 && <>
                <Button
                  variant={viewMode === 'map' ? 'primary' : 'secondary'}
                  icon={<MapIcon className="w-4 h-4" />}
                  onClick={() => { onSetView('map'); setIsMobileMenuOpen(false); }}
                  fullWidth
                >
                  Map View
                </Button>

                <Button
                  variant={viewMode === 'list' ? 'primary' : 'secondary'}
                  icon={<List className="w-4 h-4" />}
                  onClick={() => { onSetView('list'); setIsMobileMenuOpen(false); }}
                  fullWidth
                >
                  List View
                </Button>
              </>}

              <Button
                variant={viewMode === 'workbench' ? 'primary' : 'secondary'}
                icon={<PanelsTopLeft className="w-4 h-4" />}
                onClick={() => { onSetView('workbench'); setIsMobileMenuOpen(false); }}
                fullWidth
              >
                Workbench
              </Button>
              
              {imagesCount > 0 && isFeatureEnabled('investigation') && (
                <Button
                  variant={viewMode === 'investigation' ? 'primary' : 'secondary'}
                  icon={<Search className="w-4 h-4" />}
                  onClick={() => { onSetView('investigation'); setIsMobileMenuOpen(false); }}
                  fullWidth
                >
                  Investigation
                </Button>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-app-white">Theme</span>
                <ThemeToggle />
              </div>

              <Button
                variant="ghost"
                icon={<SettingsIcon className="w-5 h-5" />}
                onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
                fullWidth
              >
                Settings
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            icon={<RefreshCw className="w-5 h-5" />}
            onClick={() => { onCheckForUpdates(); setIsMobileMenuOpen(false); }}
            fullWidth
          >
            Check for Updates
          </Button>
          <Button
            variant="ghost"
            icon={<Star className="w-5 h-5" />}
            onClick={handleStarOnGitHub}
            fullWidth
          >
            Star on GitHub
          </Button>
        </div>
      </Panel>
    </div>
  );

  return (
    <header className="flex-none bg-app-gray border-b border-app-gray-light/30 sticky top-0 z-[60]">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Logomark className="w-9 h-9" />
            <div>
              <h1 className="text-xl font-bold text-app-white whitespace-nowrap">
                Exif Hound
              </h1>
              <p className="text-xs text-app-accent-dim hidden sm:block">
                Tracking digital footprints in every image
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Primary Actions */}
            <div className="flex items-center">
              <Button
                variant="primary"
                icon={<Upload className="w-4 h-4" />}
                onClick={onUpload}
              >
                Import
              </Button>
            </div>

            {/* Secondary Actions */}
              <div className="flex items-center gap-2 border-l border-r border-app-gray-light/30 px-4">
                {imagesCount > 0 && (
                <Button
                  variant="secondary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={onExport}
                >
                  Export
                </Button>
                )}

                {imagesCount > 0 && <>
                  <Button
                    variant={viewMode === 'map' ? 'primary' : 'secondary'}
                    icon={<MapIcon className="w-4 h-4" />}
                    onClick={() => onSetView('map')}
                  >
                    Map View
                  </Button>

                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'secondary'}
                    icon={<List className="w-4 h-4" />}
                    onClick={() => onSetView('list')}
                  >
                    List View
                  </Button>
                </>}

                <Button
                  variant={viewMode === 'workbench' ? 'primary' : 'secondary'}
                  icon={<PanelsTopLeft className="w-4 h-4" />}
                  onClick={() => onSetView('workbench')}
                >
                  Workbench
                </Button>
                
                {imagesCount > 0 && isFeatureEnabled('investigation') && (
                  <Button
                    variant={viewMode === 'investigation' ? 'primary' : 'secondary'}
                    icon={<Search className="w-4 h-4" />}
                    onClick={() => onSetView('investigation')}
                  >
                    Investigation
                  </Button>
                )}
              </div>

            {/* System Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* Help menu: manual update check + About */}
              <div className="relative">
                <Button
                  variant="ghost"
                  icon={<CircleHelp className="w-5 h-5" />}
                  onClick={() => setIsHelpMenuOpen(prev => !prev)}
                  aria-label="Help menu"
                  aria-expanded={isHelpMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="help-menu"
                />
                {isHelpMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      aria-hidden="true"
                      onClick={() => setIsHelpMenuOpen(false)}
                    />
                    <Panel className="absolute right-0 top-11 z-50 w-56">
                      <div id="help-menu" role="menu" className="p-2 space-y-1">
                        <button
                          role="menuitem"
                          onClick={() => {
                            onCheckForUpdates();
                            setIsHelpMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-app-gray-light text-app-white text-sm transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Check for Updates
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => {
                            onOpenSettings();
                            setIsHelpMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-app-gray-light text-app-white text-sm transition-colors"
                        >
                          <Info className="w-4 h-4" />
                          About Exif Hound
                        </button>
                      </div>
                    </Panel>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                icon={<SettingsIcon className="w-5 h-5" />}
                onClick={onOpenSettings}
                aria-label="Open settings"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="relative z-[60] lg:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-app-white" />
              ) : (
                <Menu className="w-6 h-6 text-app-white" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && mobileMenu}
    </header>
  );
};
