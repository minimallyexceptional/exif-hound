import React, { useState } from 'react';
import { Dog, Upload, Route as RouteIcon, List, Map as MapIcon, Download, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { Button } from './common/Button';
import ThemeToggle from './ThemeToggle';
import { Tooltip } from './common/Tooltip';
import { Panel } from './common/Panel';

interface Props {
  imagesCount: number;
  viewMode: 'map' | 'list';
  showRoute: boolean;
  onUpload: () => void;
  onExport: () => void;
  onToggleView: () => void;
  onToggleRoute: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<Props> = ({
  imagesCount,
  viewMode,
  showRoute,
  onUpload,
  onExport,
  onToggleView,
  onToggleRoute,
  onOpenSettings,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const MobileMenu = () => (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-app-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      <Panel className="absolute right-4 top-[4.5rem] w-64">
        <div className="p-4 space-y-4">
          <Button
            variant="primary"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => { onUpload(); setIsMobileMenuOpen(false); }}
            fullWidth
          >
            Upload
          </Button>

          {imagesCount > 0 && (
            <>
              <Button
                variant="secondary"
                icon={<Download className="w-4 h-4" />}
                onClick={() => { onExport(); setIsMobileMenuOpen(false); }}
                fullWidth
              >
                Export
              </Button>

              <Button
                variant="secondary"
                icon={viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
                onClick={() => { onToggleView(); setIsMobileMenuOpen(false); }}
                fullWidth
              >
                {viewMode === 'map' ? 'List View' : 'Map View'}
              </Button>

              <Button
                variant={showRoute ? 'primary' : 'secondary'}
                icon={<RouteIcon className="w-4 h-4" />}
                onClick={() => { onToggleRoute(); setIsMobileMenuOpen(false); }}
                fullWidth
              >
                Show Route
              </Button>
            </>
          )}

          <div className="border-t border-app-gray-light/30 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-white">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          <Button
            variant="ghost"
            icon={<SettingsIcon className="w-5 h-5" />}
            onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
            fullWidth
          >
            Settings
          </Button>
        </div>
      </Panel>
    </div>
  );

  return (
    <header className="flex-none bg-app-gray border-b border-app-gray-light/30 sticky top-0 z-50">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Dog className="w-7 h-7 text-app-white" />
            <div>
              <h1 className="text-xl font-bold text-app-white whitespace-nowrap">
                Exif Hound
              </h1>
              <p className="text-xs text-app-accent-dim hidden sm:block">
                Sniffing out your image metadata
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {/* Primary Actions */}
            <div className="flex items-center">
              <Button
                variant="primary"
                icon={<Upload className="w-4 h-4" />}
                onClick={onUpload}
              >
                Upload
              </Button>
            </div>

            {/* Secondary Actions */}
            {imagesCount > 0 && (
              <div className="flex items-center gap-2 border-l border-r border-app-gray-light/30 px-4">
                <Button
                  variant="secondary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={onExport}
                >
                  Export
                </Button>

                <Button
                  variant="secondary"
                  icon={viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
                  onClick={onToggleView}
                >
                  {viewMode === 'map' ? 'List View' : 'Map View'}
                </Button>

                <Button
                  variant={showRoute ? 'primary' : 'secondary'}
                  icon={<RouteIcon className="w-4 h-4" />}
                  onClick={onToggleRoute}
                >
                  Show Route
                </Button>
              </div>
            )}

            {/* System Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                icon={<SettingsIcon className="w-5 h-5" />}
                onClick={onOpenSettings}
                aria-label="Open settings"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
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
      {isMobileMenuOpen && <MobileMenu />}
    </header>
  );
}; 