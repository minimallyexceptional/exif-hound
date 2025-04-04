import React from 'react';
import { ImageData } from '../types';
import { Search, Map, Calendar, Database } from 'lucide-react';

interface Props {
  images: ImageData[];
}

const Investigation: React.FC<Props> = ({ images }) => {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-app-white mb-2">Investigation Dashboard</h2>
        <p className="text-app-accent-dim">Analyze and correlate data from {images.length} images</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Analysis Cards */}
        <button className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-app-accent" />
            <h3 className="text-lg font-medium text-app-white">Pattern Analysis</h3>
          </div>
          <p className="text-sm text-app-accent-dim">
            Identify patterns and connections across image metadata
          </p>
        </button>

        <button className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10">
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-5 h-5 text-app-accent" />
            <h3 className="text-lg font-medium text-app-white">Geolocation Analysis</h3>
          </div>
          <p className="text-sm text-app-accent-dim">
            Map and analyze geographical data from images
          </p>
        </button>

        <button className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-app-accent" />
            <h3 className="text-lg font-medium text-app-white">Timeline Analysis</h3>
          </div>
          <p className="text-sm text-app-accent-dim">
            Visualize temporal relationships between images
          </p>
        </button>

        <button className="glass-panel p-4 rounded-lg text-left transition-colors hover:bg-app-gray-light/10">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-app-accent" />
            <h3 className="text-lg font-medium text-app-white">Metadata Analysis</h3>
          </div>
          <p className="text-sm text-app-accent-dim">
            Deep dive into image technical data and patterns
          </p>
        </button>
      </div>

      {images.length === 0 ? (
        <div className="glass-panel p-6 rounded-lg">
          <p className="text-center text-app-accent-dim">
            Upload images to begin your investigation
          </p>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-lg">
          <p className="text-center text-app-accent-dim">
            Select an analysis tool above to begin investigating your dataset
          </p>
        </div>
      )}
    </div>
  );
};

export default Investigation; 