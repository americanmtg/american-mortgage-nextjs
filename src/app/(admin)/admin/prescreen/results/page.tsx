'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '../../../AdminContext';
import { getFriendlyName, formatAttributeValue } from '@/lib/altair-attributes';

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  ssnLastFour: string | null;
  middleScore: number | null;
  tier: string;
  isQualified: boolean;
  matchStatus: string;
  bureauScores: Record<string, number | null>;
  programName: string;
  programId: number;
  batchId: number | null;
  batchName: string | null;
  firmOfferSent: boolean | null;
  firmOfferDate: string | null;
  firmOfferMethod: string | null;
  createdAt: string;
}

interface Program {
  id: number;
  name: string;
}

function formatId(id: number) {
  return String(id).padStart(2, '0');
}

const tierBadge = (tier: string, isDark: boolean) => {
  switch (tier) {
    case 'tier_1': return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    case 'tier_2': return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700';
    case 'tier_3': return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700';
    case 'below': return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
    case 'filtered': return isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-500';
    default: return isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600';
  }
};

const tierLabel = (tier: string, matchStatus?: string) => {
  switch (tier) {
    case 'tier_1': return 'Tier 1';
    case 'tier_2': return 'Tier 2';
    case 'tier_3': return 'Tier 3';
    case 'below': return 'Below';
    case 'filtered': return matchStatus === 'no_match' ? 'No Match' : 'Unqualified';
    default: return 'Pending';
  }
};

const bureauBadge: Record<string, string> = {
  eq: 'bg-red-50 text-red-700',
  tu: 'bg-blue-50 text-blue-700',
  ex: 'bg-purple-50 text-purple-700',
};

const bureauBadgeDark: Record<string, string> = {
  eq: 'bg-red-900/30 text-red-400',
  tu: 'bg-blue-900/30 text-blue-400',
  ex: 'bg-purple-900/30 text-purple-400',
};

const bureauLabel: Record<string, string> = {
  eq: 'Equifax',
  tu: 'TransUnion',
  ex: 'Experian',
};

export default function PrescreenResults() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || '');
  const [programFilter, setProgramFilter] = useState(searchParams.get('programId') || '');
  const [batchFilter, setBatchFilter] = useState(searchParams.get('batchId') || '');
  const [minScore, setMinScore] = useState(searchParams.get('minScore') || '');
  const [maxScore, setMaxScore] = useState(searchParams.get('maxScore') || '');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Expanded rows
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);

  // Retry queue
  const [queuedIds, setQueuedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/prescreen/programs', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setPrograms(data.data?.items || []))
      .catch(console.error);
    fetch('/api/prescreen/retry-queue', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setQueuedIds(new Set((data.data?.leads || []).map((l: any) => l.id))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadResults();
  }, [page, tierFilter, programFilter, batchFilter, minScore, maxScore, sortBy, sortDir]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (search) params.set('search', search);
      if (tierFilter) params.set('tier', tierFilter);
      if (programFilter) params.set('programId', programFilter);
      if (batchFilter) params.set('batchId', batchFilter);
      if (minScore) params.set('minScore', minScore);
      if (maxScore) params.set('maxScore', maxScore);
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);

      const res = await fetch(`/api/prescreen/results?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data.items || []);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadResults();
  };

  const toggleExpand = async (leadId: number) => {
    if (expandedId === leadId) {
      setExpandedId(null);
      setExpandedData(null);
      return;
    }
    try {
      const res = await fetch(`/api/prescreen/results/${leadId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setExpandedData(data.data);
        setExpandedId(leadId);
      }
    } catch (err) {
      console.error('Failed to load detail:', err);
    }
  };

  const toggleRetryQueue = async (leadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const isQueued = queuedIds.has(leadId);
    const newQueued = !isQueued;
    try {
      const res = await fetch('/api/prescreen/retry-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds: [leadId], queued: newQueued }),
      });
      if (res.ok) {
        setQueuedIds((prev) => {
          const next = new Set(prev);
          if (newQueued) next.add(leadId); else next.delete(leadId);
          return next;
        });
      }
    } catch { /* ignore */ }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: string }) => (
    <svg className={`w-3 h-3 ml-0.5 inline-block transition-opacity ${sortBy === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {sortBy === field && sortDir === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );

  const inputBase = `px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 placeholder-gray-400'
  }`;
  const selectBase = `px-3 py-2 pr-10 rounded-lg border text-sm outline-none transition-all cursor-pointer ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/prescreen"
            className={`p-2 rounded-md transition-colors ${isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Prescreen Results
            </h1>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {total} total results
            </p>
          </div>
        </div>
        <Link
          href="/admin/prescreen/submit"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm ${isDark ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
        >
          New Submission
        </Link>
      </div>

      {/* Filters */}
      <div className={`rounded-lg border p-4 ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200 shadow-sm'}`}>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or ID..."
            className={`${inputBase} flex-1 min-w-[200px]`}
          />
          <select value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setPage(1); }} className={selectBase}>
            <option value="">All Tiers</option>
            <option value="tier_1">Tier 1 (620+)</option>
            <option value="tier_2">Tier 2 (580-619)</option>
            <option value="tier_3">Tier 3 (500-579)</option>
            <option value="below">Below (under 500)</option>
            <option value="filtered">Unqualified</option>
            <option value="pending">Pending</option>
          </select>
          <select value={programFilter} onChange={(e) => { setProgramFilter(e.target.value); setPage(1); }} className={selectBase}>
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {batchFilter && (
            <button
              type="button"
              onClick={() => { setBatchFilter(''); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              Batch #{batchFilter}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {(minScore || maxScore) && (
            <button
              type="button"
              onClick={() => { setMinScore(''); setMaxScore(''); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
            >
              Score: {minScore && maxScore ? `${minScore} - ${maxScore}` : minScore ? `${minScore}+` : `Under ${parseInt(maxScore) + 1}`}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button type="submit" className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm ${isDark ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            Search
          </button>
        </form>
      </div>

      {/* Results Table */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200 shadow-sm'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`w-5 h-5 border-2 ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-200 border-t-gray-600'} rounded-full animate-spin`} />
          </div>
        ) : leads.length === 0 ? (
          <p className={`text-center py-12 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No results found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                  {[
                    { key: '', label: 'ID' },
                    { key: 'last_name', label: 'Name' },
                    { key: 'middle_score', label: 'Score' },
                    { key: 'tier', label: 'Tier' },
                    { key: '', label: 'EQ' },
                    { key: '', label: 'TU' },
                    { key: '', label: 'EX' },
                    { key: '', label: 'Cost' },
                    { key: 'firm_offer_sent', label: 'Firm Offer' },
                    { key: 'created_at', label: 'Date' },
                    { key: '', label: '' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      onClick={col.key ? () => handleSort(col.key) : undefined}
                      className={`px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider whitespace-nowrap group ${
                        col.key ? 'cursor-pointer select-none' : ''
                      } ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                    >
                      {col.label}
                      {col.key && <SortIcon field={col.key} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <>
                    <tr
                      key={lead.id}
                      onClick={() => toggleExpand(lead.id)}
                      className={`cursor-pointer transition-colors ${
                        isDark
                          ? `hover:bg-gray-700/20 ${idx !== leads.length - 1 || expandedId === lead.id ? 'border-b border-gray-700/30' : ''}`
                          : `hover:bg-gray-50/80 ${idx !== leads.length - 1 || expandedId === lead.id ? 'border-b border-gray-100/80' : ''}`
                      } ${expandedId === lead.id ? (isDark ? 'bg-gray-700/10' : 'bg-gray-50/50') : ''}`}
                    >
                      <td className={`px-5 py-3.5 text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatId(lead.id)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {lead.firstName} {lead.lastName}
                        </span>
                        {lead.ssnLastFour && (
                          <span className={`ml-2 text-[11px] ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                            ***{lead.ssnLastFour}
                          </span>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums font-semibold ${
                        lead.middleScore != null
                          ? (isDark ? 'text-white' : 'text-gray-900')
                          : (isDark ? 'text-gray-600' : 'text-gray-300')
                      }`}>
                        {lead.middleScore ?? '\u2014'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${tierBadge(lead.tier, isDark)}`}>
                          {tierLabel(lead.tier, lead.matchStatus)}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${lead.bureauScores?.eq != null ? (isDark ? 'text-gray-300' : 'text-gray-700') : (isDark ? 'text-gray-700' : 'text-gray-200')}`}>
                        {lead.bureauScores?.eq ?? '\u2014'}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${lead.bureauScores?.tu != null ? (isDark ? 'text-gray-300' : 'text-gray-700') : (isDark ? 'text-gray-700' : 'text-gray-200')}`}>
                        {lead.bureauScores?.tu ?? '\u2014'}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${lead.bureauScores?.ex != null ? (isDark ? 'text-gray-300' : 'text-gray-700') : (isDark ? 'text-gray-700' : 'text-gray-200')}`}>
                        {lead.bureauScores?.ex ?? '\u2014'}
                      </td>
                      <td className={`px-5 py-3.5 text-sm tabular-nums ${isDark ? 'text-gray-700' : 'text-gray-200'}`}>
                        {'\u2014'}
                      </td>
                      <td className="px-5 py-3.5">
                        {lead.firmOfferSent ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                            Sent{lead.firmOfferMethod ? ` (${lead.firmOfferMethod})` : ''}
                          </span>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{'\u2014'}</span>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3.5">
                        {(lead.matchStatus === 'api_error' || lead.matchStatus === 'no_match' || lead.tier === 'pending' || (lead.tier === 'filtered' && lead.matchStatus === 'matched')) && (
                          <button
                            onClick={(e) => toggleRetryQueue(lead.id, e)}
                            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                              queuedIds.has(lead.id)
                                ? (isDark ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50' : 'bg-amber-50 text-amber-700 hover:bg-amber-100')
                                : (isDark ? 'bg-gray-700/60 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')
                            }`}
                          >
                            {queuedIds.has(lead.id) ? 'Queued' : '+ Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === lead.id && expandedData && (
                      <tr key={`${lead.id}-expanded`}>
                        <td colSpan={11} className={`px-6 py-5 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
                          {/* Error message for failed leads - keep red for genuine errors */}
                          {expandedData.errorMessage && (
                            <div className={`rounded-lg border px-4 py-3 mb-4 ${isDark ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50/80 border-red-300/40'}`}>
                              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{expandedData.errorMessage}</p>
                            </div>
                          )}

                          {/* Bureau cards */}
                          {expandedData.bureauResults?.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {expandedData.bureauResults?.map((br: any) => (
                                <div key={br.bureau} className={`rounded-lg border p-4 ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2.5 py-0.5 text-[11px] rounded-full font-medium ${isDark ? (bureauBadgeDark[br.bureau] || 'bg-gray-700/60 text-gray-300') : (bureauBadge[br.bureau] || 'bg-gray-100 text-gray-600')}`}>
                                      {bureauLabel[br.bureau] || br.bureau.toUpperCase()}
                                    </span>
                                    <span className={`text-xl font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{br.creditScore ?? '\u2014'}</span>
                                  </div>
                                  {br.rawOutput && (
                                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                      {Object.entries(br.rawOutput)
                                        .filter(([k]) => k !== 'credit_score')
                                        .map(([key, val]) => (
                                          <div key={key} className="flex justify-between items-baseline gap-2 text-xs">
                                            <span className={`leading-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                              {getFriendlyName(key)}
                                            </span>
                                            <span className={`font-medium whitespace-nowrap shrink-0 ${
                                              isDark ? 'text-white' : 'text-gray-900'
                                            }`}>
                                              {formatAttributeValue(key, val)}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Personal info summary */}
                          <div className="flex items-center justify-between">
                            <div className={`text-xs space-x-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {expandedData.address && (
                                <span>{expandedData.address}, {expandedData.city} {expandedData.state} {expandedData.zip}</span>
                              )}
                              {expandedData.batch && (
                                <span>Batch: {expandedData.batch.name}</span>
                              )}
                            </div>
                            <Link
                              href={`/admin/prescreen/results/${lead.id}`}
                              className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
                            >
                              Full Detail &rarr;
                            </Link>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <p className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Page {page} of {totalPages} ({total} results)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                } disabled:opacity-30 disabled:pointer-events-none`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                } disabled:opacity-30 disabled:pointer-events-none`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
