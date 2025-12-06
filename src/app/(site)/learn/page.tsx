'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Scroll to top on mount (desktop only)
function useScrollToTopOnMount() {
  useEffect(() => {
    if (window.innerWidth >= 768) {
      window.scrollTo(0, 0);
    }
  }, []);
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: {
    id: number;
    alt: string | null;
    url: string;
  } | null;
  publishedAt: string | null;
  author: string | null;
  keyTakeaways: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function LearnPage() {
  useScrollToTopOnMount();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch posts
  const fetchPosts = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
      });
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const res = await fetch(`/api/blog-posts/public?${params}`);
      const json = await res.json();

      if (json.success) {
        setPosts(json.data.items);
        setPagination(json.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when search/page changes
  useEffect(() => {
    fetchPosts(1, debouncedSearch);
  }, [debouncedSearch, fetchPosts]);

  const handlePageChange = (newPage: number) => {
    fetchPosts(newPage, debouncedSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Hero Section - Compact */}
      <section className="bg-[#181F53] py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Learning Center
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Expert mortgage guides and advice
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full px-4 py-2.5 pl-10 rounded-lg border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:bg-white/15 focus:border-white/40 outline-none transition-all text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="pt-4 pb-10 md:pt-6 md:pb-14 bg-gray-50 min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Results Header */}
          {!loading && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                {pagination.total === 0 ? (
                  'No articles found'
                ) : (
                  <>
                    Showing <span className="font-medium">{posts.length}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> articles
                    {debouncedSearch && (
                      <> for "<span className="font-medium">{debouncedSearch}</span>"</>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200" />
                  <div className="p-5">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
                    <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {debouncedSearch ? 'No articles found' : 'No articles yet'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {debouncedSearch
                  ? `We couldn't find any articles matching "${debouncedSearch}". Try a different search term.`
                  : 'Check back soon for helpful guides and expert advice on mortgages and home buying.'}
              </p>
              {debouncedSearch && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-[#181F53] text-white rounded-lg hover:bg-[#0f1438] transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            /* Posts Grid */
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/learn/${post.slug}`}
                    className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                      {post.featuredImage?.url ? (
                        <img
                          src={post.featuredImage.url}
                          alt={post.featuredImage.alt || post.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#181F53] to-[#2a3470]">
                          <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 md:p-5 flex-1 flex flex-col">
                      {/* Meta */}
                      <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-500 mb-1 md:mb-2">
                        {post.publishedAt && (
                          <span>{formatDate(post.publishedAt)}</span>
                        )}
                        {post.author && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{post.author}</span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2 group-hover:text-[#181F53] transition-colors line-clamp-2">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-gray-600 text-xs md:text-sm line-clamp-2 mb-2 md:mb-3 flex-1 hidden md:block">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Read More */}
                      <div className="flex items-center text-[#181F53] text-xs md:text-sm font-medium group-hover:text-[#c41230] transition-colors mt-auto">
                        Read article
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        Math.abs(pageNum - pagination.page) <= 1
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              pageNum === pagination.page
                                ? 'bg-[#181F53] text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      // Show ellipsis
                      if (
                        (pageNum === 2 && pagination.page > 3) ||
                        (pageNum === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                      ) {
                        return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
