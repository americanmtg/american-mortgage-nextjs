'use client';

import { useState, useEffect } from 'react';

interface LoanOfficer {
  name: string;
  phone: string;
  email: string;
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
  defaultContactPhone: string;
  defaultContactEmail: string;
}

const DEFAULT_SETTINGS: PageSettings = {
  pageTitle: 'Pre-Approval Letter Verification',
  pageSubtitle: 'Enter the reference ID from your pre-approval letter to verify its authenticity.',
  successTitle: 'Verified - Authentic Letter',
  successMessage: 'This pre-approval letter is authentic.',
  failTitle: 'Verification Failed',
  failMessage: 'We could not verify this reference ID. The letter may be invalid, expired, or entered incorrectly.',
  defaultContactName: 'American Mortgage',
  defaultContactPhone: '(XXX) XXX-XXXX',
  defaultContactEmail: 'verify@americanmtg.com',
};

export default function VerifyPage() {
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [settings, setSettings] = useState<PageSettings>(DEFAULT_SETTINGS);

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
            defaultContactPhone: json.data.defaultContactPhone || DEFAULT_SETTINGS.defaultContactPhone,
            defaultContactEmail: json.data.defaultContactEmail || DEFAULT_SETTINGS.defaultContactEmail,
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
    // Parse as UTC and format to avoid timezone shift issues
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
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
      phone: settings.defaultContactPhone,
      email: settings.defaultContactEmail,
    };
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#181F53] rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#181F53] mb-2">
            {settings.pageTitle}
          </h1>
          <p className="text-gray-600">
            {settings.pageSubtitle}
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700 mb-2">
                Reference ID
              </label>
              <input
                type="text"
                id="referenceId"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Enter reference ID (e.g., PA-2024-001234)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none font-mono text-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !referenceId.trim()}
              className="w-full py-3 px-4 bg-[#181F53] text-white font-semibold rounded-lg hover:bg-[#0f1438] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="mt-6">
              {result.verified && result.message === 'authentic' ? (
                /* Success - Authentic Letter */
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        {settings.successTitle}
                      </h3>
                      <p className="text-green-700 mb-4">
                        {formatSuccessMessage(settings.successMessage)}
                      </p>
                      <div className="border-t border-green-200 pt-4">
                        <p className="text-sm text-green-700">
                          <strong>Contact for questions:</strong><br />
                          {getContactInfo().name}<br />
                          {getContactInfo().phone}<br />
                          {getContactInfo().email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Error - Invalid, Expired, or Not Found */
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">
                        {settings.failTitle}
                      </h3>
                      <p className="text-red-700 mb-4">
                        {settings.failMessage}
                      </p>
                      <div className="border-t border-red-200 pt-4">
                        <p className="text-sm text-red-700">
                          <strong>Contact for verification support:</strong><br />
                          {getContactInfo().name}<br />
                          {getContactInfo().phone}<br />
                          {getContactInfo().email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            The reference ID can be found on your pre-approval letter.
            If you have trouble locating it, please contact us for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
