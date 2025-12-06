'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApproachItem {
  title: string;
  description: string;
  icon: string;
}

interface AboutSettings {
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionContent: string;
  whatWeDoTitle: string;
  whatWeDoContent: string;
  whatWeDoItems: string[];
  approachTitle: string;
  approachItems: ApproachItem[];
  contactTitle: string;
  contactName: string;
  contactNmls: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactImage: string;
  ctaText: string;
  ctaUrl: string;
}

const DEFAULT_SETTINGS: AboutSettings = {
  heroTitle: 'About American Mortgage',
  heroSubtitle: 'Your trusted Arkansas mortgage broker — dedicated to making homeownership accessible for everyone.',
  missionTitle: 'Our Mission',
  missionContent: 'American Mortgage was founded with a clear purpose: to simplify the home buying process and make it accessible to everyone. We combine industry expertise with personalized service to guide you toward the right loan for your situation.',
  whatWeDoTitle: 'What We Do',
  whatWeDoContent: 'We offer a full range of mortgage products including FHA, VA, USDA, and Conventional loans. Our team specializes in helping first-time homebuyers, veterans, and families across Arkansas find financing solutions that fit their needs.',
  whatWeDoItems: ['Purchase and refinance loans', 'Down payment assistance programs', 'Fast pre-approvals', 'Competitive rates and terms'],
  approachTitle: 'Our Approach',
  approachItems: [
    { title: 'Transparent', description: 'Clear communication and no hidden fees. We explain every step of the process.', icon: 'eye' },
    { title: 'Responsive', description: 'We return calls and emails promptly. Your questions deserve quick answers.', icon: 'lightning' },
    { title: 'Efficient', description: 'Streamlined processes to get you from application to closing without delays.', icon: 'clock' },
  ],
  contactTitle: 'Contact Us',
  contactName: 'American Mortgage',
  contactNmls: '#2676687',
  contactPhone: '(870) 926-4052',
  contactEmail: 'hello@americanmtg.com',
  contactAddress: '122 CR 7185, Jonesboro, AR 72405',
  contactImage: '/images/am-logo-white.png',
  ctaText: 'Start Your Application',
  ctaUrl: '/apply',
};

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'eye':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case 'lightning':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'clock':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'shield':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'star':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'heart':
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
  }
};

export default function AboutPage() {
  const [settings, setSettings] = useState<AboutSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/about');
        const json = await res.json();
        if (json.success && json.data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...json.data,
          });
        }
      } catch (error) {
        console.error('Failed to fetch about settings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#181F53] py-6 md:py-8">
          <div className="container-custom">
            <div className="max-w-3xl animate-pulse">
              <div className="h-8 bg-white/20 rounded w-3/4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2 mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - Compact (matching /loans) */}
      <section className="bg-[#181F53] py-6 md:py-8">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {settings.heroTitle}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {settings.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="pt-6 pb-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <article className="flex-1 max-w-3xl">
              {/* White content card */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                {/* Mission */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-[#181F53] mb-4">{settings.missionTitle}</h2>
                  <p className="text-[17px] text-gray-700 leading-relaxed">
                    {settings.missionContent}
                  </p>
                </div>

                {/* What We Do */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-[#181F53] mb-4">{settings.whatWeDoTitle}</h2>
                  <p className="text-[17px] text-gray-700 leading-relaxed mb-4">
                    {settings.whatWeDoContent}
                  </p>
                  <ul className="space-y-3 pl-0">
                    {settings.whatWeDoItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-2 h-2 bg-[#d93c37] rounded-full mt-2.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Our Approach */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-[#181F53] mb-4">{settings.approachTitle}</h2>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <ul className="space-y-4">
                      {settings.approachItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#181F53] rounded-lg flex items-center justify-center">
                            {getIconComponent(item.icon)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#181F53]">{item.title}</h3>
                            <p className="text-gray-600 text-sm">{item.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Contact Us */}
                <div>
                  <h2 className="text-2xl font-bold text-[#181F53] mb-4">{settings.contactTitle}</h2>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-4">
                      {/* Logo Circle */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-[#181F53] rounded-full flex items-center justify-center overflow-hidden">
                          <img
                            src={settings.contactImage || '/images/am-logo-white.png'}
                            alt="American Mortgage"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      {/* Contact Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{settings.contactName}</p>
                        <p className="text-xs text-gray-500 mb-1">NMLS {settings.contactNmls}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <a
                            href={`tel:${settings.contactPhone.replace(/[^0-9]/g, '')}`}
                            className="text-sm text-[#181F53] hover:text-[#d93c37] flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {settings.contactPhone}
                          </a>
                          <a
                            href={`mailto:${settings.contactEmail}`}
                            className="text-sm text-[#181F53] hover:text-[#d93c37] flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {settings.contactEmail}
                          </a>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{settings.contactAddress}</p>
                      </div>
                    </div>
                    <Link
                      href={settings.ctaUrl}
                      className="mt-4 block w-full py-2.5 bg-[#d93c37] text-white font-semibold rounded-lg text-center hover:bg-[#b8302c] transition-colors text-sm"
                    >
                      {settings.ctaText}
                    </Link>
                  </div>
                </div>

                {/* Mobile-only Widgets */}
                <div className="lg:hidden mt-8 space-y-4">
                  {/* Browse Loan Programs */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-[#181F53] mb-2">Loan Programs</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Explore our mortgage options.
                    </p>
                    <Link
                      href="/loans"
                      className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#181F53] text-[#181F53] text-sm font-semibold rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      View All Programs
                    </Link>
                  </div>

                  {/* Learning Center */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-[#181F53] mb-2">Learning Center</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Expert mortgage guides and tips.
                    </p>
                    <Link
                      href="/learn"
                      className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#181F53] text-[#181F53] text-sm font-semibold rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Browse Articles
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Browse Loan Programs */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-[#181F53] mb-2">Loan Programs</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Explore our mortgage options.
                  </p>
                  <Link
                    href="/loans"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#181F53] text-[#181F53] text-sm font-semibold rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    View All Programs
                  </Link>
                </div>

                {/* Learning Center */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-[#181F53] mb-2">Learning Center</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Expert mortgage guides and tips.
                  </p>
                  <Link
                    href="/learn"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-[#181F53] text-[#181F53] text-sm font-semibold rounded-lg hover:bg-[#181F53] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Browse Articles
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
