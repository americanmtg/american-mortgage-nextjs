'use client';

import Link from 'next/link';
import { Professional } from './types';
import RatingStars from './RatingStars';
import Badge from './Badge';

interface FeaturedCardProps {
  professional: Professional;
}

export default function FeaturedCard({ professional }: FeaturedCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-amber-50/50 rounded-xl border-2 border-amber-200/60 hover:border-amber-300 hover:shadow-xl transition-all duration-300 overflow-hidden group relative">
      {/* Featured ribbon */}
      <div className="absolute top-4 right-4 z-10">
        <Badge variant="featured">Featured</Badge>
      </div>

      <div className="p-6">
        {/* Photo and basic info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#181F53] to-[#2a3270] flex items-center justify-center flex-shrink-0 overflow-hidden ring-4 ring-amber-200/50">
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
            <span className={`text-white text-2xl font-semibold ${professional.photo ? 'hidden' : ''}`}>
              {professional.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#181F53] transition-colors">
              {professional.name}
            </h3>
            {professional.company && (
              <p className="text-sm text-gray-600">{professional.company}</p>
            )}
            <Badge variant="category" className="mt-2">{professional.category}</Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {professional.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-between mb-4 py-3 px-4 bg-white/80 rounded-lg">
          <div className="text-center">
            <RatingStars rating={professional.rating} showValue={false} size="sm" />
            <p className="text-xs text-gray-500 mt-1">{professional.rating} rating</p>
          </div>
          <div className="text-center border-l border-r border-gray-200 px-4">
            <p className="font-semibold text-[#181F53]">{professional.reviewCount}</p>
            <p className="text-xs text-gray-500">reviews</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#181F53]">{professional.yearsExperience}</p>
            <p className="text-xs text-gray-500">years exp.</p>
          </div>
        </div>

        {/* Service area */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{professional.serviceArea.slice(0, 3).join(', ')}</span>
        </div>

        {/* Action button */}
        <Link
          href={`/directory/${professional.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#181F53] rounded-lg hover:bg-[#2a3270] transition-colors shine-button"
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
