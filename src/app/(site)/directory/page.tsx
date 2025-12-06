'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  mockProfessionals,
  getFeaturedProfessionals,
  FilterState,
  SortOption,
  Professional,
  SearchBar,
  FilterSidebar,
  MobileFilterDrawer,
  Pagination,
  ProfessionalCard,
  FeaturedCard,
  EmptyState,
  CATEGORIES
} from '@/components/directory';

const ITEMS_PER_PAGE = 10;

const initialFilters: FilterState = {
  search: '',
  category: '',
  city: '',
  county: '',
  minRating: 0,
  minYearsExperience: 0,
  featuredOnly: false
};

export default function DirectoryPage() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>('rating_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Scroll to top on mount (desktop only) to ensure header is visible
  useEffect(() => {
    if (window.innerWidth >= 768) {
      window.scrollTo(0, 0);
    }
  }, []);

  const featuredProfessionals = getFeaturedProfessionals();

  // Filter and sort professionals
  const filteredProfessionals = useMemo(() => {
    let results = [...mockProfessionals];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.company?.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    // Apply city filter
    if (filters.city) {
      results = results.filter(
        (p) => p.city === filters.city || p.serviceArea.includes(filters.city)
      );
    }

    // Apply county filter
    if (filters.county) {
      results = results.filter((p) => p.county === filters.county);
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      results = results.filter((p) => p.rating >= filters.minRating);
    }

    // Apply experience filter
    if (filters.minYearsExperience > 0) {
      results = results.filter((p) => p.yearsExperience >= filters.minYearsExperience);
    }

    // Apply featured filter
    if (filters.featuredOnly) {
      results = results.filter((p) => p.isFeatured);
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'rating_desc':
          return b.rating - a.rating || b.reviewCount - a.reviewCount;
        case 'reviews_desc':
          return b.reviewCount - a.reviewCount;
        case 'experience_desc':
          return b.yearsExperience - a.yearsExperience;
        default:
          return 0;
      }
    });

    return results;
  }, [filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProfessionals.length / ITEMS_PER_PAGE);
  const paginatedProfessionals = filteredProfessionals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const activeFilterCount = [
    filters.category,
    filters.city,
    filters.county,
    filters.minRating > 0,
    filters.minYearsExperience > 0,
    filters.featuredOnly
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#181F53] via-[#1e2660] to-[#2a3270] text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Find Trusted Home Professionals
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Connect with experienced realtors, inspectors, contractors, and more in your area.
              All professionals are vetted and highly rated.
            </p>

            {/* Hero Search */}
            <div className="max-w-2xl mx-auto">
              <SearchBar
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search by name, company, or service..."
                className="shadow-lg"
              />
            </div>

            {/* Quick category links */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-white/60 text-sm">Popular:</span>
              {CATEGORIES.slice(0, 5).map((category) => (
                <button
                  key={category}
                  onClick={() => handleFilterChange({ ...filters, category })}
                  className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      {featuredProfessionals.length > 0 && !filters.search && !filters.category && (
        <section className="py-12 md:py-16 bg-white border-b border-gray-200">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Featured Professionals
                </h2>
                <p className="text-gray-600 mt-1">
                  Top-rated professionals in your area
                </p>
              </div>
              <Link
                href="#directory"
                className="hidden sm:inline-flex items-center gap-2 text-[#181F53] hover:text-[#181F53]/80 font-medium transition-colors"
              >
                View all
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProfessionals.slice(0, 3).map((professional) => (
                <FeaturedCard key={professional.id} professional={professional} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Directory Section */}
      <section id="directory" className="py-12 md:py-16">
        <div className="container-custom">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-6 flex items-center gap-4">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-[#181F53] text-white text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <p className="text-sm text-gray-500">
              {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                sortBy={sortBy}
                onSortChange={setSortBy}
                resultCount={filteredProfessionals.length}
              />
            </div>

            {/* Results */}
            <div className="flex-1">
              {paginatedProfessionals.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedProfessionals.map((professional) => (
                      <ProfessionalCard key={professional.id} professional={professional} />
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </>
              ) : (
                <EmptyState onClearFilters={clearFilters} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#181F53] to-[#2a3270] text-white">
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Are You a Home Professional?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join our directory and connect with homebuyers and homeowners in Arkansas.
            Get featured and grow your business.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-white text-[#181F53] rounded-lg hover:bg-gray-100 transition-colors shine-button"
          >
            Get Listed Today
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        resultCount={filteredProfessionals.length}
      />
    </div>
  );
}
