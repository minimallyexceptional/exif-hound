import React from 'react';
import { Check } from 'lucide-react';

// Define the interfaces for our filter configuration
export interface FilterOption {
  id: string;
  label: string;
  // Additional metadata that might be needed by specific implementations
  metadata?: any;
}

export interface FilterGroup {
  id: string;
  title: string;
  options: FilterOption[];
  // Optional summary function to display in the header
  showCount?: boolean;
  icon?: React.ReactNode;
}

export interface FilterPanelProps {
  title?: string;
  // All available filter groups
  filterGroups: FilterGroup[];
  // Currently selected filter options (id strings)
  selectedFilters: Record<string, Set<string>>;
  // Callback when filters change
  onFilterChange: (groupId: string, selectedOptions: Set<string>) => void;
  // Optional callback for reset all filters
  onResetAll?: () => void;
  // Optional callback to close the panel
  onClose?: () => void;
  // Optional styling
  className?: string;
  style?: React.CSSProperties;
  // Total count display
  totalCount?: { current: number; total: number };
  // Show all toggle state and handler
  showAllToggle?: {
    isChecked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description: string;
  };
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  title = "Filters",
  filterGroups,
  selectedFilters,
  onFilterChange,
  onResetAll,
  onClose,
  className = '',
  style = {},
  totalCount,
  showAllToggle
}) => {
  // Use theme variables instead of hardcoded colors
  const solidBgColor = 'var(--app-dark)';
  const panelBgColor = 'var(--app-gray)';
  
  return (
    <div 
      className={`flex flex-col shadow-lg z-20 ${className}`}
      style={{
        backgroundColor: solidBgColor,
        backdropFilter: 'none !important',
        WebkitBackdropFilter: 'none !important',
        background: solidBgColor,
        backgroundImage: 'none !important',
        opacity: '1 !important',
        isolation: 'isolate',
        ...style
      }}
    >
      {/* Header */}
      <div 
        className="p-4 flex justify-between items-center"
        style={{ backgroundColor: solidBgColor, background: solidBgColor }}
      >
        <h3 className="text-lg font-medium text-app-white">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xl text-app-white hover:text-app-accent"
          >
            ×
          </button>
        )}
      </div>
      
      {/* Total Count */}
      {totalCount && (
        <div 
          className="px-4 pb-4"
          style={{ backgroundColor: solidBgColor, background: solidBgColor }}
        >
          <div 
            className="p-3 rounded-lg flex justify-between items-center"
            style={{ backgroundColor: panelBgColor, background: panelBgColor }}
          >
            <span className="text-sm text-app-accent-dim">Total Images</span>
            <span className="text-sm font-semibold text-app-white">
              {totalCount.current} / {totalCount.total}
            </span>
          </div>
        </div>
      )}
      
      {/* Show All Toggle */}
      {showAllToggle && (
        <div 
          className="mx-4 mb-4 p-4 rounded-lg"
          style={{ backgroundColor: panelBgColor, background: panelBgColor }}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <div className="mt-0.5 relative">
              <input
                type="checkbox"
                checked={showAllToggle.isChecked}
                onChange={(e) => showAllToggle.onChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border ${showAllToggle.isChecked ? 'bg-app-accent border-app-accent' : 'border-app-gray-light'} flex items-center justify-center`}>
                {showAllToggle.isChecked && (
                  <Check className="w-4 h-4 text-app-black" />
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-app-white">
                {showAllToggle.label}
              </div>
              <div className="text-xs text-app-accent-dim mt-1">
                {showAllToggle.description}
              </div>
            </div>
          </label>
        </div>
      )}
      
      {/* Filter Groups */}
      <div 
        className="overflow-y-auto flex-1 px-4"
        style={{ backgroundColor: solidBgColor, background: solidBgColor }}
      >
        {filterGroups.map((group) => {
          const isAllSelected = group.options.length === selectedFilters[group.id]?.size;
          const isNoneSelected = !selectedFilters[group.id] || selectedFilters[group.id].size === 0;
          
          return (
            <div 
              key={group.id}
              className="mb-4"
              style={{ backgroundColor: solidBgColor, background: solidBgColor }}
            >
              {/* Group Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {group.icon && <div className="text-app-white opacity-70">{group.icon}</div>}
                  <span className="text-sm font-medium text-app-white">{group.title}</span>
                </div>
                {group.options.length > 1 && (
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => {
                        const newSelection = new Set(group.options.map(opt => opt.id));
                        onFilterChange(group.id, newSelection);
                      }}
                      className="text-app-accent hover:text-app-accent/80"
                    >
                      All
                    </button>
                    <span className="text-app-gray-light">|</span>
                    <button
                      onClick={() => onFilterChange(group.id, new Set())}
                      className="text-app-accent hover:text-app-accent/80"
                    >
                      None
                    </button>
                  </div>
                )}
              </div>
              
              {/* Group Options */}
              <div 
                className="space-y-1 max-h-[300px] overflow-y-auto pr-1"
                style={{ backgroundColor: solidBgColor, background: solidBgColor }}
              >
                {group.options.length === 0 ? (
                  <div className="text-xs text-app-accent-dim italic">No options available</div>
                ) : (
                  group.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 px-2 py-1.5 hover:bg-app-gray/30 rounded cursor-pointer"
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedFilters[group.id]?.has(option.id) || false}
                          onChange={(e) => {
                            const newSelection = new Set(selectedFilters[group.id] || []);
                            if (e.target.checked) {
                              newSelection.add(option.id);
                            } else {
                              newSelection.delete(option.id);
                            }
                            onFilterChange(group.id, newSelection);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border ${selectedFilters[group.id]?.has(option.id) ? 'bg-app-accent border-app-accent' : 'border-app-gray-light'} flex items-center justify-center`}>
                          {selectedFilters[group.id]?.has(option.id) && (
                            <Check className="w-4 h-4 text-app-black" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-app-white truncate">
                        {option.label}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Reset Button */}
      {onResetAll && (
        <div 
          className="p-4 mt-auto"
          style={{ backgroundColor: solidBgColor, background: solidBgColor }}
        >
          <button
            onClick={onResetAll}
            className="w-full py-2 rounded text-app-white text-sm transition-colors bg-app-gray hover:bg-app-gray-light"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel; 