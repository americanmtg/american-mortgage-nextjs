import Link from 'next/link';

/**
 * DirectoryBanner - Promotes the Professional Directory
 * Gold gradient style matching the hero eyebrow color
 */

interface DirectoryBannerProps {
  text?: string;
  linkText?: string;
  linkUrl?: string;
}

export default function DirectoryBanner({
  text = 'Need a trusted real estate professional?',
  linkText = 'Browse our directory',
  linkUrl = '/directory'
}: DirectoryBannerProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="w-full bg-gradient-to-r from-[#fed560] to-[#f5c842] rounded-xl px-6 py-5 text-center flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#181F53]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-[#181F53] text-base font-medium" style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <span className="hidden md:inline">{text} <Link href={linkUrl} className="text-[#181F53] hover:text-[#0f1438] font-bold underline underline-offset-2">{linkText}</Link></span>
            <span className="md:hidden">{text}<br /><Link href={linkUrl} className="text-[#181F53] hover:text-[#0f1438] font-bold underline underline-offset-2">{linkText}</Link></span>
          </p>
        </div>
      </div>
    </div>
  );
}
