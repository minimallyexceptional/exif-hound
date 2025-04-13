import React, { useState } from 'react';
import { ImageData } from '../../../types';
import { History, Edit2, AlertTriangle, Check, Info, Filter } from 'lucide-react';
import { formatDateTime } from '../../../utils/date';
import { useProcessingData } from './hooks/useProcessingData';
import { useSoftwareList } from './hooks/useSoftwareList';
import { useFilteredData } from './hooks/useFilteredData';
import { useProcessingStats } from './hooks/useProcessingStats';
import StatsSidebar from '../StatsSidebar';

interface Props {
  images: ImageData[];
  showStats?: boolean;
}

interface ProcessedImageData {
  file: {
    name: string;
  };
  info: {
    software: string | null;
    originalDate: string | null;
    lastModified: string | null;
    hasBeenEdited: boolean;
    anomalies: string[];
  };
}

const SoftwareProcessingAnalysis: React.FC<Props> = ({ images, showStats = true }) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(showStats);
  const [selectedSoftware, setSelectedSoftware] = useState<Set<string>>(new Set());

  // Use our custom hooks
  const processingData = useProcessingData(images);
  const allSoftware = useSoftwareList(processingData);
  const filteredData = useFilteredData(processingData, selectedSoftware);
  const stats = useProcessingStats(filteredData);

  return (
    <div className="w-full h-full relative">
      {/* Main Content */}
      <div className={`h-full transition-[padding] duration-300 ${showStatsPanel ? 'pr-64' : ''}`}>
        <div className="p-4 h-full flex flex-col">
          {/* Controls */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-app-white">Processing Analysis</h3>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="p-2 rounded-lg bg-app-gray-light/20 hover:bg-app-gray-light/30 text-app-white transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter Software</span>
            </button>
          </div>

          {/* Results Table */}
          <div className="flex-1 glass-panel rounded-lg overflow-hidden">
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-app-gray-light/20">
                    <th className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-gray-dark">File Name</th>
                    <th className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-gray-dark">Software</th>
                    <th className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-gray-dark">Original Date</th>
                    <th className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-gray-dark">Last Modified</th>
                    <th className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-gray-dark">Status</th>
                    <th className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-gray-dark">Anomalies</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((data, index) => (
                    <tr key={index} className="border-b border-app-gray-light/10 hover:bg-app-gray-light/5">
                      <td className="p-3 text-sm text-app-white">{data.image.file.name}</td>
                      <td className="p-3 text-sm text-app-white">{data.info.software || '-'}</td>
                      <td className="p-3 text-sm text-app-white">
                        {data.info.originalDate ? formatDateTime(data.info.originalDate) : '-'}
                      </td>
                      <td className="p-3 text-sm text-app-white">
                        {data.info.lastModified ? formatDateTime(data.info.lastModified) : '-'}
                      </td>
                      <td className="p-3">
                        {data.info.hasBeenEdited ? (
                          <span className="inline-flex items-center gap-1 text-xs text-app-accent">
                            <Edit2 className="w-3 h-3" />
                            Edited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-app-accent-dim">
                            <Check className="w-3 h-3" />
                            Original
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {data.info.anomalies.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-app-accent">
                            <AlertTriangle className="w-3 h-3" />
                            {data.info.anomalies.length}
                          </span>
                        ) : (
                          <span className="text-xs text-app-accent-dim">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Sidebar */}
      <StatsSidebar isOpen={showStatsPanel} onToggle={() => setShowStatsPanel(!showStatsPanel)}>
        <div className="p-4">
          <h3 className="text-lg font-medium text-app-white mb-4">Processing Stats</h3>
          <div className="space-y-4">
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Total Images</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.total}</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Edit2 className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Edited Images</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.edited}</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">With Software Info</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.withSoftware}</p>
            </div>
            <div className="glass-panel p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">With Anomalies</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.withAnomalies}</p>
            </div>
          </div>
        </div>
      </StatsSidebar>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="absolute top-4 right-4 w-64 bg-app-gray-dark border border-app-gray-light rounded-lg shadow-lg z-20">
          <div className="p-3 border-b border-app-gray-light">
            <h3 className="text-sm font-medium text-app-white">Filter by Software</h3>
            <p className="text-xs text-app-accent-dim mt-1">
              {selectedSoftware.size === 0 ? 'Showing all software' : `${selectedSoftware.size} selected`}
            </p>
          </div>
          <div className="p-2">
            {allSoftware.map(software => (
              <label
                key={software}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-app-gray rounded cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedSoftware.has(software)}
                  onChange={(e) => {
                    const newSelection = new Set(selectedSoftware);
                    if (e.target.checked) {
                      newSelection.add(software);
                    } else {
                      newSelection.delete(software);
                    }
                    setSelectedSoftware(newSelection);
                  }}
                  className="rounded border-app-gray-light"
                />
                <span className="text-sm text-app-white group-hover:text-app-accent">{software}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

SoftwareProcessingAnalysis.defaultProps = {
  showStats: true
};

export default SoftwareProcessingAnalysis; 