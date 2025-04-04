import React, { useMemo, useState } from 'react';
import { ImageData } from '../../types';
import { History, Edit2, AlertTriangle, Check, Info, Filter } from 'lucide-react';
import { formatDateTime } from '../../utils/date';

interface Props {
  images: ImageData[];
}

interface ProcessingInfo {
  software: string | null;
  originalDate: string | null;
  lastModified: string;
  hasBeenEdited: boolean;
  editingSoftware: string[];
  anomalies: string[];
}

const SoftwareProcessingAnalysis: React.FC<Props> = ({ images }) => {
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState<Set<string>>(new Set());

  const processingData = useMemo(() => {
    return images.map(img => {
      const info: ProcessingInfo = {
        software: img.exif.software || null,
        originalDate: img.exif.dateTimeOriginal || null,
        lastModified: new Date(img.file.lastModified).toISOString(),
        hasBeenEdited: false,
        editingSoftware: [],
        anomalies: []
      };

      // Check for editing software
      if (img.exif.software) {
        info.editingSoftware.push(img.exif.software);
      }

      // Check if image has been modified
      if (info.lastModified && info.originalDate) {
        const originalDate = new Date(info.originalDate);
        const modifyDate = new Date(info.lastModified);
        if (modifyDate.getTime() > originalDate.getTime()) {
          info.hasBeenEdited = true;
        }
      }

      // Check for metadata anomalies
      if (!img.exif.software && info.hasBeenEdited) {
        info.anomalies.push('Modified without software info');
      }
      if (!img.exif.dateTimeOriginal && info.lastModified) {
        info.anomalies.push('Missing original timestamp');
      }
      if (img.exif.software && !info.lastModified) {
        info.anomalies.push('Software present but no modification date');
      }

      return {
        image: img,
        info
      };
    });
  }, [images]);

  // Get unique software list
  const allSoftware = useMemo(() => {
    const software = new Set<string>();
    processingData.forEach(data => {
      if (data.info.software) {
        software.add(data.info.software);
      }
    });
    return Array.from(software);
  }, [processingData]);

  // Filter images based on selected software
  const filteredData = useMemo(() => {
    if (selectedSoftware.size === 0) return processingData;
    return processingData.filter(data => 
      data.info.software && selectedSoftware.has(data.info.software)
    );
  }, [processingData, selectedSoftware]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const edited = filteredData.filter(d => d.info.hasBeenEdited).length;
    const withAnomalies = filteredData.filter(d => d.info.anomalies.length > 0).length;
    const withSoftware = filteredData.filter(d => d.info.software).length;

    return { total, edited, withAnomalies, withSoftware };
  }, [filteredData]);

  return (
    <div className="w-full h-full relative p-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-app-accent" />
            <h3 className="text-sm font-medium text-app-white">Total Images</h3>
          </div>
          <p className="text-2xl font-semibold text-app-white">{stats.total}</p>
        </div>
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Edit2 className="w-5 h-5 text-app-accent" />
            <h3 className="text-sm font-medium text-app-white">Edited Images</h3>
          </div>
          <p className="text-2xl font-semibold text-app-white">{stats.edited}</p>
        </div>
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-app-accent" />
            <h3 className="text-sm font-medium text-app-white">With Software Info</h3>
          </div>
          <p className="text-2xl font-semibold text-app-white">{stats.withSoftware}</p>
        </div>
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-app-accent" />
            <h3 className="text-sm font-medium text-app-white">With Anomalies</h3>
          </div>
          <p className="text-2xl font-semibold text-app-white">{stats.withAnomalies}</p>
        </div>
      </div>

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

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="absolute top-4 right-4 w-64 bg-app-gray-dark border border-app-gray-light rounded-lg shadow-lg z-10">
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

      {/* Results Table */}
      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-gray-light/20">
                <th className="p-3 text-left text-sm font-medium text-app-accent-dim">File Name</th>
                <th className="p-3 text-left text-sm font-medium text-app-accent-dim">Software</th>
                <th className="p-3 text-left text-sm font-medium text-app-accent-dim">Original Date</th>
                <th className="p-3 text-left text-sm font-medium text-app-accent-dim">Last Modified</th>
                <th className="p-3 text-left text-sm font-medium text-app-accent-dim">Status</th>
                <th className="p-3 text-left text-sm font-medium text-app-accent-dim">Anomalies</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(({ image, info }) => (
                <tr key={image.file.name} className="border-b border-app-gray-light/10 hover:bg-app-gray-light/5">
                  <td className="p-3 text-sm text-app-white">{image.file.name}</td>
                  <td className="p-3 text-sm text-app-white">{info.software || '—'}</td>
                  <td className="p-3 text-sm text-app-white">
                    {info.originalDate ? formatDateTime(info.originalDate) : '—'}
                  </td>
                  <td className="p-3 text-sm text-app-white">
                    {formatDateTime(info.lastModified)}
                  </td>
                  <td className="p-3">
                    {info.hasBeenEdited ? (
                      <span className="inline-flex items-center gap-1 text-yellow-400 text-sm">
                        <Edit2 className="w-4 h-4" />
                        Edited
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <Check className="w-4 h-4" />
                        Original
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {info.anomalies.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {info.anomalies.map((anomaly, i) => (
                          <span key={i} className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {anomaly}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-app-accent-dim">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SoftwareProcessingAnalysis; 