import React, { useState } from 'react';
import { Upload, List, Map as MapIcon, Download, Settings as SettingsIcon, Menu, X, RefreshCw, Star, PanelsTopLeft, Shield } from 'lucide-react';
import { openExternalUrl } from '../utils/openExternalUrl';
import { Button } from './common/Button';
import { Panel } from './common/Panel';
import Logomark from './common/Logomark';
import { GITHUB_REPOSITORY_URL } from '../constants/github';
import { APP_DISPLAY_NAME } from '../constants/brand';

type ViewMode = 'map' | 'list' | 'workbench' | 'evidence';

interface Props {
  imagesCount: number;
  viewMode: ViewMode;
  onUpload: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
  onSetView: (view: ViewMode) => void;
  /** Manual update check from the mobile menu. */
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

  const handleStarOnGitHub = () => {
    void openExternalUrl(GITHUB_REPOSITORY_URL).catch((error: unknown) => {
      console.error(`Unable to open the ${APP_DISPLAY_NAME} GitHub repository:`, error);
    });
    setIsMobileMenuOpen(false);
  };

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

              <div className="border-t border-app-gray-light/30 pt-4" role="presentation" />

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

              <Button
                variant={viewMode === 'evidence' ? 'primary' : 'secondary'}
                icon={<Shield className="w-4 h-4" />}
                onClick={() => { onSetView('evidence'); setIsMobileMenuOpen(false); }}
                fullWidth
              >
                Evidence
              </Button>

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
                {APP_DISPLAY_NAME}
              </h1>
              <p className="text-xs text-app-accent-dim hidden sm:block">
                Tracking digital footprints in every image
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex min-w-0 flex-1 items-center justify-end gap-4 pl-8">
            <div
              className="flex items-center gap-2 rounded-lg border border-app-gray-light/40 bg-app-dark/50 p-1"
              role="group"
              aria-label="Import and export"
            >
              <Button
                variant="primary"
                icon={<Upload className="w-4 h-4" />}
                onClick={onUpload}
              >
                Import
              </Button>
              {imagesCount > 0 && (
                <Button
                  variant="secondary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={onExport}
                >
                  Export
                </Button>
              )}
            </div>

            <div className="w-5 shrink-0" aria-hidden="true" />

            <div className="flex items-center gap-2" role="group" aria-label="Views">
              {imagesCount > 0 && (
                <>
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
                </>
              )}

              <Button
                variant={viewMode === 'workbench' ? 'primary' : 'secondary'}
                icon={<PanelsTopLeft className="w-4 h-4" />}
                onClick={() => onSetView('workbench')}
              >
                Workbench
              </Button>

              <Button
                variant={viewMode === 'evidence' ? 'primary' : 'secondary'}
                icon={<Shield className="w-4 h-4" />}
                onClick={() => onSetView('evidence')}
              >
                Evidence
              </Button>
            </div>

            <Button
              variant="ghost"
              icon={<SettingsIcon className="w-5 h-5" />}
              onClick={onOpenSettings}
              aria-label="Open settings"
            />
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
