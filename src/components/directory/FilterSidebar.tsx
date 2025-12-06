'use client';

import { FilterState, CATEGORIES, CITIES, COUNTIES, SORT_OPTIONS, SortOption } from './types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
}

export default function FilterSidebar({
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  resultCount
}: FilterSidebarProps) {
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-[#181F53] hover:text-[#181F53]/80 font-medium transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-5">
        {resultCount} professional{resultCount !== 1 ? 's' : ''} found
      </p>

      {/* Sort */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
        <select
          value={filters.city}
          onChange={(e) => updateFilter('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
        <select
          value={filters.county}
          onChange={(e) => updateFilter('county', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53]/20 focus:border-[#181F53] transition-colors text-gray-900"
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
      <div className="mb-6">
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
      <div className="mb-6">
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
      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.featuredOnly}
            onChange={(e) => updateFilter('featuredOnly', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#181F53] focus:ring-[#181F53]/20"
          />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            Featured professionals only
          </span>
        </label>
      </div>
    </div>
  );
}
