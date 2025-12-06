'use client';

interface EmptyStateProps {
  onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {/* Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No professionals found
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We couldn&apos;t find any professionals matching your search criteria.
        Try adjusting your filters or search terms.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#181F53] rounded-lg hover:bg-[#2a3270] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Clear All Filters
        </button>
      </div>

      {/* Suggestions */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          Suggestions to improve your search:
        </h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Try broader search terms
          </li>
          <li className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Select fewer filter options
          </li>
          <li className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Check for typos in your search
          </li>
        </ul>
      </div>
    </div>
  );
}
