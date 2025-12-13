'use client';

import { useEffect, useState } from 'react';

interface Quote {
  id: number;
  quoteId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LoanOfficer {
  id: number;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

const formatCurrency = (value: number, decimals: boolean = false) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Loan officers
  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [selectedLoanOfficerId, setSelectedLoanOfficerId] = useState<number | null>(null);

  // Send message modal state
  const [sendMessageQuote, setSendMessageQuote] = useState<Quote | null>(null);
  const [sendChannel, setSendChannel] = useState<'email' | 'sms' | 'both'>('both');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendResult, setSendResult] = useState<{ email?: { success: boolean; error?: string }; sms?: { success: boolean; error?: string } } | null>(null);

  // Generate quote modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingQuote, setGeneratingQuote] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    loanType: 'Conventional',
    purchasePrice: '',
    downPaymentPercent: '20',
    interestRate: '6.5',
    loanTerm: '30',
    monthlyInsurance: '150',
    monthlyTaxes: '250',
  });

  const getQuoteUrl = (quoteId: string) => {
    return `${window.location.origin}/quote/${quoteId}`;
  };

  const copyQuoteLink = async (quoteId: string) => {
    try {
      await navigator.clipboard.writeText(getQuoteUrl(quoteId));
      setCopiedId(quoteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openSendMessage = (quote: Quote) => {
    setSendMessageQuote(quote);
    setSendChannel('both');
    setCustomMessage('');
    setSendResult(null);
    setSelectedLoanOfficerId(null);
  };

  const closeSendMessage = () => {
    setSendMessageQuote(null);
    setSendResult(null);
  };

  const handleSendMessage = async () => {
    if (!sendMessageQuote) return;

    setSendingMessage(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/quotes/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quoteId: sendMessageQuote.quoteId,
          channel: sendChannel,
          customMessage: customMessage.trim() || undefined,
          loanOfficerId: selectedLoanOfficerId || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSendResult(data.results);
      } else {
        setSendResult({
          email: { success: false, error: data.error },
          sms: { success: false, error: data.error },
        });
      }
    } catch (err) {
      setSendResult({
        email: { success: false, error: 'Network error' },
        sms: { success: false, error: 'Network error' },
      });
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchLoanOfficers();
  }, [pagination.page, search]);

  async function fetchLoanOfficers() {
    try {
      const res = await fetch('/api/loan-officers?activeOnly=true', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLoanOfficers(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching loan officers:', err);
    }
  }

  async function fetchQuotes() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/quotes?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.data || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setQuotes(quotes.filter(q => q.id !== id));
        if (selectedQuote?.id === id) setSelectedQuote(null);
      }
    } catch (err) {
      console.error('Error deleting quote:', err);
    } finally {
      setDeleting(null);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchQuotes();
  }

  function exportToCSV() {
    const headers = ['Quote ID', 'Name', 'Phone', 'Email', 'Loan Type', 'Purchase Price', 'Down Payment', 'Loan Amount', 'Rate', 'Term', 'Monthly Payment', 'Date'];
    const rows = quotes.map(q => [
      q.quoteId,
      `${q.firstName} ${q.lastName}`,
      q.phone || '',
      q.email || '',
      q.loanType,
      q.purchasePrice,
      q.downPaymentAmount,
      q.loanAmount,
      `${q.interestRate}%`,
      `${q.loanTerm} years`,
      q.totalMonthlyPayment.toFixed(2),
      new Date(q.createdAt).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // Calculate monthly payment for generate quote
  function calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return principal / numPayments;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  async function handleGenerateQuote() {
    const { firstName, lastName, phone, email, loanType, purchasePrice, downPaymentPercent, interestRate, loanTerm, monthlyInsurance, monthlyTaxes } = generateForm;

    if (!firstName.trim() || !lastName.trim() || !purchasePrice) {
      alert('First name, last name, and purchase price are required');
      return;
    }

    const price = parseFloat(purchasePrice);
    const dpPercent = parseFloat(downPaymentPercent) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseInt(loanTerm) || 30;
    const insurance = parseFloat(monthlyInsurance) || 0;
    const taxes = parseFloat(monthlyTaxes) || 0;

    const downPaymentAmount = price * (dpPercent / 100);
    const loanAmount = price - downPaymentAmount;
    const monthlyPi = calculateMonthlyPayment(loanAmount, rate, term);

    // Calculate MIP for FHA loans
    let monthlyMip = 0;
    if (loanType === 'FHA') {
      monthlyMip = (loanAmount * 0.0055) / 12; // 0.55% annual MIP
    }

    // Calculate PMI for conventional with less than 20% down
    let monthlyPmi = 0;
    if (loanType === 'Conventional' && dpPercent < 20) {
      monthlyPmi = (loanAmount * 0.005) / 12; // Estimated 0.5% annual PMI
    }

    const totalMonthlyPayment = monthlyPi + insurance + taxes + monthlyMip + monthlyPmi;

    setGeneratingQuote(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          loanType,
          purchasePrice: price,
          downPaymentPercent: dpPercent,
          downPaymentAmount,
          loanAmount,
          interestRate: rate,
          loanTerm: term,
          monthlyPi,
          monthlyInsurance: insurance,
          monthlyTaxes: taxes,
          monthlyMip,
          monthlyPmi,
          totalMonthlyPayment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowGenerateModal(false);
        setGenerateForm({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          loanType: 'Conventional',
          purchasePrice: '',
          downPaymentPercent: '20',
          interestRate: '6.5',
          loanTerm: '30',
          monthlyInsurance: '150',
          monthlyTaxes: '250',
        });
        fetchQuotes();
        alert(`Quote #${data.data.quoteId} created successfully!`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create quote');
      }
    } catch (err) {
      console.error('Error creating quote:', err);
      alert('Failed to create quote');
    } finally {
      setGeneratingQuote(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quote Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination.total} total quote{pagination.total !== 1 ? 's' : ''} generated
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Quote
          </button>
          <button
            onClick={exportToCSV}
            disabled={quotes.length === 0}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or quote ID..."
          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No quotes found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Quote ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Loan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{quote.quoteId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {quote.firstName} {quote.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <div>{quote.phone || '—'}</div>
                      <div className="text-gray-400">{quote.email || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {quote.loanType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {formatCurrency(quote.loanAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(quote.totalMonthlyPayment, true)}/mo
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/quote/${quote.quoteId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                          title="View quote page"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => copyQuoteLink(quote.quoteId)}
                          className={`p-1.5 rounded ${copiedId === quote.quoteId ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                          title={copiedId === quote.quoteId ? 'Copied!' : 'Copy link'}
                        >
                          {copiedId === quote.quoteId ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => openSendMessage(quote)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                          title="Send message"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                          title="View details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          disabled={deleting === quote.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedQuote && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQuote(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quote Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{selectedQuote.quoteId}</p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuote.firstName} {selectedQuote.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuote.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuote.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedQuote.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Loan Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuote.loanType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Purchase Price</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.purchasePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Down Payment</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.downPaymentAmount)} ({selectedQuote.downPaymentPercent.toFixed(1)}%)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loan Amount</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interest Rate</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuote.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Loan Term</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuote.loanTerm} years</p>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Monthly Payment Breakdown</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Principal & Interest</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.monthlyPi, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Property Insurance</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.monthlyInsurance, true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Property Taxes</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.monthlyTaxes, true)}</span>
                  </div>
                  {selectedQuote.monthlyMip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">FHA MIP</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.monthlyMip, true)}</span>
                    </div>
                  )}
                  {selectedQuote.monthlyPmi > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">PMI</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedQuote.monthlyPmi, true)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Monthly</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(selectedQuote.totalMonthlyPayment, true)}</span>
                  </div>
                </div>
              </div>

              {/* Share Link */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Share Quote</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={getQuoteUrl(selectedQuote.quoteId)}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300"
                  />
                  <button
                    onClick={() => copyQuoteLink(selectedQuote.quoteId)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      copiedId === selectedQuote.quoteId
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {copiedId === selectedQuote.quoteId ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={`/quote/${selectedQuote.quoteId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Open
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {sendMessageQuote && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeSendMessage}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Message</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    To: {sendMessageQuote.firstName} {sendMessageQuote.lastName} (Quote #{sendMessageQuote.quoteId})
                  </p>
                </div>
                <button
                  onClick={closeSendMessage}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Contact Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {sendMessageQuote.email || <span className="text-gray-400 italic">No email on file</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">
                    {sendMessageQuote.phone || <span className="text-gray-400 italic">No phone on file</span>}
                  </span>
                </div>
              </div>

              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send via
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    sendChannel === 'email'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${!sendMessageQuote.email ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="channel"
                      value="email"
                      checked={sendChannel === 'email'}
                      onChange={() => setSendChannel('email')}
                      disabled={!sendMessageQuote.email}
                      className="sr-only"
                    />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    sendChannel === 'sms'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${!sendMessageQuote.phone ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="channel"
                      value="sms"
                      checked={sendChannel === 'sms'}
                      onChange={() => setSendChannel('sms')}
                      disabled={!sendMessageQuote.phone}
                      className="sr-only"
                    />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    SMS
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    sendChannel === 'both'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  } ${!sendMessageQuote.email || !sendMessageQuote.phone ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="radio"
                      name="channel"
                      value="both"
                      checked={sendChannel === 'both'}
                      onChange={() => setSendChannel('both')}
                      disabled={!sendMessageQuote.email || !sendMessageQuote.phone}
                      className="sr-only"
                    />
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Both
                  </label>
                </div>
              </div>

              {/* Loan Officer Selection (for email from address) */}
              {(sendChannel === 'email' || sendChannel === 'both') && loanOfficers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send Email From
                  </label>
                  <select
                    value={selectedLoanOfficerId || ''}
                    onChange={(e) => setSelectedLoanOfficerId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">quotes@americanmtg.com (Default)</option>
                    {loanOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name} ({officer.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Select a loan officer to send the email from their address
                  </p>
                </div>
              )}

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                  placeholder="Leave blank to send the standard quote confirmation message, or enter a custom message..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  The quote link will be automatically included in the message.
                </p>
              </div>

              {/* Send Result */}
              {sendResult && (
                <div className="space-y-2">
                  {sendResult.email && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      sendResult.email.success
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {sendResult.email.success ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      Email: {sendResult.email.success ? 'Sent successfully' : sendResult.email.error}
                    </div>
                  )}
                  {sendResult.sms && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      sendResult.sms.success
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {sendResult.sms.success ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      SMS: {sendResult.sms.success ? 'Sent successfully' : sendResult.sms.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={closeSendMessage}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium"
              >
                {sendResult ? 'Close' : 'Cancel'}
              </button>
              {!sendResult && (
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || (!sendMessageQuote.email && !sendMessageQuote.phone)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Quote Modal */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGenerateModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Quote</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={generateForm.firstName}
                    onChange={(e) => setGenerateForm({ ...generateForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={generateForm.lastName}
                    onChange={(e) => setGenerateForm({ ...generateForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={generateForm.phone}
                    onChange={(e) => setGenerateForm({ ...generateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="(870) 555-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={generateForm.email}
                    onChange={(e) => setGenerateForm({ ...generateForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* Loan Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loan Type
                  </label>
                  <select
                    value={generateForm.loanType}
                    onChange={(e) => setGenerateForm({ ...generateForm, loanType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="USDA">USDA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Price *
                  </label>
                  <input
                    type="number"
                    value={generateForm.purchasePrice}
                    onChange={(e) => setGenerateForm({ ...generateForm, purchasePrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="350000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Down Payment %
                  </label>
                  <input
                    type="number"
                    value={generateForm.downPaymentPercent}
                    onChange={(e) => setGenerateForm({ ...generateForm, downPaymentPercent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="20"
                    step="0.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate %
                  </label>
                  <input
                    type="number"
                    value={generateForm.interestRate}
                    onChange={(e) => setGenerateForm({ ...generateForm, interestRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="6.5"
                    step="0.125"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loan Term (years)
                  </label>
                  <select
                    value={generateForm.loanTerm}
                    onChange={(e) => setGenerateForm({ ...generateForm, loanTerm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  >
                    <option value="30">30 years</option>
                    <option value="20">20 years</option>
                    <option value="15">15 years</option>
                    <option value="10">10 years</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Insurance
                  </label>
                  <input
                    type="number"
                    value={generateForm.monthlyInsurance}
                    onChange={(e) => setGenerateForm({ ...generateForm, monthlyInsurance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Taxes
                  </label>
                  <input
                    type="number"
                    value={generateForm.monthlyTaxes}
                    onChange={(e) => setGenerateForm({ ...generateForm, monthlyTaxes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="250"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                * If email/phone is provided, the customer will automatically receive a confirmation with their quote link.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateQuote}
                disabled={generatingQuote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generatingQuote ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Create Quote
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
