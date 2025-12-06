'use client';

import Link from 'next/link';

interface MoreLoansSettings {
  text?: string;
  linkText?: string;
  linkUrl?: string;
  style?: 'red' | 'blue' | 'grey';
}

interface Props {
  settings?: MoreLoansSettings;
}

export default function MoreLoansBanner({ settings }: Props) {
  const text = settings?.text || 'Not finding the right fit? We have';
  const linkText = settings?.linkText || 'more loan options';
  const linkUrl = settings?.linkUrl || '/loans';
  const style = settings?.style || 'red';

  // Red Gradient (default)
  if (style === 'red') {
    return (
      <div className="w-full md:w-[996px] lg:w-[1016px] max-w-full mb-12">
        <div className="w-full bg-gradient-to-r from-[#d93c37] to-[#b52d29] rounded-xl px-6 py-5 text-center flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
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
      </div>
    );
  }

  // Grey/White Gradient
  if (style === 'grey') {
    return (
      <div className="w-full md:w-[996px] lg:w-[1016px] max-w-full mb-12">
        <div className="w-full bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] rounded-xl px-6 py-5 text-center flex items-center justify-center border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#181F53] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-[#181F53] text-base font-medium">
              <span className="hidden md:inline">{text}{' '}<Link href={linkUrl} className="text-[#d93c37] hover:text-[#b52d29] font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
              <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-[#d93c37] hover:text-[#b52d29] font-bold underline underline-offset-2">{linkText}</Link>{' '}available.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Blue Gradient
  return (
    <div className="w-full md:w-[996px] lg:w-[1016px] max-w-full mb-12">
      <div className="w-full bg-gradient-to-r from-[#181F53] to-[#2a3a7d] rounded-xl px-6 py-5 text-center flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
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
    </div>
  );
}
