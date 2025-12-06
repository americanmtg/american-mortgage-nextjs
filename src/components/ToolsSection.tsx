'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ToolCard {
  title: string;
  description: string;
  icon: string;
  url: string;
}

interface ToolsSectionProps {
  eyebrow?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  cards?: ToolCard[];
}

const defaultCards: ToolCard[] = [
  { title: 'Mortgage Calculator', description: 'Estimate your monthly payment', icon: 'calculator', url: '/calculator' },
  { title: 'Affordability Calculator', description: 'See how much home you can afford', icon: 'home', url: '/calculator' },
  { title: 'Refinance Calculator', description: 'Calculate your potential savings', icon: 'refresh', url: '/calculator' },
];

// Icon components
const CalculatorIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="10" y2="18" />
    <line x1="14" y1="18" x2="16" y2="18" />
  </svg>
);

const HomeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const RefreshIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const getIcon = (iconName: string, className: string = "w-6 h-6") => {
  switch (iconName) {
    case 'calculator':
    case '🏠':
      return <CalculatorIcon className={className} />;
    case 'home':
    case '💰':
      return <HomeIcon className={className} />;
    case 'refresh':
    case '📊':
      return <RefreshIcon className={className} />;
    default:
      return <CalculatorIcon className={className} />;
  }
};

export default function ToolsSection({ eyebrow, headlineLine1, headlineLine2, cards }: ToolsSectionProps) {
  const [layout, setLayout] = useState<'compact' | 'vertical' | 'feature' | 'bento' | 'interactive'>('compact');
  const toolCards = cards && cards.length > 0 ? cards : defaultCards;

  const layouts = [
    { id: 'compact', label: 'Compact' },
    { id: 'vertical', label: 'Vertical Cards' },
    { id: 'feature', label: 'Feature Grid' },
    { id: 'bento', label: 'Bento Grid' },
    { id: 'interactive', label: 'Interactive' },
  ] as const;

  // Layout 1: Compact Horizontal (Current)
  const CompactLayout = () => (
    <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
      {toolCards.map((tool, index) => (
        <Link
          key={index}
          href={tool.url || '/calculator'}
          className="group flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-5 py-5 shadow-sm hover:shadow-md hover:border-[#d93c37]/30 transition-all duration-300"
        >
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#d93c37] to-[#b8302c] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            {getIcon(tool.icon, "w-6 h-6 text-white")}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#1a1a1a] group-hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {tool.title}
            </h3>
            <p className="text-[#666] text-sm" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {tool.description}
            </p>
          </div>
          <svg className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-[#d93c37] group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}
    </div>
  );

  // Layout 2: Vertical Cards with Large Icons
  const VerticalLayout = () => (
    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
      {toolCards.map((tool, index) => (
        <Link
          key={index}
          href={tool.url || '/calculator'}
          className="group bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-[#181F53]/20 transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#181F53] to-[#2a3a7d] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
            {getIcon(tool.icon, "w-10 h-10 text-white")}
          </div>
          <h3 className="text-xl font-bold text-[#181F53] mb-3 group-hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {tool.title}
          </h3>
          <p className="text-[#666] text-base mb-6 flex-grow" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {tool.description}
          </p>
          <span className="inline-flex items-center gap-2 text-[#d93c37] font-semibold group-hover:gap-3 transition-all">
            Try Calculator
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </Link>
      ))}
    </div>
  );

  // Layout 3: Feature Grid with Navy Background
  const FeatureLayout = () => (
    <div className="bg-[#181F53] rounded-3xl p-8 md:p-12">
      <div className="grid md:grid-cols-3 gap-6">
        {toolCards.map((tool, index) => (
          <Link
            key={index}
            href={tool.url || '/calculator'}
            className="group bg-white rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 flex flex-col"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#fed560] to-[#f5c842] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                {getIcon(tool.icon, "w-7 h-7 text-[#181F53]")}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#181F53] group-hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  {tool.title}
                </h3>
                <p className="text-[#666] text-sm mt-1" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  {tool.description}
                </p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#181F53] group-hover:text-[#d93c37] group-hover:gap-3 transition-all">
                Open Calculator
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  // Layout 4: Bento Grid
  const BentoLayout = () => (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Featured large card */}
      <Link
        href={toolCards[0]?.url || '/calculator'}
        className="group bg-gradient-to-br from-[#181F53] to-[#2a3a7d] rounded-3xl p-8 md:p-10 row-span-2 flex flex-col justify-between min-h-[320px] hover:shadow-2xl transition-all duration-300"
      >
        <div>
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
            {getIcon(toolCards[0]?.icon || 'calculator', "w-8 h-8 text-white")}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {toolCards[0]?.title || 'Mortgage Calculator'}
          </h3>
          <p className="text-white/70 text-lg" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {toolCards[0]?.description || 'Estimate your monthly payment'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[#fed560] font-semibold mt-6 group-hover:gap-4 transition-all">
          <span>Calculate Now</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </Link>
      {/* Smaller cards */}
      {toolCards.slice(1).map((tool, index) => (
        <Link
          key={index}
          href={tool.url || '/calculator'}
          className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-[#181F53]/20 transition-all duration-300 flex items-start gap-5"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-[#d93c37] to-[#b8302c] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            {getIcon(tool.icon, "w-7 h-7 text-white")}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#181F53] mb-2 group-hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {tool.title}
            </h3>
            <p className="text-[#666] text-sm mb-3" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {tool.description}
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#d93c37] group-hover:gap-3 transition-all">
              Try It
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );

  // Layout 5: Interactive Preview Style
  const InteractiveLayout = () => (
    <div className="grid md:grid-cols-3 gap-6">
      {toolCards.map((tool, index) => (
        <Link
          key={index}
          href={tool.url || '/calculator'}
          className="group bg-white border-2 border-gray-100 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-[#181F53]/10 transition-all duration-300"
        >
          {/* Mock calculator display */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 border-b border-gray-100">
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Result</span>
                <div className="w-8 h-8 bg-gradient-to-br from-[#181F53] to-[#2a3a7d] rounded-lg flex items-center justify-center">
                  {getIcon(tool.icon, "w-4 h-4 text-white")}
                </div>
              </div>
              <div className="text-3xl font-bold text-[#181F53]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                $1,847<span className="text-lg text-gray-400">/mo</span>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="h-2 bg-[#181F53] rounded-full flex-[3]"></div>
                <div className="h-2 bg-[#d93c37] rounded-full flex-1"></div>
                <div className="h-2 bg-[#fed560] rounded-full flex-1"></div>
              </div>
            </div>
          </div>
          {/* Card content */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-[#181F53] mb-2 group-hover:text-[#d93c37] transition-colors" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {tool.title}
            </h3>
            <p className="text-[#666] text-sm mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
              {tool.description}
            </p>
            <button className="w-full py-3 bg-[#181F53] text-white font-semibold rounded-lg group-hover:bg-[#d93c37] transition-colors">
              Start Calculating
            </button>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="pt-0 pb-6 md:pt-2 md:pb-10 bg-white">
      <div className="container-custom">
        {/* Layout Switcher */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
            {layouts.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  layout === l.id
                    ? 'bg-[#181F53] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#181F53] hover:bg-gray-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="block text-[#d93c37] text-[18px] font-bold tracking-[0.15em] uppercase mb-2 md:mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {eyebrow || 'Tools & Calculators'}
          </span>
          {/* Desktop */}
          <span className="hidden md:block text-[#181F53]" style={{ fontFamily: 'Lora, sans-serif', fontSize: '43.938px', fontWeight: 500, lineHeight: '48px' }}>
            {headlineLine1 || 'Get an estimate instantly with our'}
          </span>
          <span className="hidden md:block text-[#02327d]" style={{ fontFamily: 'Lora, sans-serif', fontSize: '43.938px', fontWeight: 500, lineHeight: '48px' }}>
            {headlineLine2 || 'online mortgage tools'}
          </span>
          {/* Mobile */}
          <span className="md:hidden block text-[32px] text-[#181F53]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>
            {headlineLine1 || 'Get an estimate instantly with our'}
          </span>
          <span className="md:hidden block text-[32px] text-[#02327d]" style={{ fontFamily: 'Lora, sans-serif', fontWeight: 500, lineHeight: '36px' }}>
            {headlineLine2 || 'online mortgage tools'}
          </span>
        </div>

        {layout === 'compact' && <CompactLayout />}
        {layout === 'vertical' && <VerticalLayout />}
        {layout === 'feature' && <FeatureLayout />}
        {layout === 'bento' && <BentoLayout />}
        {layout === 'interactive' && <InteractiveLayout />}
      </div>
    </section>
  );
}
