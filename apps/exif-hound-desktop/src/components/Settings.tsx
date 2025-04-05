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
                      <div className="absolute inset-x-0 bottom-0">
                        <div className="bg-black/75 backdrop-blur-sm p-3">
                          <div className="relative z-10">
                            <p className="text-white font-medium text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                              {style.name}
                            </p>
                            {mapSettings.selectedStyle === style.id && (
                              <p className="text-white/80 text-xs text-center mt-1 font-medium">
                                Currently Selected
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="glass-panel rounded-lg p-6">
              <h2 className="text-xl font-semibold text-app-white mb-6">About</h2>
              <div className="space-y-4 text-app-accent-dim">
                <p>
                  Exif Hound Pro is a powerful tool for exploring and analyzing image metadata.
                  Built with privacy in mind, all processing happens locally in your browser.
                </p>
                <p>Version 2.5.0</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;