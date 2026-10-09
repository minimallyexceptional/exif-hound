import React, { useState, useMemo } from 'react';
import { ImageData } from '../../../types';
import { History, Edit2, AlertTriangle, Check, Info, Filter } from 'lucide-react';
import { formatDateTime } from '../../../utils/date';
import { useProcessingData } from './hooks/useProcessingData';
import { useSoftwareList } from './hooks/useSoftwareList';
import { useFilteredData } from './hooks/useFilteredData';
import { useProcessingStats } from './hooks/useProcessingStats';
import StatsSidebar from '../StatsSidebar';
import FilterPanel from '../../common/FilterPanel';

interface Props {
  images: ImageData[];
  showStats?: boolean;
}

const SoftwareProcessingAnalysis: React.FC<Props> = ({ images, showStats = true }) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(showStats);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>({
    software: new Set()
  });

  // Use our custom hooks
  const processingData = useProcessingData(images);
  const allSoftware = useSoftwareList(processingData);
  
  // Get selected software from our filters object
  const selectedSoftware = selectedFilters.software || new Set();
  
  const filteredData = useFilteredData(processingData, selectedSoftware);
  const stats = useProcessingStats(filteredData);

  // Determine if filters are active
  const hasActiveFilters = selectedSoftware.size > 0;
  const hasNoData = filteredData.length === 0;

  // Create filter configuration for our reusable component
  const filterGroups = useMemo(() => [
    {
      id: 'software',
      title: 'Software',
      showCount: true,
      icon: <History className="w-4 h-4" />,
      options: allSoftware.map(software => ({
        id: software,
        label: software
      }))
    }
  ], [allSoftware]);

  // Handle filter changes
  const handleFilterChange = (groupId: string, selectedOptions: Set<string>) => {
    setSelectedFilters(prev => ({
      ...prev,
      [groupId]: selectedOptions
    }));
  };

  // Handle reset all filters
  const handleResetAll = () => {
    setSelectedFilters({
      software: new Set()
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Main Content */}
      <div className={`h-full ${showStatsPanel ? 'pr-64' : ''} ${showFilterPanel ? 'pr-64' : ''}`}>
        <div className="p-4 h-full flex flex-col overflow-hidden">
          {/* Controls */}
          {/* Filter Toggle Button */}
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              aria-expanded={showFilterPanel}
              className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 z-20 
                ${
                  hasActiveFilters 
                    ? 'glass-panel border border-app-accent/50' 
                    : 'glass-panel'
                }
              `}
            >
              <Filter className={`w-4 h-4 ${
                hasActiveFilters 
                  ? 'text-app-accent' 
                  : 'text-app-accent-dim'
              }`} />
              <span className="text-sm font-medium text-app-white">
                Filter
              </span>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 text-xs rounded-full font-medium bg-app-accent text-app-black">
                  {filteredData.length}
                </span>
              )}
            </button>
          </div>

          {/* Results Table or Empty State */}
          {hasNoData ? (
            <div className="flex-1 glass-panel rounded-lg flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <Filter className="w-16 h-16 text-app-accent mx-auto mb-4" />
                <h3 className="text-xl font-medium text-app-white mb-2">
                  No Results Match Your Filters
                </h3>
                <p className="text-sm text-app-accent-dim mb-6">
                  No images match your current filter selections. Try adjusting your filters or resetting them to see all images.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleResetAll}
                    className="px-4 py-2 rounded-md bg-app-accent text-app-black font-medium transition-colors hover:bg-app-accent-dim"
                  >
                    Show All Software
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(true)}
                    className="px-4 py-2 rounded-md bg-app-gray-light hover:bg-app-gray-lighter text-app-white font-medium transition-colors"
                  >
                    Open Filters
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 glass-panel rounded-lg overflow-hidden">
              <div className="h-full overflow-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-app-gray-light/20">
                      <th scope="col" className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-dark w-[20%]">File Name</th>
                      <th scope="col" className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-dark w-[15%]">Software</th>
                      <th scope="col" className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-dark w-[20%]">Original Date</th>
                      <th scope="col" className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-dark w-[20%]">Last Modified</th>
                      <th scope="col" className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-dark w-[12.5%]">Status</th>
                      <th scope="col" className="p-3 text-left text-sm font-medium text-app-accent-dim sticky top-0 bg-app-dark w-[12.5%]">Anomalies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((data, index) => (
                      <tr key={index} className="border-b border-app-gray-light/10 hover:bg-app-gray-light/5">
                        <td className="p-3 text-sm text-app-white truncate" title={data.image.file.name}>{data.image.file.name}</td>
                        <td className="p-3 text-sm text-app-white truncate" title={data.info.software || undefined}>{data.info.software || '-'}</td>
                        <td className="p-3 text-sm text-app-white truncate" title={data.info.originalDate ? formatDateTime(data.info.originalDate) : undefined}>
                          {data.info.originalDate ? formatDateTime(data.info.originalDate) : '-'}
                        </td>
                        <td className="p-3 text-sm text-app-white truncate" title={data.info.lastModified ? formatDateTime(data.info.lastModified) : undefined}>
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
          )}
        </div>
      </div>

      {/* Stats Sidebar */}
      <StatsSidebar isOpen={showStatsPanel} onToggle={() => setShowStatsPanel(!showStatsPanel)}>
        <div className="p-4">
          <h3 className="text-lg font-medium text-app-white mb-4">Processing Stats</h3>
          <div>
            <div className="border-b border-app-gray-light/30 py-3 last:border-b-0">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Total Images</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.total}</p>
            </div>
            <div className="border-b border-app-gray-light/30 py-3 last:border-b-0">
              <div className="flex items-center gap-2 mb-2">
                <Edit2 className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">Edited Images</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.edited}</p>
            </div>
            <div className="border-b border-app-gray-light/30 py-3 last:border-b-0">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">With Software Info</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.withSoftware}</p>
            </div>
            <div className="border-b border-app-gray-light/30 py-3 last:border-b-0">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-app-accent" />
                <h3 className="text-sm font-medium text-app-white">With Anomalies</h3>
              </div>
              <p className="text-2xl font-semibold text-app-white">{stats.withAnomalies}</p>
            </div>
            {hasActiveFilters && (
              <div className="border-b border-app-gray-light/30 py-3 last:border-b-0">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-5 h-5 text-app-accent" />
                  <h3 className="text-sm font-medium text-app-white">Active Filters</h3>
                </div>
                <p className="text-sm font-semibold text-app-white">
                  {filteredData.length} of {processingData.length} images
                </p>
              </div>
            )}
          </div>
        </div>
      </StatsSidebar>

      {/* Filter Panel using our reusable component */}
      {showFilterPanel && (
        <FilterPanel
          title="Filters"
          filterGroups={filterGroups}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetAll={handleResetAll}
          onClose={() => setShowFilterPanel(false)}
          className="absolute top-0 right-0 h-full"
          style={{ width: "16rem" }}
          totalCount={{
            current: filteredData.length,
            total: processingData.length
          }}
          showAllToggle={{
            isChecked: selectedSoftware.size === 0,
            onChange: (checked) => {
              if (checked) {
                setSelectedFilters({
                  software: new Set()
                });
              } else {
                setSelectedFilters({
                  software: new Set(allSoftware)
                });
              }
            },
            label: "Show All Software",
            description: selectedSoftware.size === 0 
              ? "Showing all software." 
              : "Select specific software below to filter results."
          }}
        />
      )}
    </div>
  );
};

export default SoftwareProcessingAnalysis; 