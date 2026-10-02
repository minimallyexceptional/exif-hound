import React from 'react';
import { X, Moon, Sun, Map as MapIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { MAP_STYLES } from '../constants/mapStyles';

interface Props {
  onClose: () => void;
}

const Settings: React.FC<Props> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { mapSettings, updateMapSettings } = useSettings();

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
                    <div className="w-11 h-6 bg-app-gray-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-accent"></div>
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
                  {__APP_NAME__} is a powerful tool for exploring and analyzing image metadata.
                  Built with privacy in mind, all processing happens locally in your browser.
                </p>
                <p>Version 2.5.1</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;