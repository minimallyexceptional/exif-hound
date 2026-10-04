import React, { useEffect, useState } from 'react';
import { X, Moon, Sun, Map as MapIcon } from 'lucide-react';
import { getVersion } from '@tauri-apps/api/app';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { MAP_STYLES } from '../constants/mapStyles';
import { useUpdateControl } from './updater/useUpdateControl';
import { UpdateStateName, UpdateErrorCode } from '../services/updater';

interface Props {
  onClose: () => void;
}

/** Human-readable status line for the manual update check in About. */
function renderUpdateStatus(
  name: UpdateStateName,
  error?: { code: UpdateErrorCode; userMessage: string }
): string {
  switch (name) {
    case 'current':
      return "You're up to date.";
    case 'checking':
      return '';
    case 'available':
      return 'An update is available.';
    case 'downloading':
      return 'Downloading update…';
    case 'ready-to-install':
      return 'Update ready.';
    case 'installing':
      return 'Installing update…';
    case 'restarting':
      return 'Restarting…';
    case 'error':
      return error ? error.userMessage : 'Unable to check for updates.';
    default:
      return '';
  }
}

const Settings: React.FC<Props> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { mapSettings, updateMapSettings } = useSettings();
  const [appVersion, setAppVersion] = useState('…');
  const update = useUpdateControl();

  useEffect(() => {
    let cancelled = false;
    // Core app version, resolved at runtime from the Tauri config. Falls
    // back silently in browser/dev environments where the API is absent.
    getVersion()
      .then(version => {
        if (!cancelled) setAppVersion(version);
      })
      .catch(() => {
        if (!cancelled) setAppVersion('Unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-app-black">
      <div className="h-full w-full overflow-y-auto">
        <header className="sticky top-0 bg-app-gray shadow-inner-light z-10">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-app-white">Settings</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-app-gray-light rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <X className="w-6 h-6 text-app-white" />
            </button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <section className="glass-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold text-app-white mb-6">Appearance</h2>
              
              <div className="space-y-4">
                <p className="text-app-accent-dim mb-4">Choose your preferred theme</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={toggleTheme}
                    className={`p-4 rounded-lg border ${
                      theme === 'light'
                        ? 'border-app-white bg-app-gray-light'
                        : 'border-app-gray-light hover:border-app-gray-lighter'
                    } transition-colors`}
                  >
                    <Sun className="w-6 h-6 text-app-white mx-auto mb-2" />
                    <span className="block text-sm text-app-white">Light</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'border-app-white bg-app-gray-light'
                        : 'border-app-gray-light hover:border-app-gray-lighter'
                    } transition-colors`}
                  >
                    <Moon className="w-6 h-6 text-app-white mx-auto mb-2" />
                    <span className="block text-sm text-app-white">Dark</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <MapIcon className="w-6 h-6 text-app-white" />
                <h2 className="text-xl font-semibold text-app-white">Map Settings</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-app-accent-dim mb-4">Select your preferred map style</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MAP_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateMapSettings({ selectedStyle: style.id })}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        mapSettings.selectedStyle === style.id
                          ? 'border-app-white shadow-lg scale-[1.02]'
                          : 'border-app-gray-light hover:border-app-gray-lighter'
                      }`}
                    >
                      <img
                        src={style.preview}
                        alt={style.name}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 backdrop-blur-sm">
                        <p className="text-sm text-app-white text-center">{style.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <p className="text-app-accent-dim mb-4">Custom Tile Server</p>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.customTiles.enabled}
                      onChange={(e) => updateMapSettings({
                        customTiles: {
                          ...mapSettings.customTiles,
                          enabled: e.target.checked
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-app-gray-light rounded-full peer peer-checked:bg-app-accent peer-focus-visible:ring-2 peer-focus-visible:ring-app-accent-dim peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-app-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-app-white after:border after:border-app-gray-light after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:bg-app-black"></div>
                    <span className="ml-3 text-sm font-medium text-app-white">Use Custom Tiles</span>
                  </label>
                </div>
                
                <div className={mapSettings.customTiles.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
                  <input
                    type="text"
                    value={mapSettings.customTiles.url}
                    onChange={(e) => updateMapSettings({
                      customTiles: {
                        ...mapSettings.customTiles,
                        url: e.target.value
                      }
                    })}
                    placeholder="Enter tile server URL (e.g., https://{s}.tile.server.org/{z}/{x}/{y}.png)"
                    className="w-full px-4 py-2 bg-app-gray-dark text-app-white rounded-lg border border-app-gray-light focus:outline-none focus:border-app-accent"
                  />
                  <p className="mt-2 text-xs text-app-accent-dim">
                    Supports standard map tile URL format with {'{z}'}, {'{x}'}, {'{y}'} placeholders and optional {'{s}'} for subdomains
                  </p>
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold text-app-white mb-6">About</h2>
              <div className="space-y-4 text-app-accent-dim">
                <p>
                  Exif Hound is a powerful tool for exploring and analyzing image metadata.
                  Built with privacy in mind, all processing happens locally in your browser.
                </p>
                <p data-testid="app-version">Version {appVersion}</p>

                <div className="pt-2 border-t border-app-gray-light/30">
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={update.checkNow}
                      disabled={
                        update.state.name === 'checking' ||
                        update.state.name === 'downloading' ||
                        update.state.name === 'ready-to-install' ||
                        update.state.name === 'installing' ||
                        update.state.name === 'restarting'
                      }
                      className="px-4 py-2 bg-app-gray-dark text-app-white rounded-lg border border-app-gray-light hover:border-app-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {update.state.name === 'checking' ? 'Checking…' : 'Check for Updates'}
                    </button>
                    <span className="text-sm" data-testid="update-status" aria-live="polite">
                      {renderUpdateStatus(update.state.name, update.state.error)}
                    </span>
                  </div>
                  {update.state.name === 'available' && update.state.update && (
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-app-white">
                        Exif Hound {update.state.update.version} is available.
                      </span>
                      <button
                        onClick={update.download}
                        className="px-4 py-2 bg-app-white text-app-black rounded-lg hover:bg-app-accent transition-colors text-sm"
                      >
                        Download Update
                      </button>
                    </div>
                  )}
                  {update.state.name === 'downloading' && update.state.progress && (
                    <p className="text-sm mt-3" aria-live="polite">
                      Downloading…{' '}
                      {update.state.progress.totalBytes
                        ? `${Math.round((update.state.progress.receivedBytes / update.state.progress.totalBytes) * 100)}%`
                        : `${(update.state.progress.receivedBytes / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  )}
                  {update.state.name === 'ready-to-install' && update.state.update && (
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-app-white">
                        Exif Hound {update.state.update.version} is ready to install.
                      </span>
                      <button
                        onClick={update.restart}
                        className="px-4 py-2 bg-app-white text-app-black rounded-lg hover:bg-app-accent transition-colors text-sm"
                      >
                        Restart &amp; Update
                      </button>
                    </div>
                  )}
                  <p className="text-xs mt-4 text-app-accent-dim">
                    EXIF HOUND does not collect telemetry or analytics when checking for updates.
                    Update checks retrieve a static release manifest over HTTPS and do not transmit
                    investigation data, image metadata, filenames, usage information, or persistent
                    device identifiers.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
