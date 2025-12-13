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

export default function QuotePage() {
  const params = useParams();
  const quoteId = params.quoteId as string;

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch quote and footer settings in parallel
        const [quoteRes, footerRes] = await Promise.all([
          fetch(`/api/quotes/public/${quoteId}`),
          fetch('/api/settings/footer')
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
      } catch (err) {
        setError('Failed to load quote. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (quoteId) {
      fetchData();
    }
  }, [quoteId]);

  const handleDownloadPDF = () => {
    if (!quote || !footer) return;

    generateQuotePDF(
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

  const handleCopyLink = async () => {
    const url = window.location.href;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181F53] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your quote...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Quote Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This quote could not be found.'}</p>
          <Link
            href="/calculator"
            className="inline-block bg-[#181F53] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0f1538] transition-colors"
          >
            Create New Quote
          </Link>
        </div>
      </div>
    );
  }

  const quoteDate = new Date(quote.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#181F53] text-white rounded-t-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Loan Estimate</h1>
              <p className="text-blue-200">Quote #{quote.quoteId}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-blue-200">Created</p>
              <p>{quoteDate}</p>
            </div>
          </div>
        </div>

        {/* Quote Content */}
        <div className="bg-white shadow-lg rounded-b-xl overflow-hidden">
          {/* Prepared For */}
          <div className="p-6 border-b">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prepared For</p>
            <p className="text-xl font-semibold text-gray-900">{quote.firstName} {quote.lastName}</p>
          </div>

          {/* Loan Details */}
          <div className="p-6 border-b">
            <h2 className="text-sm font-semibold text-[#181F53] uppercase tracking-wide mb-4">Loan Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Loan Type</p>
                <p className="font-medium">{quote.loanType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Loan Amount</p>
                <p className="font-medium">{formatCurrency(quote.loanAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Purchase Price</p>
                <p className="font-medium">{formatCurrency(quote.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Interest Rate</p>
                <p className="font-medium">{quote.interestRate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Down Payment</p>
                <p className="font-medium">{formatCurrency(quote.downPaymentAmount)} ({quote.downPaymentPercent.toFixed(1)}%)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Loan Term</p>
                <p className="font-medium">{quote.loanTerm} years</p>
              </div>
            </div>
          </div>

          {/* Monthly Payment */}
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-[#181F53] uppercase tracking-wide mb-4">Estimated Monthly Payment</h2>
            <div className="bg-[#181F53] text-white rounded-lg p-4 text-center mb-4">
              <p className="text-3xl font-bold">{formatCurrency(quote.totalMonthlyPayment)}</p>
              <p className="text-blue-200 text-sm">per month</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Principal & Interest</span>
                <span className="font-medium">{formatCurrency(quote.monthlyPi)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Property Insurance</span>
                <span className="font-medium">{formatCurrency(quote.monthlyInsurance)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Property Taxes</span>
                <span className="font-medium">{formatCurrency(quote.monthlyTaxes)}</span>
              </div>
              {quote.monthlyMip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">FHA Mortgage Insurance (MIP)</span>
                  <span className="font-medium">{formatCurrency(quote.monthlyMip)}</span>
                </div>
              )}
              {quote.monthlyPmi > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Private Mortgage Insurance (PMI)</span>
                  <span className="font-medium">{formatCurrency(quote.monthlyPmi)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 bg-[#181F53] text-white px-4 py-3 rounded-lg font-medium hover:bg-[#0f1538] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 border-2 border-[#181F53] text-[#181F53] px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
            </div>
            <Link
              href="/apply"
              className="block w-full bg-green-600 text-white text-center px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Apply Now
            </Link>
          </div>

          {/* Disclosure */}
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Disclosure:</strong> This is an estimate only and does not constitute a loan approval, commitment to lend, or guarantee of rates or terms. Actual rates, terms, fees, and monthly payments may vary based on your credit profile, property type, loan-to-value ratio, and other factors. Interest rates are subject to change without notice. All loans are subject to credit approval.
            </p>
          </div>

          {/* Footer */}
          {footer && (
            <div className="bg-gray-100 px-6 py-4 text-center text-sm text-gray-600">
              <p className="font-medium">{footer.company_name}</p>
              <p>{footer.nmls_id}</p>
              <p>Equal Housing Opportunity</p>
            </div>
          )}
        </div>

        {/* Back to Calculator */}
        <div className="text-center mt-6">
          <Link
            href="/calculator"
            className="text-[#181F53] hover:underline"
          >
            Create a new quote
          </Link>
        </div>
      </div>
    </div>
  );
}
