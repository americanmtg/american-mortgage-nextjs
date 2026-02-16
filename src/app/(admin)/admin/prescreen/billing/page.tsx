'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from '../../../AdminContext';

interface BillingData {
  usage: {
    totalPulls: number;
    bureauPulls: Record<string, number>;
    totalBatches: number;
    totalRecords: number;
    qualifiedRecords: number;
    failedRecords: number;
    sandboxLimit: number;
    sandboxRemaining: number;
  };
  monthlyUsage: Array<{ month: string; leads: number; pulls: number }>;
  recentBatches: Array<{
    id: number;
    name: string | null;
    programName: string | null;
    status: string | null;
    totalRecords: number | null;
    qualifiedCount: number | null;
    failedCount: number | null;
    submittedBy: string | null;
    createdAt: string;
  }>;
  altairBilling: Array<{
    date: string;
    bureau: string;
    matches: number;
    base_cost: number;
    income_est: number;
    cltv: number;
    est_value: number;
    owner_status: number;
    total: number;
  }> | null;
  altairTotals: {
    cost: number;
    matches: number;
    baseCost: number;
    addOns: number;
  } | null;
  altairError: string | null;
}

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

const bureauColor = (bureau: string) => {
  const b = bureau?.toLowerCase();
  if (b === 'eq' || b === 'equifax') return 'text-red-500';
  if (b === 'tu' || b === 'transunion') return 'text-blue-500';
  if (b === 'ex' || b === 'experian') return 'text-green-500';
  return 'text-gray-500';
};

const bureauLabel = (bureau: string) => {
  const b = bureau?.toUpperCase();
  if (b === 'EQ' || b === 'EQUIFAX') return 'Equifax';
  if (b === 'TU' || b === 'TRANSUNION') return 'TransUnion';
  if (b === 'EX' || b === 'EXPERIAN') return 'Experian';
  return bureau || '\u2014';
};

const bureauShort = (bureau: string) => {
  const b = bureau?.toUpperCase();
  if (b === 'EQ' || b === 'EQUIFAX') return 'EQ';
  if (b === 'TU' || b === 'TRANSUNION') return 'TU';
  if (b === 'EX' || b === 'EXPERIAN') return 'EX';
  return bureau;
};

export default function PrescreenBillingPage() {
  const { isDark } = useTheme();
  const defaults = getMonthRange();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBilling() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/prescreen/billing?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Request failed: ${res.status}`);
      }
      const result = await res.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchBilling(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cardClass = `rounded-lg border p-5 ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`;
  const labelClass = `text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-400'}`;
  const valueClass = `text-3xl font-semibold tracking-tight mt-2 tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`;
  const smallValueClass = `text-2xl font-semibold tracking-tight mt-2 tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`;
  const thClass = `text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`;
  const tdClass = `text-sm tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  const usagePercent = data ? Math.round((data.usage.totalPulls / data.usage.sandboxLimit) * 100) : 0;
  const qualifyRate = data && data.usage.totalRecords > 0
    ? Math.round((data.usage.qualifiedRecords / data.usage.totalRecords) * 100)
    : 0;

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              Billing & Usage
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Credit usage, costs, and remaining balance
            </p>
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : error && !data ? (
        <div className={`rounded-lg border p-4 ${isDark ? 'border-red-500/30 bg-red-900/20' : 'border-red-200 bg-red-50'}`}>
          <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-600'}`}>Failed to load billing data</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-500/80'}`}>{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Credits / Usage Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={cardClass}>
              <p className={labelClass}>Credits Used</p>
              <p className={valueClass}>{data.usage.totalPulls}</p>
              <div className="mt-3">
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div
                    className={`h-2 rounded-full transition-all ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1.5 tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {data.usage.sandboxRemaining} of {data.usage.sandboxLimit} remaining
                </p>
              </div>
            </div>
            <div className={cardClass}>
              <p className={labelClass}>Records Submitted</p>
              <p className={valueClass}>{data.usage.totalRecords}</p>
              <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                across {data.usage.totalBatches} batches
              </p>
            </div>
            <div className={cardClass}>
              <p className={labelClass}>Qualified</p>
              <p className={`${valueClass} ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{data.usage.qualifiedRecords}</p>
              <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {qualifyRate}% qualify rate
              </p>
            </div>
            <div className={cardClass}>
              <p className={labelClass}>Failed / No Hit</p>
              <p className={`${valueClass} ${isDark ? 'text-red-400' : 'text-red-500'}`}>{data.usage.failedRecords}</p>
            </div>
            {data.altairTotals ? (
              <div className={cardClass}>
                <p className={labelClass}>Total Cost</p>
                <p className={valueClass}>{fmt(data.altairTotals.cost)}</p>
                <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Base: {fmt(data.altairTotals.baseCost)} + Add-ons: {fmt(data.altairTotals.addOns)}
                </p>
              </div>
            ) : (
              <div className={cardClass}>
                <p className={labelClass}>Total Cost</p>
                <p className={`text-lg font-medium mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {data.altairError ? 'Unavailable' : 'No data'}
                </p>
                {data.altairError && (
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Billing API returned an error
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bureau Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bureau Pulls */}
            <div className={cardClass}>
              <p className={`${labelClass} mb-4`}>Bureau Pulls</p>
              <div className="space-y-3">
                {['eq', 'tu', 'ex'].map(bureau => {
                  const count = data.usage.bureauPulls[bureau] || 0;
                  const pct = data.usage.totalPulls > 0 ? Math.round((count / data.usage.totalPulls) * 100) : 0;
                  return (
                    <div key={bureau}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${bureauColor(bureau)}`}>{bureauLabel(bureau)}</span>
                        <span className={`text-sm tabular-nums font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{count} pulls</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div
                          className={`h-2 rounded-full transition-all ${
                            bureau === 'eq' ? 'bg-red-400' : bureau === 'tu' ? 'bg-blue-400' : 'bg-green-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Usage */}
            <div className={cardClass}>
              <p className={`${labelClass} mb-4`}>Monthly Usage</p>
              {data.monthlyUsage.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No data yet</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                      <th className={`pb-2 ${thClass}`}>Month</th>
                      <th className={`pb-2 text-right ${thClass}`}>Leads</th>
                      <th className={`pb-2 text-right ${thClass}`}>Bureau Pulls</th>
                      <th className={`pb-2 text-right ${thClass}`}>Avg Pulls/Lead</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/40' : 'divide-gray-100'}`}>
                    {data.monthlyUsage.map(m => (
                      <tr key={m.month}>
                        <td className={`py-2 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        </td>
                        <td className={`py-2 text-right ${tdClass}`}>{m.leads}</td>
                        <td className={`py-2 text-right ${tdClass}`}>{m.pulls}</td>
                        <td className={`py-2 text-right ${tdClass}`}>{m.leads > 0 ? (m.pulls / m.leads).toFixed(1) : '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Altair Billing Detail */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <p className={labelClass}>Altair Cost Breakdown</p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs outline-none ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs outline-none ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
                <button
                  onClick={fetchBilling}
                  disabled={loading}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {data.altairError && (
              <div className={`rounded-md p-3 mb-4 ${isDark ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Altair billing API unavailable: {data.altairError}
                </p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-amber-500/60' : 'text-amber-500/80'}`}>
                  Local usage stats are shown above. Cost data requires Altair reporting API access.
                </p>
              </div>
            )}

            {data.altairBilling && data.altairBilling.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                      <th className={`px-4 py-2.5 ${thClass}`}>Date</th>
                      <th className={`px-4 py-2.5 ${thClass}`}>Bureau</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Matches</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Base</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Income</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>CLTV</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Est Value</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Owner</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Total</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/40' : 'divide-gray-100'}`}>
                    {data.altairBilling.map((r, i) => (
                      <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}`}>
                        <td className={`px-4 py-2.5 ${tdClass}`}>{r.date}</td>
                        <td className={`px-4 py-2.5`}>
                          <span className={`text-xs font-medium ${bureauColor(r.bureau)}`}>{bureauShort(r.bureau)}</span>
                        </td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{r.matches}</td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{fmt(r.base_cost)}</td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{fmt(r.income_est)}</td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{fmt(r.cltv)}</td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{fmt(r.est_value)}</td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{fmt(r.owner_status)}</td>
                        <td className={`px-4 py-2.5 text-right text-sm font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {fmt(r.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !data.altairError ? (
              <p className={`text-sm py-6 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No Altair billing data for this date range.
              </p>
            ) : null}
          </div>

          {/* Recent Batches */}
          <div className={cardClass}>
            <p className={`${labelClass} mb-4`}>Recent Batches</p>
            {data.recentBatches.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No batches yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                      <th className={`px-4 py-2.5 ${thClass}`}>Batch</th>
                      <th className={`px-4 py-2.5 ${thClass}`}>Program</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Records</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Qualified</th>
                      <th className={`px-4 py-2.5 text-right ${thClass}`}>Failed</th>
                      <th className={`px-4 py-2.5 ${thClass}`}>Submitted By</th>
                      <th className={`px-4 py-2.5 ${thClass}`}>Date</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/40' : 'divide-gray-100'}`}>
                    {data.recentBatches.map(b => (
                      <tr key={b.id} className={`transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}`}>
                        <td className={`px-4 py-2.5 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {b.name || `Batch #${b.id}`}
                        </td>
                        <td className={`px-4 py-2.5 ${tdClass}`}>{b.programName || '\u2014'}</td>
                        <td className={`px-4 py-2.5 text-right ${tdClass}`}>{b.totalRecords ?? 0}</td>
                        <td className={`px-4 py-2.5 text-right text-sm tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {b.qualifiedCount ?? 0}
                        </td>
                        <td className={`px-4 py-2.5 text-right text-sm tabular-nums ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                          {b.failedCount ?? 0}
                        </td>
                        <td className={`px-4 py-2.5 ${tdClass}`}>{b.submittedBy || '\u2014'}</td>
                        <td className={`px-4 py-2.5 text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
