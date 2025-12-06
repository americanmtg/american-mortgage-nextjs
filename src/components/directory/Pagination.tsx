'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        aria-label="Previous page"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-sm text-gray-500"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={isCurrentPage}
              className={`min-w-[40px] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCurrentPage
                  ? 'bg-[#181F53] text-white cursor-default'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
              aria-label={`Page ${page}`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
