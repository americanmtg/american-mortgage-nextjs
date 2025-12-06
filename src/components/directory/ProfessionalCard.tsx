'use client';

import Link from 'next/link';
import { Professional } from './types';
import RatingStars from './RatingStars';
import Badge from './Badge';

interface ProfessionalCardProps {
  professional: Professional;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-[#181F53]/30 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <div className="p-5">
        {/* Header with photo and basic info */}
        <div className="flex items-start gap-4">
          {/* Photo */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#181F53] to-[#2a3270] flex items-center justify-center flex-shrink-0 overflow-hidden">
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
            <span className={`text-white text-xl font-semibold ${professional.photo ? 'hidden' : ''}`}>
              {professional.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          {/* Name and company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#181F53] transition-colors truncate">
                  {professional.name}
                </h3>
                {professional.company && (
                  <p className="text-sm text-gray-500 truncate">{professional.company}</p>
                )}
              </div>
              {professional.isFeatured && (
                <Badge variant="featured">Featured</Badge>
              )}
            </div>

            {/* Category badge */}
            <div className="mt-2">
              <Badge variant="category">{professional.category}</Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-gray-600 line-clamp-2">
          {professional.description}
        </p>

        {/* Rating and reviews */}
        <div className="mt-4 flex items-center gap-3">
          <RatingStars rating={professional.rating} size="sm" />
          <span className="text-xs text-gray-500">
            ({professional.reviewCount} reviews)
          </span>
        </div>

        {/* Service area */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{professional.serviceArea.slice(0, 3).join(', ')}</span>
        </div>

        {/* Contact info */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <a
            href={`tel:${professional.phone}`}
            className="flex items-center gap-1 text-gray-500 hover:text-[#181F53] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="hidden sm:inline">{professional.phone}</span>
          </a>
          <a
            href={`mailto:${professional.email}`}
            className="flex items-center gap-1 text-gray-500 hover:text-[#181F53] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline truncate max-w-[120px]">{professional.email}</span>
          </a>
        </div>
      </div>

      {/* Footer with action */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <Link
          href={`/directory/${professional.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#181F53] bg-white border border-[#181F53]/20 rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
        >
          View Profile
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
