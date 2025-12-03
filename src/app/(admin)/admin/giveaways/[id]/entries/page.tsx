'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Referral {
  id: number;
  firstName: string;
  lastName: string;
  convertedAt: string;
  bonusAwarded: number;
}

interface Entry {
  id: number;
  giveawayId: number;
  email: string | null;
  phone: string;
  firstName: string;
  lastName: string;
  state: string;
  zipCode: string | null;
  smsOptIn: boolean;
  emailOptIn: boolean;
  agreedToRules: boolean;
  ipAddress: string | null;
  entrySource: string | null;
  referralCode: string | null;
  isValid: boolean;
  invalidationReason: string | null;
  createdAt: string;
  isWinner: boolean;
  winnerInfo: {
    id: number;
    winner_type: string;
    status: string;
  } | null;
  // Entry breakdown fields
  entryCount: number;
  baseEntries: number;
  bonusEntries: number;
  bonusClaimed: boolean;
  secondaryContact: string | null;
  referralEntries: number;
  myReferralCode: string | null;
  referrals: Referral[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EntriesPage() {
  const params = useParams();
  const id = params.id as string;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [validOnly, setValidOnly] = useState(false);
  const [giveawayTitle, setGiveawayTitle] = useState('');

  useEffect(() => {
    fetchGiveaway();
    fetchEntries();
  }, [id, pagination.page, validOnly]);

  async function fetchGiveaway() {
    try {
      const res = await fetch(`/api/giveaways/${id}`, { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setGiveawayTitle(result.data?.title || '');
      }
    } catch {
      // Ignore errors
    }
  }

  async function fetchEntries() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (validOnly) params.set('validOnly', 'true');
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/giveaways/${id}/entries?${params}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch entries');
      }

      const result = await res.json();
      setEntries(result.data?.items || []);
      setPagination(prev => ({
        ...prev,
        ...result.data?.pagination,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchEntries();
  }

  async function handleInvalidate(entryId: number) {
    const reason = prompt('Enter reason for invalidation:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/giveaways/${id}/entries`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entryId,
          isValid: false,
          invalidationReason: reason,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to invalidate entry');
      }

      fetchEntries();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRevalidate(entryId: number) {
    try {
      const res = await fetch(`/api/giveaways/${id}/entries`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          entryId,
          isValid: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to revalidate entry');
      }

      fetchEntries();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatPhone(phone: string) {
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/giveaways/${id}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Giveaway Entries</h1>
            <p className="text-gray-600">{giveawayTitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          <p className="text-sm text-gray-500">Total Entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={validOnly}
              onChange={(e) => setValidOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Valid only</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading entries...</p>
        </div>
      )}

      {/* Entries Table */}
      {!isLoading && entries.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
          <p className="text-gray-500">Entries will appear here once people enter the giveaway</p>
        </div>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrant
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entries
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opt-ins
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entered
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className={`hover:bg-gray-50 ${!entry.isValid ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {entry.firstName} {entry.lastName}
                        </p>
                        {entry.isWinner && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.winnerInfo?.winner_type === 'primary'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {entry.winnerInfo?.winner_type === 'primary' ? 'Winner' : 'Alternate'}
                          </span>
                        )}
                        {entry.referrals && entry.referrals.length > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {entry.referrals.length} referral{entry.referrals.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Entry Count with breakdown */}
                    <td className="px-6 py-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {entry.baseEntries + entry.bonusEntries + entry.referralEntries}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600" title="Base entry">
                            {entry.baseEntries} base
                          </span>
                          {entry.bonusEntries > 0 && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700" title="Bonus for providing email">
                              +{entry.bonusEntries} bonus
                            </span>
                          )}
                          {entry.referralEntries > 0 && (
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700" title="Bonus from referrals">
                              +{entry.referralEntries} ref
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {entry.email ? (
                          <p className="text-gray-900">{entry.email}</p>
                        ) : (
                          <p className="text-gray-400 italic">No email</p>
                        )}
                        <p className="text-gray-500">{formatPhone(entry.phone)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{entry.state}</p>
                        {entry.zipCode && <p className="text-gray-500">{entry.zipCode}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span title="Email Opt-in" className={`w-6 h-6 rounded-full flex items-center justify-center ${entry.emailOptIn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <span title="SMS Opt-in" className={`w-6 h-6 rounded-full flex items-center justify-center ${entry.smsOptIn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {entry.isValid ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Valid
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Invalid
                          </span>
                          {entry.invalidationReason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={entry.invalidationReason}>
                              {entry.invalidationReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{formatDate(entry.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.isValid ? (
                          <button
                            onClick={() => handleInvalidate(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Invalidate"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevalidate(entry.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Revalidate"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
