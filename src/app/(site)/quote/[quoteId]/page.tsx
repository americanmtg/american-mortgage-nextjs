'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { generateQuotePDF } from '@/lib/pdf/generate-quote-pdf';

interface QuoteData {
  quoteId: string;
  firstName: string;
  lastName: string;
  loanType: string;
  purchasePrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPi: number;
  monthlyInsurance: number;
  monthlyTaxes: number;
  monthlyMip: number;
  monthlyPmi: number;
  totalMonthlyPayment: number;
  createdAt: string;
}

interface FooterSettings {
  company_name: string;
  phone: string;
  email: string;
  nmls_id: string;
  address_line1: string;
  address_line2: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCurrencyWhole = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface QuotePageSettings {
  applyButtonText: string;
  applyButtonColor: string;
  applyButtonTextColor: string;
  applyButtonUrl: string;
}

export default function QuotePage() {
  const params = useParams();
  const quoteId = params.quoteId as string;

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [pageSettings, setPageSettings] = useState<QuotePageSettings>({
    applyButtonText: 'Apply Now',
    applyButtonColor: '#181F53',
    applyButtonTextColor: '#ffffff',
    applyButtonUrl: '/apply',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quoteRes, footerRes, settingsRes] = await Promise.all([
          fetch(`/api/quotes/public/${quoteId}`),
          fetch('/api/settings/footer'),
          fetch('/api/settings/quote-page'),
        ]);

        if (!quoteRes.ok) {
          if (quoteRes.status === 404) {
            setError('Quote not found. It may have expired or been removed.');
          } else {
            setError('Failed to load quote. Please try again later.');
          }
          setLoading(false);
          return;
        }

        const quoteData = await quoteRes.json();
        setQuote(quoteData.data);

        if (footerRes.ok) {
          const footerData = await footerRes.json();
          setFooter(footerData.data);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setPageSettings(settingsData.data);
        }
      } catch {
        setError('Failed to load quote. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (quoteId) {
      fetchData();
    }
  }, [quoteId]);

  const handleDownloadPDF = async () => {
    if (!quote || !footer) return;

    await generateQuotePDF(
      {
        quoteId: quote.quoteId,
        firstName: quote.firstName,
        lastName: quote.lastName,
        loanType: quote.loanType,
        purchasePrice: quote.purchasePrice,
        downPaymentPercent: quote.downPaymentPercent,
        downPaymentAmount: quote.downPaymentAmount,
        loanAmount: quote.loanAmount,
        interestRate: quote.interestRate,
        loanTerm: quote.loanTerm,
        monthlyPi: quote.monthlyPi,
        monthlyInsurance: quote.monthlyInsurance,
        monthlyTaxes: quote.monthlyTaxes,
        monthlyMip: quote.monthlyMip,
        monthlyPmi: quote.monthlyPmi,
        totalMonthlyPayment: quote.totalMonthlyPayment,
      },
      {
        companyName: footer.company_name || 'American Mortgage',
        phone: footer.phone || '(870) 424-6505',
        email: footer.email || 'info@americanmtg.com',
        address: `${footer.address_line1 || ''} ${footer.address_line2 || ''}`.trim() || 'Arkansas',
        nmls: footer.nmls_id || 'NMLS #2560416',
        applyUrl: `${window.location.origin}/apply`,
      }
    );
  };

  const handleShare = async () => {
    const url = window.location.href;

    // Try Web Share API first (opens native share sheet on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Loan Estimate',
          text: `Check out this loan estimate for ${quote?.firstName} ${quote?.lastName}`,
          url: url,
        });
        return; // Success, don't need to copy
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if ((err as Error).name === 'AbortError') {
          return; // User cancelled, don't copy
        }
      }
    }

    // Fall back to copying to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#181F53] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'This quote could not be found.'}</p>
          <Link
            href="/calculator"
            className="inline-block bg-[#181F53] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#0f1538] transition-all"
          >
            Create New Quote
          </Link>
        </div>
      </div>
    );
  }

  const quoteDate = new Date(quote.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Get mortgage insurance label based on loan type
  const getMortgageInsuranceLabel = () => {
    if (quote.monthlyMip > 0) return 'Mortgage Insurance (MIP)';
    if (quote.monthlyPmi > 0) return 'Mortgage Insurance (PMI)';
    return null;
  };

  const mortgageInsurance = quote.monthlyMip > 0 ? quote.monthlyMip : quote.monthlyPmi;
  const mortgageInsuranceLabel = getMortgageInsuranceLabel();

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-6" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">

          {/* Header inside card */}
          <div className="px-6 pt-5 pb-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Loan Estimate</h1>
                <p className="text-xs text-gray-500 mt-0.5">for {quote.firstName} {quote.lastName}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400">{quoteDate}</span>
                <p className="text-xs text-gray-500 mt-0.5">#{quote.quoteId}</p>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="px-6 py-5">
            {/* Loan Quick Stats - Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Loan Type</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{quote.loanType}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Purchase Price</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrencyWhole(quote.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Loan Amount</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrencyWhole(quote.loanAmount)}</p>
              </div>
            </div>

            {/* Loan Quick Stats - Row 2 */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Term</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{quote.loanTerm} years</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Down Payment</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{quote.downPaymentPercent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">Rate</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{quote.interestRate.toFixed(3)}%</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mx-6"></div>

          {/* Monthly Payment Breakdown */}
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">Monthly Payment</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Principal & Interest</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(quote.monthlyPi)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Property Taxes</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(quote.monthlyTaxes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Homeowner&apos;s Insurance</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(quote.monthlyInsurance)}</span>
              </div>
              {mortgageInsurance > 0 && mortgageInsuranceLabel && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{mortgageInsuranceLabel}</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(mortgageInsurance)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Estimated Total</span>
              <span className="text-xl font-bold text-[#181F53]">{formatCurrency(quote.totalMonthlyPayment)}<span className="text-sm font-normal text-gray-500">/mo</span></span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 pt-2 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Save PDF
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </>
                )}
              </button>
            </div>
            <Link
              href={pageSettings.applyButtonUrl}
              className="flex items-center justify-center w-full px-6 py-[14px] rounded-md text-[15px] font-semibold transition-all"
              style={{
                backgroundColor: pageSettings.applyButtonColor,
                color: pageSettings.applyButtonTextColor
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(0.85)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {pageSettings.applyButtonText}
            </Link>
          </div>
        </div>

        {/* Disclosure */}
        <p className="mt-4 text-[11px] text-gray-400 leading-relaxed px-2">
          This is an estimate only and does not constitute a loan approval or commitment to lend. Actual rates, terms, and payments may vary based on credit profile and other factors. All loans subject to credit approval.
        </p>

        {/* Footer */}
        {footer && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 font-medium">{footer.company_name}</p>
            <p className="text-[11px] text-gray-400">{footer.nmls_id}</p>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link href="/calculator" className="text-sm text-[#181F53] hover:underline">
            Create new estimate
          </Link>
        </div>
      </div>
    </div>
  );
}
