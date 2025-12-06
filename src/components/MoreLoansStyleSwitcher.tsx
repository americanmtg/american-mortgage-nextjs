'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MoreLoansSettings {
  text?: string;
  linkText?: string;
  linkUrl?: string;
}

interface Props {
  settings?: MoreLoansSettings;
}

export default function MoreLoansStyleSwitcher({ settings }: Props) {
  const [activeStyle, setActiveStyle] = useState(1);

  const text = settings?.text || 'Not finding the right fit? We have';
  const linkText = settings?.linkText || 'more loan options';
  const linkUrl = settings?.linkUrl || '/loans';

  const styles = [
    { id: 1, name: 'Gold Alert' },
    { id: 2, name: 'Navy + Gold' },
    { id: 3, name: 'White + Button' },
    { id: 4, name: 'Blue Gradient' },
    { id: 5, name: 'Red Gradient' },
    { id: 6, name: 'Glass' },
  ];

  return (
    <div className="w-full md:w-[996px] lg:w-[1016px] max-w-full mb-12">
      {/* Style Switcher Tabs - Only visible for preview, remove in production */}
      <div className="flex justify-center gap-2 mb-3">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => setActiveStyle(style.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              activeStyle === style.id
                ? 'bg-[#181F53] text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>

      {/* Style Option 1: Yellow/Gold Alert Background */}
      {activeStyle === 1 && (
        <div className="w-full bg-gradient-to-r from-[#fed560] to-[#f5c842] rounded-lg px-6 py-5 text-center flex items-center justify-center shadow-sm border border-[#e5b530]">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#181F53] flex-shrink-0 hidden md:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[#181F53] text-base font-medium">
              <span className="hidden md:inline">{text}{' '}<Link href={linkUrl} className="text-[#181F53] underline underline-offset-2 hover:text-[#02327d] font-bold">{linkText}</Link>{' '}available.</span>
              <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-[#181F53] underline underline-offset-2 hover:text-[#02327d] font-bold">{linkText}</Link>{' '}available.</span>
            </p>
          </div>
        </div>
      )}

      {/* Style Option 2: Navy with Gold Accent Border */}
      {activeStyle === 2 && (
        <div className="w-full bg-[#181F53] rounded-lg px-6 py-5 text-center flex items-center justify-center border-l-4 border-[#fed560]">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#fed560] flex-shrink-0 hidden md:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <p className="text-white text-base">
              <span className="hidden md:inline">{text}{' '}<Link href={linkUrl} className="text-[#fed560] hover:text-[#ffe082] font-semibold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
              <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-[#fed560] hover:text-[#ffe082] font-semibold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
            </p>
          </div>
        </div>
      )}

      {/* Style Option 3: White Card with Red Accent + Arrow Button */}
      {activeStyle === 3 && (
        <div className="w-full bg-white rounded-lg px-6 py-5 flex items-center justify-between shadow-md border-t-4 border-[#d93c37]">
          <p className="text-[#181F53] text-base font-medium flex-1">
            <span className="hidden md:inline">{text}{' '}<span className="font-bold">{linkText}</span>{' '}available.</span>
            <span className="md:hidden">{text}<br />We have <span className="font-bold">{linkText}</span> available.</span>
          </p>
          <Link href={linkUrl} className="bg-[#d93c37] hover:bg-[#c13530] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors flex-shrink-0 ml-4">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      )}

      {/* Style Option 4: Gradient Blue with Icon */}
      {activeStyle === 4 && (
        <div className="w-full bg-gradient-to-r from-[#181F53] to-[#2a3a7d] rounded-xl px-6 py-5 text-center flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#fed560] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#181F53]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-white text-base">
              <span className="hidden md:inline">{text}{' '}<Link href={linkUrl} className="text-[#fed560] hover:text-[#ffe082] font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
              <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-[#fed560] hover:text-[#ffe082] font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
            </p>
          </div>
        </div>
      )}

      {/* Style Option 5: Gradient Red with Icon */}
      {activeStyle === 5 && (
        <div className="w-full bg-gradient-to-r from-[#d93c37] to-[#b52d29] rounded-xl px-6 py-5 text-center flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#d93c37]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-white text-base">
              <span className="hidden md:inline">{text}{' '}<Link href={linkUrl} className="text-white hover:text-gray-200 font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
              <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-white hover:text-gray-200 font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
            </p>
          </div>
        </div>
      )}

      {/* Style Option 6: Glass/Frosted Effect */}
      {activeStyle === 6 && (
        <div className="w-full rounded-xl px-6 py-5 text-center flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(24, 31, 83, 0.8) 0%, rgba(42, 58, 125, 0.6) 100%)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(254, 213, 96, 0.9)', boxShadow: '0 4px 15px rgba(254, 213, 96, 0.3)' }}>
              <svg className="w-5 h-5 text-[#181F53]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-white text-base">
              <span className="hidden md:inline">{text}{' '}<Link href={linkUrl} className="text-[#fed560] hover:text-[#ffe082] font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
              <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-[#fed560] hover:text-[#ffe082] font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
