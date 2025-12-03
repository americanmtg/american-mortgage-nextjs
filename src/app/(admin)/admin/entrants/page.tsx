'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface GiveawayEntry {
  giveawayId: number;
  giveawayTitle: string;
  entryCount: number;
  enteredAt: string;
  isWinner: boolean;
}

interface Entrant {
  id: number;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  state: string | null;
  zipCode: string | null;
  smsOptIn: boolean;
  firstEntry: string;
  totalEntries: number;
  giveawaysEntered: number;
  giveaways: GiveawayEntry[];
}

export default function EntrantsPage() {
  const [entrants, setEntrants] = useState<Entrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEntrant, setExpandedEntrant] = useState<number | null>(null);

  useEffect(() => {
    fetchEntrants();
  }, []);

  async function fetchEntrants() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/entrants', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch entrants');
      }

      const result = await res.json();
      setEntrants(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const filteredEntrants = entrants.filter(entrant => {
    const search = searchTerm.toLowerCase();
    return (
      entrant.email.toLowerCase().includes(search) ||
      entrant.firstName.toLowerCase().includes(search) ||
      entrant.lastName.toLowerCase().includes(search) ||
      (entrant.phone && entrant.phone.includes(search))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Global Entrant Database</h1>
        <p className="text-gray-600 mt-1">View all entrants across all giveaways</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Entrants</p>
          <p className="text-2xl font-bold text-gray-900">{entrants.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">SMS Opt-ins</p>
          <p className="text-2xl font-bold text-gray-900">
            {entrants.filter(e => e.smsOptIn).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Entries</p>
          <p className="text-2xl font-bold text-gray-900">
            {entrants.reduce((sum, e) => sum + e.totalEntries, 0)}
          </p>
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
          <p className="text-gray-500">Loading entrants...</p>
        </div>
      )}

      {/* Entrants List */}
      {!isLoading && filteredEntrants.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {searchTerm ? 'No entrants match your search.' : 'No entrants yet.'}
          </p>
        </div>
      )}

      {!isLoading && filteredEntrants.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrant
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giveaways
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Entries
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Entry
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEntrants.map((entrant) => (
                <>
                  <tr
                    key={entrant.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedEntrant(expandedEntrant === entrant.id ? null : entrant.id)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {entrant.firstName} {entrant.lastName}
                        </p>
                        {entrant.state && (
                          <p className="text-sm text-gray-500">
                            {entrant.state}{entrant.zipCode && ` ${entrant.zipCode}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900">{entrant.email}</p>
                        {entrant.phone && (
                          <p className="text-gray-500 flex items-center gap-1">
                            {entrant.phone}
                            {entrant.smsOptIn && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                SMS
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {entrant.giveawaysEntered}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-semibold text-blue-600">
                        {entrant.totalEntries}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(entrant.firstEntry)}
                    </td>
                    <td className="px-6 py-4">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedEntrant === entrant.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </td>
                  </tr>

                  {/* Expanded Giveaway Details */}
                  {expandedEntrant === entrant.id && (
                    <tr key={`${entrant.id}-details`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-3">Giveaway Participation:</p>
                          {entrant.giveaways.map((giveaway) => (
                            <div
                              key={giveaway.giveawayId}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                            >
                              <div className="flex items-center gap-3">
                                {giveaway.isWinner && (
                                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                  </div>
                                )}
                                <div>
                                  <Link
                                    href={`/admin/giveaways/${giveaway.giveawayId}`}
                                    className="font-medium text-gray-900 hover:text-blue-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {giveaway.giveawayTitle}
                                  </Link>
                                  {giveaway.isWinner && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Winner
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-gray-500">
                                  <span className="font-medium text-gray-900">{giveaway.entryCount}</span> entries
                                </div>
                                <div className="text-gray-500">
                                  Entered {formatDate(giveaway.enteredAt)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
