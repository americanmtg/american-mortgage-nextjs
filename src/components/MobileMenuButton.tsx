'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavItem {
  label: string;
  url: string;
  showInHamburger?: boolean;
}

interface MobileButton {
  id?: number;
  label: string;
  url: string;
  icon: string | null;
  buttonType: string;
  backgroundColor: string | null;
  textColor: string | null;
  borderColor: string | null;
}

interface MobileMenuButtonProps {
  navItems: NavItem[];
  phone: string;
  buttons?: MobileButton[];
  // Legacy props - used as fallback if no buttons configured
  buttonText?: string;
  buttonUrl?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

function renderIcon(icon: string | null, color: string) {
  if (!icon || icon === 'none') return null;

  const iconClass = "w-5 h-5";
  switch (icon) {
    case 'phone':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      );
    case 'home':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'calculator':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'document':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'user':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case 'mail':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={iconClass} fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function MobileMenuButton({
  navItems,
  phone,
  buttons = [],
  buttonText = 'Apply Now',
  buttonUrl = '/apply',
  buttonBgColor = '#d93c37',
  buttonTextColor = '#ffffff'
}: MobileMenuButtonProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If no buttons configured, use legacy props as fallback
  const displayButtons = buttons.length > 0 ? buttons : [
    {
      label: 'Talk to an Agent',
      url: `tel:${phone.replace(/[^0-9]/g, '')}`,
      icon: 'phone',
      buttonType: 'outline',
      backgroundColor: '#ffffff',
      textColor: '#0f2e71',
      borderColor: '#0f2e71',
    },
    {
      label: buttonText,
      url: buttonUrl,
      icon: 'none',
      buttonType: 'solid',
      backgroundColor: buttonBgColor,
      textColor: buttonTextColor,
      borderColor: buttonBgColor,
    },
  ];

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
        <>
          {/* Invisible backdrop - closes menu when tapped outside */}
          <div
            className="md:hidden fixed inset-0 z-40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-grey-200 shadow-lg z-50">
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
              {displayButtons.map((btn, index) => {
                const bgColor = btn.backgroundColor || '#ffffff';
                const txtColor = btn.textColor || '#0f2e71';
                const bdrColor = btn.borderColor || '#0f2e71';

                // Always use the specified background color - user controls via color picker
                const buttonStyle = {
                  backgroundColor: bgColor,
                  color: txtColor,
                  border: `2px solid ${bdrColor}`,
                };

                // Check if it's a tel: link
                const isTelLink = btn.url.startsWith('tel:');

                if (isTelLink) {
                  return (
                    <a
                      key={index}
                      href={btn.url}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded font-semibold transition-colors"
                      style={buttonStyle}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {renderIcon(btn.icon, txtColor)}
                      {btn.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={index}
                    href={btn.url}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded font-semibold transition-colors"
                    style={buttonStyle}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {renderIcon(btn.icon, txtColor)}
                    {btn.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
}
