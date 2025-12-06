'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { mockProfessionals, RatingStars, Badge } from '@/components/directory';

export default function ProfessionalProfilePage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const professional = mockProfessionals.find(p => p.id === id);

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Professional Not Found</h1>
          <p className="text-gray-600 mb-6">The professional you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#181F53] rounded-lg hover:bg-[#2a3270] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#181F53] via-[#1e2660] to-[#2a3270] text-white">
        <div className="container-custom py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/directory" className="hover:text-white transition-colors">Directory</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white">{professional.name}</span>
          </nav>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Photo */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden ring-4 ring-white/20">
              {professional.photo ? (
                <img
                  src={professional.photo}
                  alt={professional.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-white text-4xl font-semibold ${professional.photo ? 'hidden' : ''}`}>
                {professional.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{professional.name}</h1>
                {professional.isFeatured && (
                  <Badge variant="featured">Featured</Badge>
                )}
              </div>

              {professional.company && (
                <p className="text-lg text-white/80 mb-2">{professional.company}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge variant="category" className="bg-white/10 text-white">{professional.category}</Badge>
                <div className="flex items-center gap-2">
                  <RatingStars rating={professional.rating} size="md" />
                  <span className="text-white/80">({professional.reviewCount} reviews)</span>
                </div>
              </div>

              <p className="text-white/70">{professional.yearsExperience} years of experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">{professional.description}</p>
            </div>

            {/* Service Areas */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Service Areas</h2>
              <div className="flex flex-wrap gap-2">
                {professional.serviceArea.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {area}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Based in {professional.city}, {professional.county} County
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">At a Glance</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#181F53]">{professional.rating}</div>
                  <div className="text-sm text-gray-500 mt-1">Rating</div>
                </div>
                <div className="text-center border-l border-r border-gray-200">
                  <div className="text-3xl font-bold text-[#181F53]">{professional.reviewCount}</div>
                  <div className="text-sm text-gray-500 mt-1">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#181F53]">{professional.yearsExperience}</div>
                  <div className="text-sm text-gray-500 mt-1">Years Exp.</div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {professional.reviews && professional.reviews.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Client Reviews</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-semibold text-[#181F53]">{professional.reviewCount}</span>
                    <span>total reviews</span>
                  </div>
                </div>

                {/* Rating Summary */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-[#181F53]">{professional.rating}</div>
                    <RatingStars rating={professional.rating} showValue={false} size="sm" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Based on <span className="font-semibold">{professional.reviewCount}</span> reviews from verified clients
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-xs text-gray-500">100% 5-star</span>
                    </div>
                  </div>
                </div>

                {/* Review List */}
                <div className="space-y-6">
                  {professional.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <RatingStars rating={review.rating} showValue={false} size="sm" />
                            <span className="text-xs text-gray-400">
                              {new Date(review.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>

                {/* View More */}
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500">
                    Showing 10 of {professional.reviewCount} reviews
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>

              <div className="space-y-4">
                {/* Phone */}
                <a
                  href={`tel:${professional.phone}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#181F53]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#181F53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 group-hover:text-[#181F53] transition-colors">{professional.phone}</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${professional.email}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#181F53]/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#181F53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 group-hover:text-[#181F53] transition-colors truncate">{professional.email}</p>
                  </div>
                </a>

                {/* Website */}
                {professional.website && (
                  <a
                    href={professional.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#181F53]/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#181F53]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Website</p>
                      <p className="font-medium text-gray-900 group-hover:text-[#181F53] transition-colors truncate">
                        {professional.website.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </a>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="mt-6 space-y-3">
                <a
                  href={`tel:${professional.phone}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#181F53] rounded-lg hover:bg-[#2a3270] transition-colors shine-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </a>
                <a
                  href={`mailto:${professional.email}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-[#181F53] bg-white border border-[#181F53]/20 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </a>
              </div>
            </div>

            {/* Back to Directory */}
            <Link
              href="/directory"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-[#181F53] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
