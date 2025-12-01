'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavItem {
  label: string;
  url: string;
  showInHamburger?: boolean;
}

interface MobileMenuButtonProps {
  navItems: NavItem[];
  phone: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export default function MobileMenuButton({ navItems, phone, buttonText = 'Apply Now', buttonUrl = '/apply', buttonBgColor = '#d93c37', buttonTextColor = '#ffffff' }: MobileMenuButtonProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-grey-200 shadow-lg">
          <div className="container-custom py-4 space-y-4">
            {navItems.filter(item => item.showInHamburger !== false).map((item) => (
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
              <Link
                href={buttonUrl}
                className="btn btn-primary w-full"
                style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
              >
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
