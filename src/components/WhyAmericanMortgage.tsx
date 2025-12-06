'use client';

import { useState, useRef } from 'react';

interface WhyChooseUsItem {
  title: string;
  description: string;
  icon: string;
}

interface WhyChooseUsSection {
  id: string;
  title: string;
  subtitle: string;
  items: WhyChooseUsItem[];
}

interface WhyChooseUsSettings {
  eyebrow?: string;
  headline?: string;
  highlightedText?: string;
  description?: string;
  sections?: WhyChooseUsSection[];
  mission?: string;
  vision?: string;
}

const defaultBrokerAdvantageItems: WhyChooseUsItem[] = [
  {
    title: 'More options, not one bank',
    description: 'Retail lenders are limited to their own products. As a broker, we shop across many lenders so you get the loan that truly fits your goals.',
    icon: 'options',
  },
  {
    title: 'Better pricing',
    description: 'We work with wholesale lenders that compete for your business every day. That usually means better rates and lower costs compared to a retail branch.',
    icon: 'pricing',
  },
  {
    title: 'Faster answers and faster closings',
    description: 'We use streamlined systems from top lenders, which means rapid approvals, same-day turn times in many cases, and a smoother experience from start to finish.',
    icon: 'speed',
  },
  {
    title: 'Personal guidance from a local expert',
    description: 'You work directly with a loan expert who knows Arkansas, knows your market, and has the resources to give you fast support whenever you need it.',
    icon: 'local',
  },
  {
    title: 'Advice based on you, not a sales quota',
    description: 'Our only job is to help you make the best financial decision for your situation. We focus on your long-term success, not corporate sales targets.',
    icon: 'advice',
  },
];

const defaultWhatSetsUsApartItems: WhyChooseUsItem[] = [
  {
    title: 'Relationship-driven, never transactional',
    description: 'Your loan is not a one-time file. We stay connected, guide you through future decisions, and help you build a long-term financial plan.',
    icon: 'relationship',
  },
  {
    title: 'Clear answers and straightforward guidance',
    description: 'We explain your options, give real recommendations, and help you understand what is best for your goals.',
    icon: 'clarity',
  },
  {
    title: 'Local presence with national resources',
    description: 'Based in Arkansas but connected to the largest wholesale lenders in the country. Local access with national strength.',
    icon: 'network',
  },
  {
    title: 'Responsive, world-class support',
    description: 'Fast communication, quick updates, and a dedicated team that prioritizes your needs. No waiting days for answers.',
    icon: 'support',
  },
  {
    title: 'Streamlined pre-approval process',
    description: 'Modern technology that eliminates delays and delivers a smooth, simple experience from application to closing.',
    icon: 'smart',
  },
];

const defaultMissionVision = {
  mission: 'To deliver a mortgage process that is fast, simple, and completely centered around your goals. We combine local care with national-level resources so every Arkansas buyer gets the guidance they deserve.',
  vision: 'To become the most trusted mortgage partner in Arkansas by building long-term relationships, providing real financial clarity, and giving every homeowner the confidence to move forward with the best loan for their future.',
};

function getIcon(iconName: string, className: string = 'w-6 h-6') {
  const icons: Record<string, JSX.Element> = {
    options: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    pricing: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    speed: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    local: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    advice: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    relationship: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    clarity: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    network: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    support: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    smart: (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  };
  return icons[iconName] || icons.options;
}

interface Props {
  settings?: WhyChooseUsSettings;
}

export default function WhyAmericanMortgage({ settings }: Props) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Use settings if provided, otherwise use defaults
  const eyebrow = settings?.eyebrow || 'Why Choose Us';
  const headline = settings?.headline || 'The';
  const highlightedText = settings?.highlightedText || 'American Mortgage';
  const description = settings?.description || 'Working with us means you get something retail lenders cannot offer: a personal advocate with access to dozens of loan programs and the best wholesale lenders in the country.';
  const mission = settings?.mission || defaultMissionVision.mission;
  const vision = settings?.vision || defaultMissionVision.vision;

  const handleToggle = (sectionId: string) => {
    if (openSection === sectionId) {
      // Closing the section
      setOpenSection(null);
    } else {
      // Opening a new section - scroll to it after a brief delay
      setOpenSection(sectionId);
      setTimeout(() => {
        const element = sectionRefs.current[sectionId];
        if (element) {
          const headerOffset = 100; // Account for sticky header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  };

  // Build sections from settings or use defaults
  const sections = settings?.sections && settings.sections.length > 0
    ? settings.sections.map((section, index) => ({
        ...section,
        color: index === 0 ? '#181F53' : '#d93c37',
      }))
    : [
        {
          id: 'broker',
          title: 'The Broker Advantage',
          subtitle: 'Why working with a broker works better for you',
          items: defaultBrokerAdvantageItems,
          color: '#181F53',
        },
        {
          id: 'apart',
          title: 'What Sets Us Apart',
          subtitle: 'Our commitment to your success',
          items: defaultWhatSetsUsApartItems,
          color: '#d93c37',
        },
      ];

  return (
    <div className="bg-white">
      <div className="container-custom pt-6 pb-8 md:pt-8 md:pb-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="block text-[#d93c37] text-[18px] font-bold tracking-[0.15em] uppercase mb-2 md:mb-4" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            {eyebrow}
          </span>
          {/* Desktop */}
          <h2 className="hidden md:block text-[#181F53]" style={{ fontFamily: 'Lora, serif', fontSize: '54.936px', fontWeight: 500, lineHeight: '60.429px' }}>
            {headline} <span className="text-[#02327d]">{highlightedText}</span> Difference
          </h2>
          {/* Mobile */}
          <h2 className="md:hidden text-[32px] text-[#181F53]" style={{ fontFamily: 'Lora, serif', fontWeight: 500, lineHeight: '36px' }}>
            {headline} <span className="text-[#02327d]">{highlightedText}</span> Difference
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto" style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '18px', lineHeight: '28.8px' }}>
            {description}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => handleToggle(section.id)}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <h3 className="text-xl font-semibold text-[#181F53]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                    {section.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{section.subtitle}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    openSection === section.id ? 'bg-[#181F53] rotate-180' : 'bg-gray-100'
                  }`}
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${openSection === section.id ? 'text-white' : 'text-gray-500'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {openSection === section.id && (
                <div className="px-6 pb-6 animate-fadeIn">
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${section.color}15` }}
                        >
                          <span style={{ color: section.color }}>
                            {getIcon(item.icon, 'w-5 h-5')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#181F53] text-sm mb-1">
                            {item.title}
                          </h4>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Mission/Vision Accordion */}
          <div
            ref={(el) => { sectionRefs.current['mission'] = el; }}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => handleToggle('mission')}
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <div>
                <h3 className="text-xl font-semibold text-[#181F53]" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Our Mission & Vision
                </h3>
                <p className="text-gray-500 text-sm mt-1">What drives us every day</p>
              </div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  openSection === 'mission' ? 'bg-[#181F53] rotate-180' : 'bg-gray-100'
                }`}
              >
                <svg
                  className={`w-5 h-5 transition-colors ${openSection === 'mission' ? 'text-white' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {openSection === 'mission' && (
              <div className="px-6 pb-6 animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-[#181F53] rounded-xl p-6 text-white">
                    <h4 className="font-semibold text-lg mb-3">Our Mission</h4>
                    <p className="text-white/90 text-sm leading-relaxed">{mission}</p>
                  </div>
                  <div className="bg-[#d93c37] rounded-xl p-6 text-white">
                    <h4 className="font-semibold text-lg mb-3">Our Vision</h4>
                    <p className="text-white/90 text-sm leading-relaxed">{vision}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add fadeIn animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
