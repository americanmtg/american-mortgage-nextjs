'use client';

import { useState, useEffect } from 'react';

interface LoanOfficer {
  name: string;
  nmlsId?: string | null;
  phone: string;
  email: string;
  photoUrl?: string | null;
}

interface VerificationResult {
  success: boolean;
  verified?: boolean;
  message?: string;
  data?: {
    borrowerName?: string;
    letterDate?: string;
    loanOfficer?: LoanOfficer | null;
  };
  error?: string;
}

interface PageSettings {
  pageTitle: string;
  pageSubtitle: string;
  successTitle: string;
  successMessage: string;
  failTitle: string;
  failMessage: string;
  defaultContactName: string;
  defaultContactNmlsId?: string | null;
  defaultContactPhone: string;
  defaultContactEmail: string;
  defaultContactPhoto?: string | null;
}

const DEFAULT_SETTINGS: PageSettings = {
  pageTitle: 'Pre-Approval Verification',
  pageSubtitle: 'Enter the reference ID from your pre-approval letter to verify its authenticity.',
  successTitle: 'Verified - Authentic Letter',
  successMessage: 'This pre-approval letter is authentic.',
  failTitle: 'Verification Failed',
  failMessage: 'We could not verify this reference ID. The letter may be invalid, expired, or entered incorrectly.',
  defaultContactName: 'American Mortgage',
  defaultContactNmlsId: null,
  defaultContactPhone: '(XXX) XXX-XXXX',
  defaultContactEmail: 'verify@americanmtg.com',
  defaultContactPhoto: null,
};

export default function VerifyPage() {
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [settings, setSettings] = useState<PageSettings>(DEFAULT_SETTINGS);

  // Scroll to top on mount (desktop only) to ensure header is visible
  useEffect(() => {
    if (window.innerWidth >= 768) {
      window.scrollTo(0, 0);
    }
  }, []);

  // Fetch page settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/verify-page');
        const json = await res.json();
        if (res.ok && json.data) {
          setSettings({
            pageTitle: json.data.pageTitle || DEFAULT_SETTINGS.pageTitle,
            pageSubtitle: json.data.pageSubtitle || DEFAULT_SETTINGS.pageSubtitle,
            successTitle: json.data.successTitle || DEFAULT_SETTINGS.successTitle,
            successMessage: json.data.successMessage || DEFAULT_SETTINGS.successMessage,
            failTitle: json.data.failTitle || DEFAULT_SETTINGS.failTitle,
            failMessage: json.data.failMessage || DEFAULT_SETTINGS.failMessage,
            defaultContactName: json.data.defaultContactName || DEFAULT_SETTINGS.defaultContactName,
            defaultContactNmlsId: json.data.defaultContactNmlsId || DEFAULT_SETTINGS.defaultContactNmlsId,
            defaultContactPhone: json.data.defaultContactPhone || DEFAULT_SETTINGS.defaultContactPhone,
            defaultContactEmail: json.data.defaultContactEmail || DEFAULT_SETTINGS.defaultContactEmail,
            defaultContactPhoto: json.data.defaultContactPhoto || DEFAULT_SETTINGS.defaultContactPhoto,
          });
        }
      } catch {
        // Use defaults if fetch fails
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referenceId.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/preapproval-letters/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: referenceId.trim() }),
      });

      const data = await res.json();
      setResult(data);
      // Scroll to show full content - slightly down to show agent card
      setTimeout(() => {
        window.scrollTo({ top: 20, behavior: 'smooth' });
      }, 100);
    } catch {
      setResult({
        success: false,
        error: 'An error occurred while verifying. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Parse as UTC and format as MM/DD/YYYY
    const date = new Date(dateString);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}/${day}/${year}`;
  };

  // Replace placeholders in message with actual values and return JSX with bold formatting
  const formatSuccessMessage = (message: string) => {
    const borrowerName = result?.data?.borrowerName || '';
    const letterDate = result?.data?.letterDate ? formatDate(result.data.letterDate) : '';

    // Replace placeholders with unique markers, then split and map to JSX
    const parts = message
      .replace(/\{borrower\s*name\}/gi, '{{BORROWER_NAME}}')
      .replace(/\{letter\s*date\}/gi, '{{LETTER_DATE}}')
      .split(/(\{\{BORROWER_NAME\}\}|\{\{LETTER_DATE\}\})/);

    return parts.map((part, index) => {
      if (part === '{{BORROWER_NAME}}') {
        return <strong key={index}>{borrowerName}</strong>;
      }
      if (part === '{{LETTER_DATE}}') {
        return <strong key={index}>{letterDate}</strong>;
      }
      return part;
    });
  };

  // Get contact info from result or use default from settings
  const getContactInfo = (): LoanOfficer => {
    if (result?.data?.loanOfficer) {
      return result.data.loanOfficer;
    }
    return {
      name: settings.defaultContactName,
      nmlsId: settings.defaultContactNmlsId,
      phone: settings.defaultContactPhone,
      email: settings.defaultContactEmail,
      photoUrl: settings.defaultContactPhoto,
    };
  };

  return (
    <div className="bg-gray-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#181F53] rounded-full mb-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#181F53] mb-1">
            {settings.pageTitle}
          </h1>
          <p className="text-sm text-gray-600">
            <span>Enter the reference ID from your pre-approval</span>
            <br />
            <span>letter to verify its authenticity.</span>
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700 mb-1">
                Reference ID
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                id="referenceId"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter reference number"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none font-mono text-center text-lg tracking-widest"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !referenceId.trim()}
              className="w-full py-2.5 px-4 bg-[#181F53] text-white font-semibold rounded-lg hover:bg-[#0f1438] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verify Letter
                </>
              )}
            </button>
          </form>

          {/* Result Display */}
          {result && (
            <div className="mt-4 space-y-3">
              {result.verified && result.message === 'authentic' ? (
                <>
                  {/* Success Status Badge */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-green-800">
                          {settings.successTitle}
                        </h3>
                        <p className="text-xs text-green-700">
                          {formatSuccessMessage(settings.successMessage)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Card - Separate from status */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Questions? Contact your loan officer
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        {getContactInfo().photoUrl ? (
                          <img
                            src={getContactInfo().photoUrl!}
                            alt={getContactInfo().name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#181F53] rounded-full flex items-center justify-center text-white text-base font-semibold">
                            {getContactInfo().name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      {/* Contact Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getContactInfo().name}
                        </p>
                        {getContactInfo().nmlsId && (
                          <p className="text-xs text-gray-600">
                            NMLS ID #{getContactInfo().nmlsId}
                          </p>
                        )}
                        <a
                          href={`tel:${getContactInfo().phone}`}
                          className="text-xs text-[#181F53] hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {getContactInfo().phone}
                        </a>
                        <a
                          href={`mailto:${getContactInfo().email}`}
                          className="text-xs text-[#181F53] hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {getContactInfo().email}
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Error Status Badge */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-red-800">
                          {settings.failTitle}
                        </h3>
                        <p className="text-xs text-red-700">
                          {settings.failMessage}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Card for Support */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Need help? Contact us for support
                    </p>
                    <div className="flex items-center gap-3">
                      {/* Photo */}
                      <div className="flex-shrink-0">
                        {getContactInfo().photoUrl ? (
                          <img
                            src={getContactInfo().photoUrl!}
                            alt={getContactInfo().name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[#181F53] rounded-full flex items-center justify-center text-white text-base font-semibold">
                            {getContactInfo().name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        )}
                      </div>
                      {/* Contact Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {getContactInfo().name}
                        </p>
                        {getContactInfo().nmlsId && (
                          <p className="text-xs text-gray-600">
                            NMLS ID #{getContactInfo().nmlsId}
                          </p>
                        )}
                        <a
                          href={`tel:${getContactInfo().phone}`}
                          className="text-xs text-[#181F53] hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {getContactInfo().phone}
                        </a>
                        <a
                          href={`mailto:${getContactInfo().email}`}
                          className="text-xs text-[#181F53] hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {getContactInfo().email}
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info Section - only show when no result */}
        {!result && (
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              The reference ID can be found on your pre-approval letter.
              If you have trouble locating it, please contact us for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
