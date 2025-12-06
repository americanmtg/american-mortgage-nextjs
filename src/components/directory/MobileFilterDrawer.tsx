'use client';

import { useEffect } from 'react';
import { FilterState, CATEGORIES, CITIES, COUNTIES, SORT_OPTIONS, SortOption } from './types';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  resultCount
}: MobileFilterDrawerProps) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      category: '',
      city: '',
      county: '',
      minRating: 0,
      minYearsExperience: 0,
      featuredOnly: false
    });
  };

  const hasActiveFilters =
    filters.category ||
    filters.city ||
    filters.county ||
    filters.minRating > 0 ||
    filters.minYearsExperience > 0 ||
    filters.featuredOnly;

  const activeFilterCount = [
    filters.category,
    filters.city,
    filters.county,
    filters.minRating > 0,
    filters.minYearsExperience > 0,
    filters.featuredOnly
  ].filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <p className="text-sm text-gray-500">{resultCount} results</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
            >
              <option value="">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* County */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
            <select
              value={filters.county}
              onChange={(e) => updateFilter('county', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
            >
              <option value="">All Counties</option>
              {COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating: {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.minRating}
              onChange={(e) => updateFilter('minRating', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#181F53]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Any</span>
              <span>5.0</span>
            </div>
          </div>

          {/* Minimum Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Experience: {filters.minYearsExperience > 0 ? `${filters.minYearsExperience}+ years` : 'Any'}
            </label>
            <input
              type="range"
              min="0"
              max="25"
              step="5"
              value={filters.minYearsExperience}
              onChange={(e) => updateFilter('minYearsExperience', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#181F53]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Any</span>
              <span>25+ yrs</span>
            </div>
          </div>

          {/* Featured Only */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featuredOnly}
                onChange={(e) => updateFilter('featuredOnly', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#181F53] focus:ring-[#181F53]/20"
              />
              <span className="text-sm font-medium text-gray-700">
                Featured professionals only
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4 flex gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear ({activeFilterCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-[#181F53] rounded-lg hover:bg-[#2a3270] transition-colors"
          >
            View Results
          </button>
        </div>
      </div>
    </div>
  );
}
