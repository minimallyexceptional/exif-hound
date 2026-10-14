import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { EvidenceCategoryMeta, EvidenceCategoryId } from 'exif-hound-core';
import { EVIDENCE_CATEGORY_ICONS } from './evidenceCategoryMeta';

interface Props {
  categories: EvidenceCategoryMeta[];
  onSelect: (id: EvidenceCategoryId) => void;
}

export const EvidenceBentoGrid: React.FC<Props> = ({ categories, onSelect }) => (
  <ul
    className="grid w-full list-none grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-4"
    aria-label="Evidence categories"
  >
    {categories.map((category) => {
      const Icon = EVIDENCE_CATEGORY_ICONS[category.id];
      const muted = category.count === 0;
      return (
        <li key={category.id} className="min-h-0">
          <button
            type="button"
            onClick={() => onSelect(category.id)}
            className={`group stat-card flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent sm:min-h-[4.25rem] sm:px-4 ${
              muted
                ? 'opacity-75 hover:border-app-gray-light/60 hover:bg-app-gray-light/20 hover:opacity-100'
                : 'hover:border-app-gray-light/70 hover:bg-app-gray-light/25'
            }`}
            aria-label={`${category.title}, ${category.count} items`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-app-gray-light/40 bg-app-dark/80 ${
                muted ? 'text-app-accent-dim' : 'text-app-accent'
              }`}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-white">{category.title}</span>
            <span className="flex shrink-0 items-center gap-2 tabular-nums">
              <span
                className={`selectable-value text-lg font-semibold sm:text-xl ${
                  muted ? 'text-app-accent-dim' : 'text-app-white'
                }`}
              >
                {category.count.toLocaleString()}
              </span>
              <ChevronRight
                className="h-4 w-4 text-app-accent-dim transition-[transform,color] duration-200 group-hover:text-app-accent motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </button>
        </li>
      );
    })}
  </ul>
);
