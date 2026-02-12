'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from '../../../AdminContext';

interface BillingRecord {
  date: string;
  bureau: string;
  matches: number;
  base_cost: number;
  income_est: number;
  cltv: number;
  est_value: number;
  owner_status: number;
  total: number;
}

type SortKey = keyof BillingRecord;
type SortDir = 'asc' | 'desc';

const bureauBadge = (bureau: string, isDark: boolean) => {
  return isDark
    ? 'bg-gray-700/60 text-gray-300'
    : 'bg-gray-100 text-gray-600';
};

const bureauLabel = (bureau: string) => {
  const b = bureau?.toUpperCase();
  if (b === 'EQ' || b === 'EQUIFAX') return 'EQ';
  if (b === 'TU' || b === 'TRANSUNION') return 'TU';
  if (b === 'EX' || b === 'EXPERIAN') return 'EX';
  return bureau || '\u2014';
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function PrescreenReportsPage() {
  const { isDark } = useTheme();
  const defaults = getMonthRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/prescreen/reports?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      setRecords(data.data || []);
    } catch (err: any) {
      setError(err.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = Number(av) || 0;
      const bn = Number(bv) || 0;
      return sortDir === 'asc' ? an - bn : bn - an;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  const totals = useMemo(() => {
    let cost = 0, matches = 0, eq = 0, tu = 0;
    for (const r of records) {
      cost += r.total || 0;
      matches += r.matches || 0;
      const b = r.bureau?.toUpperCase();
      if (b === 'EQ' || b === 'EQUIFAX') eq += r.matches || 0;
      if (b === 'TU' || b === 'TRANSUNION') tu += r.matches || 0;
    }
    return { cost, matches, eq, tu };
  }, [records]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const thClass = `text-left text-[11px] font-medium uppercase tracking-wider cursor-pointer select-none ${
    isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
  }`;

  const arrow = (key: SortKey) =>
    sortKey === key
      ? <span className="ml-1 inline-block">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
      : null;

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/prescreen"
            className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Billing Reports
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Altair InstaPrescreen usage and cost breakdown
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className={`rounded-lg border p-4 mb-6 flex flex-wrap items-end gap-4 ${
        isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'
      }`}>
        <div>
          <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-600'
                : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
            }`}
          />
        </div>
        <div>
          <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500 focus:ring-1 focus:ring-gray-600'
                : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
            }`}
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Report'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className={`rounded-lg border p-4 mb-6 ${
          isDark
            ? 'border-red-500/30 bg-red-900/20'
            : 'border-red-300/30 bg-red-50'
        }`}>
          <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-600'}`}>
            Failed to load billing data
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-500/80'}`}>
            {error}
          </p>
          <p className={`text-xs mt-2 ${isDark ? 'text-red-400/70' : 'text-red-500/60'}`}>
            This may indicate the Altair API is unreachable or the IP is not whitelisted.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {!error && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Cost', value: fmt(totals.cost) },
            { label: 'Total Matches', value: totals.matches.toLocaleString() },
            { label: 'EQ Matches', value: totals.eq.toLocaleString() },
            { label: 'TU Matches', value: totals.tu.toLocaleString() },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-lg border p-5 ${
                isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'
              }`}
            >
              <p className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                {card.label}
              </p>
              <p className={`text-3xl font-semibold tracking-tight mt-2 tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Billing Table */}
      {!loading && !error && (
        <div className={`rounded-lg border overflow-hidden ${
          isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('date')}>
                    Date{arrow('date')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('bureau')}>
                    Bureau{arrow('bureau')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('matches')}>
                    Matches{arrow('matches')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('base_cost')}>
                    Base Cost{arrow('base_cost')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('income_est')}>
                    Income Est{arrow('income_est')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('cltv')}>
                    CLTV{arrow('cltv')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('est_value')}>
                    Est. Value{arrow('est_value')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('owner_status')}>
                    Owner Status{arrow('owner_status')}
                  </th>
                  <th className={`px-5 py-3.5 ${thClass}`} onClick={() => handleSort('total')}>
                    Total{arrow('total')}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`px-5 py-8 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No billing data for this date range.
                    </td>
                  </tr>
                ) : (
                  sorted.map((r, i) => (
                    <tr
                      key={i}
                      className={`transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}`}
                    >
                      <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {r.date}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs rounded-full font-medium ${bureauBadge(r.bureau, isDark)}`}>
                          {bureauLabel(r.bureau)}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {r.matches}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {fmt(r.base_cost)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {fmt(r.income_est)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {fmt(r.cltv)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {fmt(r.est_value)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {fmt(r.owner_status)}
                      </td>
                      <td className={`px-5 py-3.5 text-sm font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {fmt(r.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
