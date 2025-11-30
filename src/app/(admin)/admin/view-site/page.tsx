'use client';

import { useState } from 'react';
import { useTheme } from '../../AdminContext';

export default function ViewSitePage() {
  const { isDark } = useTheme();
  const [currentUrl, setCurrentUrl] = useState('/');
  const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true';

  // For staging admin (port 3002), show staging site (port 3002 - same server, just front routes)
  // For production admin (port 3000), show production site (port 3000 - same server)
  // The site and admin share the same Next.js app, so just use relative URLs
  const siteBaseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}`
    : '';

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Calculator', path: '/calculator' },
    { label: 'Learn', path: '/learn' },
  ];

  const refreshIframe = () => {
    const iframe = document.getElementById('site-preview') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const openInNewTab = () => {
    window.open(siteBaseUrl + currentUrl, '_blank');
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className={`flex items-center justify-between mb-4 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            View Site
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Preview the {isStaging ? 'staging' : 'live'} site
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Nav */}
          <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => setCurrentUrl(link.path)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  currentUrl === link.path
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={refreshIframe}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Refresh preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Open in new tab */}
          <button
            onClick={openInNewTab}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </button>
        </div>
      </div>

      {/* URL Bar */}
      <div className={`flex items-center gap-3 p-3 rounded-t-xl border border-b-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <svg className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {siteBaseUrl}{currentUrl}
          </span>
        </div>
      </div>

      {/* Iframe Container */}
      <div className={`flex-1 border rounded-b-xl overflow-hidden ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <iframe
          id="site-preview"
          src={siteBaseUrl + currentUrl}
          className="w-full h-full bg-white"
          title="Site Preview"
        />
      </div>
    </div>
  );
}
