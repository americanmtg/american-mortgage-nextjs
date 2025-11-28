'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { client, urlFor } from '@/lib/sanity';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    client.fetch(`*[_type == "siteSettings"][0]`).then(setSettings);
  }, []);

  const navItems = [
    { label: 'About', url: '/about' },
    { label: 'Loan Options', url: '/loans' },
    { label: 'Learn', url: '/learn' },
    { label: 'Reviews', url: '/reviews' },
  ];

  const phone = settings?.phone || '1-800-906-8960';
  const legalBanner = settings?.legalBanner || 'American Mortgage services are not available in NY, NV, NJ, UT, VT.';
  const logoHeight = settings?.logoHeight || 40;

  return (
    <>
      {/* Top Banner */}
      <div className="bg-navy text-white text-center py-2 text-sm">
        {legalBanner}
      </div>
      
      {/* Main Header */}
      <header className="bg-white border-b border-grey-200 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              {settings?.logo ? (
                <Image 
                  src={urlFor(settings.logo).height(logoHeight * 2).url()} 
                  alt={settings?.siteName || 'American Mortgage'} 
                  width={logoHeight * 5}
                  height={logoHeight}
                  style={{ height: `${logoHeight}px`, width: 'auto' }}
                />
              ) : (
                <div className="text-2xl font-bold text-navy">
                  AMERICAN<span className="text-red"> MORTGAGE</span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link 
                  key={item.label}
                  href={item.url}
                  className="text-grey-700 font-medium hover:text-navy transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="text-navy font-semibold">
                {phone}
              </a>
              <Link href="/apply" className="btn btn-primary">
                Apply
              </Link>
              <Link href="/login" className="text-grey-600 hover:text-navy font-medium">
                Log In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-grey-200">
            <div className="container-custom py-4 space-y-4">
              {navItems.map((item) => (
                <Link 
                  key={item.label}
                  href={item.url}
                  className="block text-grey-700 font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-grey-200 space-y-3">
                <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="block text-navy font-semibold">
                  {phone}
                </a>
                <Link href="/apply" className="btn btn-primary w-full">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
