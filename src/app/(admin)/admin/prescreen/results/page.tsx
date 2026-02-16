'use client';

import React, { useState, useEffect } from 'react';
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
  bureauHits: Record<string, boolean>;
  programName: string;
  programId: number;
  programBureaus: { eq: boolean; tu: boolean; ex: boolean };
  batchId: number | null;
  batchName: string | null;
  firmOfferSent: boolean | null;
  firmOfferDate: string | null;
  firmOfferMethod: string | null;
  hardPullCount: number;
  createdAt: string;
  lastActivity: string;
}

interface Program {
  id: number;
  name: string;
}

function formatId(id: number) {
  return String(id).padStart(2, '0');
}

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

const tierBadge = (tier: string, isDark: boolean, matchStatus?: string) => {
  switch (tier) {
    case 'tier_1': return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    case 'tier_2': return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700';
    case 'tier_3': return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700';
    case 'below': return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
    case 'filtered': return matchStatus === 'no_match'
      ? (isDark ? 'bg-red-900/20 text-red-400/70' : 'bg-red-50 text-red-400')
      : (isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-500');
    default: return isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600';
  }
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
  const [limit, setLimit] = useState(25);

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
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);

  // Retry queue
  const [queuedIds, setQueuedIds] = useState<Set<number>>(new Set());

  // Inline detail state
  const [inlineNotes, setInlineNotes] = useState('');
  const [inlineNotesSaving, setInlineNotesSaving] = useState(false);
  const [inlineNotesDirty, setInlineNotesDirty] = useState(false);
  const [revealedSsn, setRevealedSsn] = useState<string | null>(null);
  const [ssnLoading, setSsnLoading] = useState(false);
  const [revealedDob, setRevealedDob] = useState<string | null>(null);
  const [dobLoading, setDobLoading] = useState(false);
  const [inlineFoEditing, setInlineFoEditing] = useState(false);
  const [inlineFoSent, setInlineFoSent] = useState(false);
  const [inlineFoDate, setInlineFoDate] = useState('');
  const [inlineFoMethod, setInlineFoMethod] = useState('');
  const [inlineFoSaving, setInlineFoSaving] = useState(false);
  const [inlineHpForm, setInlineHpForm] = useState(false);
  const [inlineHpSaving, setInlineHpSaving] = useState(false);
  const [inlineHpDate, setInlineHpDate] = useState('');
  const [inlineHpAgency, setInlineHpAgency] = useState('');
  const [inlineHpResult, setInlineHpResult] = useState('pending');
  const [inlineHpNotes, setInlineHpNotes] = useState('');

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
  }, [page, tierFilter, programFilter, batchFilter, minScore, maxScore, sortBy, sortDir, limit]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
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

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      setExpandedBureau(null);
      setRevealedSsn(null);
      setRevealedDob(null);
      return;
    }
    setExpandedId(id);
    setExpandedData(null);
    setExpandedBureau(null);
    setExpandedLoading(true);
    setInlineFoEditing(false);
    setRevealedSsn(null);
    setRevealedDob(null);
    try {
      const res = await fetch(`/api/prescreen/results/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.data) {
        setExpandedData(data.data);
        setInlineNotes('');
        setInlineNotesDirty(false);
        setInlineFoSent(data.data.firmOfferSent || false);
        setInlineFoDate(data.data.firmOfferDate ? new Date(data.data.firmOfferDate).toISOString().split('T')[0] : '');
        setInlineFoMethod(data.data.firmOfferMethod || '');
      }
    } catch (err) {
      console.error('Failed to load lead detail:', err);
    } finally {
      setExpandedLoading(false);
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

  const saveInlineNotes = async () => {
    if (!expandedId) return;
    setInlineNotesSaving(true);
    try {
      await fetch(`/api/prescreen/results/${expandedId}/notes`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: inlineNotes }),
      });
      setInlineNotesDirty(false);
    } finally {
      setInlineNotesSaving(false);
    }
  };

  const saveInlineFirmOffer = async () => {
    if (!expandedId) return;
    setInlineFoSaving(true);
    try {
      await fetch(`/api/prescreen/results/${expandedId}/firm-offer`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent: true, date: inlineFoDate, method: inlineFoMethod }),
      });
      setInlineFoSent(true);
      setInlineFoEditing(false);
      loadResults();
    } finally {
      setInlineFoSaving(false);
    }
  };

  const removeInlineFirmOffer = async () => {
    if (!expandedId) return;
    setInlineFoSaving(true);
    try {
      await fetch(`/api/prescreen/results/${expandedId}/firm-offer`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent: false, date: null, method: null }),
      });
      setInlineFoSent(false);
      setInlineFoDate('');
      setInlineFoMethod('');
      setInlineFoEditing(false);
      loadResults();
    } finally {
      setInlineFoSaving(false);
    }
  };

  const saveInlineHardPull = async () => {
    if (!expandedId || !inlineHpDate) return;
    setInlineHpSaving(true);
    try {
      const res = await fetch(`/api/prescreen/results/${expandedId}/hard-pull`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pullDate: inlineHpDate, agency: inlineHpAgency || null, result: inlineHpResult, notes: inlineHpNotes || null }),
      });
      if (res.ok) {
        setInlineHpForm(false);
        setInlineHpDate('');
        setInlineHpAgency('');
        setInlineHpResult('pending');
        setInlineHpNotes('');
        const r2 = await fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
        const d2 = await r2.json();
        if (r2.ok && d2.data) setExpandedData(d2.data);
        loadResults();
      }
    } finally {
      setInlineHpSaving(false);
    }
  };

  const deleteInlineHardPull = async (hpId: number) => {
    if (!expandedId) return;
    try {
      const res = await fetch(`/api/prescreen/results/${expandedId}/hard-pulls?hardPullId=${hpId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        const r2 = await fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
        const d2 = await r2.json();
        if (r2.ok && d2.data) setExpandedData(d2.data);
        loadResults();
      }
    } catch (err) {
      console.error('Failed to delete hard pull:', err);
    }
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
              Browse and manage lead results
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                    {[
                      { key: 'id', label: 'ID' },
                      { key: 'last_name', label: 'Name' },
                      { key: 'middle_score', label: 'Score' },
                      { key: 'tier', label: 'Tier' },
                      { key: 'firm_offer_sent', label: 'Firm Offer' },
                      { key: '', label: 'Hard Pull' },
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
                  {leads.map((lead, idx) => {
                    const isExpRow = expandedId === lead.id;
                    return (
                    <React.Fragment key={lead.id}>
                    <tr
                      onClick={() => toggleExpand(lead.id)}
                      className={`cursor-pointer transition-colors ${
                        expandedId === lead.id
                          ? (isDark ? 'bg-gray-700/30' : 'bg-gray-50')
                          : isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'
                      } ${expandedId !== lead.id && idx !== leads.length - 1 ? (isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-100/80') : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatId(lead.id)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {lead.firstName} {lead.lastName}
                        </span>
                        {lead.ssnLastFour && (
                          <span className={`ml-1.5 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {lead.ssnLastFour}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          {[
                            { key: 'eq', label: 'EQ', score: lead.bureauScores?.eq, hit: lead.bureauHits?.eq, color: isDark ? '#f87171' : '#ef4444' },
                            { key: 'tu', label: 'TU', score: lead.bureauScores?.tu, hit: lead.bureauHits?.tu, color: isDark ? '#60a5fa' : '#3b82f6' },
                            { key: 'ex', label: 'EX', score: lead.bureauScores?.ex, hit: lead.bureauHits?.ex, color: isDark ? '#4ade80' : '#22c55e' },
                          ].map((b) => {
                            const hasRow = b.key in (lead.bureauScores || {});
                            const hasScore = b.score != null;
                            const hasBureauData = Object.keys(lead.bureauScores || {}).length > 0;
                            const isNoMatch = (hasRow && !b.hit) || (!hasBureauData && lead.matchStatus === 'no_match');
                            const isGreyX = (hasRow && b.hit && !hasScore) || (!hasBureauData && lead.matchStatus === 'matched' && !hasScore);
                            return (
                              <div key={b.key} className="flex flex-col items-center gap-0.5">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center"
                                  style={{
                                    background: hasScore
                                      ? `${b.color}18`
                                      : isNoMatch
                                        ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)')
                                        : isGreyX
                                          ? (isDark ? 'rgba(107,114,128,0.08)' : 'rgba(107,114,128,0.05)')
                                          : (isDark ? 'rgba(250,204,21,0.1)' : 'rgba(250,204,21,0.08)'),
                                    border: hasScore
                                      ? `2.5px solid ${b.color}`
                                      : isNoMatch
                                        ? `2px dashed ${isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)'}`
                                        : isGreyX
                                          ? `2px dashed ${isDark ? 'rgba(107,114,128,0.4)' : 'rgba(107,114,128,0.25)'}`
                                          : `2px dashed ${isDark ? 'rgba(250,204,21,0.5)' : 'rgba(250,204,21,0.6)'}`
                                  }}
                                >
                                  {hasScore ? (
                                    <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.score}</span>
                                  ) : isNoMatch ? (
                                    <span className={`text-[7px] font-bold ${isDark ? 'text-red-400/70' : 'text-red-500/60'}`}>N/M</span>
                                  ) : isGreyX ? (
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'\u2717'}</span>
                                  ) : (
                                    <span className={`text-[11px] font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>!</span>
                                  )}
                                </div>
                                <span className="text-[9px] font-semibold tracking-wide" style={{ color: isGreyX ? (isDark ? '#6b7280' : '#9ca3af') : b.color }}>{b.label}</span>
                              </div>
                            );
                          })}
                          {lead.middleScore != null && lead.bureauScores?.eq != null && lead.bureauScores?.tu != null && lead.bureauScores?.ex != null && (
                            <div className={`ml-1 pl-3 border-l ${isDark ? 'border-gray-700/60' : 'border-gray-200'}`}>
                              <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Mid</div>
                              <div className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.middleScore}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${tierBadge(lead.tier, isDark, lead.matchStatus)}`}>
                          {tierLabel(lead.tier, lead.matchStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {lead.firmOfferSent ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>Sent</span>
                        ) : (
                          <span className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{'\u2014'}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {lead.hardPullCount > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>{lead.hardPullCount}</span>
                        ) : (
                          <span className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{'\u2014'}</span>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date(lead.lastActivity || lead.createdAt).toLocaleDateString()}
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
                    {isExpRow && (
                      <tr>
                        <td colSpan={8} className={`px-0 py-0 ${isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-100/80'}`}>
                          <div className={`px-6 py-4 ${isDark ? 'bg-gradient-to-b from-gray-800/60 to-gray-800/30' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                            {expandedLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-300 border-t-gray-600'}`} />
                              </div>
                            ) : expandedData ? (
                              <div className="space-y-3.5">
                                {/* Personal + Program info bar */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {expandedData.address && (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-white text-gray-600 shadow-sm border border-gray-100'}`}>
                                      <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                      {[expandedData.address, expandedData.city, expandedData.state].filter(Boolean).join(', ')} {expandedData.zip || ''}
                                    </span>
                                  )}
                                  {expandedData.ssnLastFour && (
                                    <span
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (revealedSsn) { setRevealedSsn(null); return; }
                                        setSsnLoading(true);
                                        try {
                                          const res = await fetch(`/api/prescreen/results/${expandedId}/decrypt`, {
                                            method: 'POST', credentials: 'include',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ field: 'ssn' }),
                                          });
                                          const data = await res.json();
                                          if (res.ok && data.data?.value) {
                                            const d = data.data.value.replace(/\D/g, '');
                                            setRevealedSsn(`${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`);
                                          }
                                        } catch {} finally { setSsnLoading(false); }
                                      }}
                                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors ${isDark ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300' : 'bg-white text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-gray-700'}`}
                                      title="Click to reveal full SSN"
                                    >
                                      {ssnLoading ? '...' : revealedSsn || `***-**-${expandedData.ssnLastFour}`}
                                    </span>
                                  )}
                                  {expandedData.hasDob && (
                                    <span
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (revealedDob) { setRevealedDob(null); return; }
                                        setDobLoading(true);
                                        try {
                                          const res = await fetch(`/api/prescreen/results/${expandedId}/decrypt`, {
                                            method: 'POST', credentials: 'include',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ field: 'dob' }),
                                          });
                                          const data = await res.json();
                                          if (res.ok && data.data?.value) {
                                            const v = data.data.value;
                                            const d = new Date(v.includes('-') || v.includes('/') ? v : `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}`);
                                            setRevealedDob(isNaN(d.getTime()) ? v : `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`);
                                          }
                                        } catch {} finally { setDobLoading(false); }
                                      }}
                                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-colors ${isDark ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300' : 'bg-white text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-gray-700'}`}
                                      title="Click to reveal date of birth"
                                    >
                                      {dobLoading ? '...' : revealedDob ? `DOB: ${revealedDob}` : 'DOB: ••/••/••••'}
                                    </span>
                                  )}
                                  {expandedData.middleInitial && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}>
                                      MI: {expandedData.middleInitial}
                                    </span>
                                  )}
                                  {expandedData.program && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}>
                                      {expandedData.program.name}{expandedData.batch ? ` / ${expandedData.batch.name} (#${expandedData.batch.id})` : ''}
                                    </span>
                                  )}
                                  {expandedData.segmentName && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}>
                                      Segment: {expandedData.segmentName}
                                    </span>
                                  )}
                                  {expandedData.createdAt && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-gray-700/50 text-gray-500' : 'bg-white text-gray-400 shadow-sm border border-gray-100'}`}>
                                      Added: {new Date(expandedData.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  )}
                                  {expandedData.errorMessage && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-red-900/20 text-red-400/80' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                                      {expandedData.errorMessage}
                                    </span>
                                  )}
                                </div>

                                {/* Two cards side by side: Firm Offer + Hard Pulls */}
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Firm Offer Card */}
                                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700/30 border border-gray-600/30' : 'bg-white border border-gray-150 shadow-sm'}`} onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Firm Offer</span>
                                      {inlineFoSent && !inlineFoEditing && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                          Sent
                                        </span>
                                      )}
                                    </div>
                                    {inlineFoSent && !inlineFoEditing ? (
                                      <div className="flex items-center justify-between">
                                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                          {inlineFoDate && new Date(inlineFoDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                          {inlineFoMethod && ` via ${inlineFoMethod}`}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => setInlineFoEditing(true)} className={`text-[10px] ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>Edit</button>
                                          <button onClick={removeInlineFirmOffer} disabled={inlineFoSaving} className={`text-[10px] ${isDark ? 'text-red-500/60 hover:text-red-400' : 'text-red-400/60 hover:text-red-500'}`}>Remove</button>
                                        </div>
                                      </div>
                                    ) : inlineFoEditing ? (
                                      <div className="flex items-center gap-2">
                                        <input type="date" value={inlineFoDate} onChange={(e) => setInlineFoDate(e.target.value)}
                                          className={`px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                                        <select value={inlineFoMethod} onChange={(e) => setInlineFoMethod(e.target.value)}
                                          className={`px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                          <option value="">Method</option>
                                          <option value="Mail">Mail</option>
                                          <option value="Email">Email</option>
                                          <option value="Phone">Phone</option>
                                        </select>
                                        <button onClick={saveInlineFirmOffer} disabled={inlineFoSaving || !inlineFoDate}
                                          className="px-3 py-1 text-[11px] font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40">
                                          {inlineFoSaving ? '...' : 'Save'}
                                        </button>
                                        <button onClick={() => setInlineFoEditing(false)} className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancel</button>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setInlineFoEditing(true); if (!inlineFoDate) setInlineFoDate(new Date().toISOString().split('T')[0]); }}
                                        className={`text-xs font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
                                        + Log Firm Offer
                                      </button>
                                    )}
                                  </div>

                                  {/* Hard Pulls Card */}
                                  <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700/30 border border-gray-600/30' : 'bg-white border border-gray-150 shadow-sm'}`} onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Hard Pulls</span>
                                      {expandedData.hardPulls?.length > 0 && !inlineHpForm && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                                          {expandedData.hardPulls.length} logged
                                        </span>
                                      )}
                                    </div>
                                    {expandedData.hardPulls?.length > 0 && !inlineHpForm && (
                                      <div className="mb-2 space-y-1.5">
                                        {expandedData.hardPulls.map((hp: any) => (
                                          <div key={hp.id} className="flex items-center justify-between group/hp">
                                            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                hp.result === 'approved' ? 'bg-emerald-500' :
                                                hp.result === 'denied' ? 'bg-red-500' :
                                                hp.result === 'conditional' ? 'bg-amber-500' : 'bg-gray-400'
                                              }`} />
                                              <span className="font-medium capitalize">{hp.result || 'pending'}</span>
                                              {hp.agency && <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{hp.agency}</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {new Date(hp.pullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                {hp.notes && ` - ${hp.notes}`}
                                              </span>
                                              <button onClick={() => deleteInlineHardPull(hp.id)} className={`opacity-0 group-hover/hp:opacity-100 transition-opacity text-[10px] ${isDark ? 'text-red-500/60 hover:text-red-400' : 'text-red-400/60 hover:text-red-500'}`} title="Delete">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {inlineHpForm ? (
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          <input type="date" value={inlineHpDate} onChange={(e) => setInlineHpDate(e.target.value)}
                                            className={`px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                                          <select value={inlineHpAgency} onChange={(e) => setInlineHpAgency(e.target.value)}
                                            className={`px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                            <option value="">Agency</option>
                                            <option value="Equifax">Equifax</option>
                                            <option value="TransUnion">TransUnion</option>
                                            <option value="Experian">Experian</option>
                                          </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <select value={inlineHpResult} onChange={(e) => setInlineHpResult(e.target.value)}
                                            className={`px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="denied">Denied</option>
                                            <option value="conditional">Conditional</option>
                                          </select>
                                          <input type="text" value={inlineHpNotes} onChange={(e) => setInlineHpNotes(e.target.value)} placeholder="Notes..."
                                            className={`px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button onClick={saveInlineHardPull} disabled={inlineHpSaving || !inlineHpDate}
                                            className="px-3 py-1 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40">
                                            {inlineHpSaving ? '...' : 'Save'}
                                          </button>
                                          <button onClick={() => setInlineHpForm(false)} className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button onClick={() => { setInlineHpForm(true); if (!inlineHpDate) setInlineHpDate(new Date().toISOString().split('T')[0]); }}
                                        className={`text-xs font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
                                        + Log Hard Pull
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Notes — full width */}
                                <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-700/30 border border-gray-600/30' : 'bg-white border border-gray-150 shadow-sm'}`} onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Notes</span>
                                    {expandedData.leadNotes?.length > 0 && (
                                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{expandedData.leadNotes.length} note{expandedData.leadNotes.length !== 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                  {expandedData.leadNotes?.length > 0 && (
                                    <div className="space-y-2 mb-2">
                                      {expandedData.leadNotes.map((note: any) => (
                                        <div key={note.id} className={`group/note rounded-md p-2 ${isDark ? 'bg-gray-600/20' : 'bg-gray-50'}`}>
                                          {inlineNotes === `edit-${note.id}` ? (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="text"
                                                defaultValue={note.content}
                                                id={`note-edit-${note.id}`}
                                                className={`flex-1 px-2 py-1 text-xs rounded-md border ${isDark ? 'bg-gray-600/50 border-gray-500/50 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (!val) return;
                                                    setInlineNotesSaving(true);
                                                    fetch(`/api/prescreen/results/${expandedId}/notes`, {
                                                      method: 'PUT', credentials: 'include',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ noteId: note.id, content: val }),
                                                    }).then(() => {
                                                      setInlineNotes('');
                                                      return fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
                                                    }).then(r => r.json()).then(d => { if (d.data) setExpandedData(d.data); }).finally(() => setInlineNotesSaving(false));
                                                  }
                                                  if (e.key === 'Escape') setInlineNotes('');
                                                }}
                                              />
                                              <button onClick={() => {
                                                const el = document.getElementById(`note-edit-${note.id}`) as HTMLInputElement;
                                                const val = el?.value.trim();
                                                if (!val) return;
                                                setInlineNotesSaving(true);
                                                fetch(`/api/prescreen/results/${expandedId}/notes`, {
                                                  method: 'PUT', credentials: 'include',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ noteId: note.id, content: val }),
                                                }).then(() => {
                                                  setInlineNotes('');
                                                  return fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
                                                }).then(r => r.json()).then(d => { if (d.data) setExpandedData(d.data); }).finally(() => setInlineNotesSaving(false));
                                              }} disabled={inlineNotesSaving} className="px-2 py-1 text-[10px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">
                                                {inlineNotesSaving ? '...' : 'Save'}
                                              </button>
                                              <button onClick={() => setInlineNotes('')} className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cancel</button>
                                            </div>
                                          ) : (
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{note.content}</p>
                                                <div className={`flex items-center gap-2 mt-1 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                  <span>{new Date(note.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                                                  {note.createdByEmail && <span>{note.createdByEmail}</span>}
                                                  {note.updatedAt && new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000 && <span className="italic">edited</span>}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity shrink-0">
                                                <button onClick={() => setInlineNotes(`edit-${note.id}`)} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>Edit</button>
                                                <button onClick={() => {
                                                  fetch(`/api/prescreen/results/${expandedId}/notes?noteId=${note.id}`, { method: 'DELETE', credentials: 'include' })
                                                    .then(() => fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' }))
                                                    .then(r => r.json()).then(d => { if (d.data) setExpandedData(d.data); });
                                                }} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'text-red-500/60 hover:text-red-400 hover:bg-red-900/20' : 'text-red-400/60 hover:text-red-500 hover:bg-red-50'}`}>Delete</button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={inlineNotes.startsWith('edit-') ? '' : inlineNotes}
                                      onChange={(e) => setInlineNotes(e.target.value)}
                                      placeholder="Add a note..."
                                      className={`flex-1 px-3 py-1.5 text-xs rounded-md border ${isDark ? 'bg-gray-600/30 border-gray-600/40 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400'}`}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && inlineNotes.trim() && !inlineNotes.startsWith('edit-')) {
                                          setInlineNotesSaving(true);
                                          fetch(`/api/prescreen/results/${expandedId}/notes`, {
                                            method: 'POST', credentials: 'include',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ content: inlineNotes.trim() }),
                                          }).then(() => {
                                            setInlineNotes('');
                                            return fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
                                          }).then(r => r.json()).then(d => { if (d.data) setExpandedData(d.data); }).finally(() => setInlineNotesSaving(false));
                                        }
                                      }}
                                    />
                                    {inlineNotes.trim() && !inlineNotes.startsWith('edit-') && (
                                      <button onClick={() => {
                                        setInlineNotesSaving(true);
                                        fetch(`/api/prescreen/results/${expandedId}/notes`, {
                                          method: 'POST', credentials: 'include',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ content: inlineNotes.trim() }),
                                        }).then(() => {
                                          setInlineNotes('');
                                          return fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
                                        }).then(r => r.json()).then(d => { if (d.data) setExpandedData(d.data); }).finally(() => setInlineNotesSaving(false));
                                      }} disabled={inlineNotesSaving}
                                        className="px-3 py-1.5 text-[11px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">
                                        {inlineNotesSaving ? '...' : 'Add'}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Bureau Results — full width cards */}
                                {expandedData.bureauResults?.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[...expandedData.bureauResults].sort((a: any, b: any) => {
                                      const order: Record<string, number> = { eq: 0, tu: 1, ex: 2 };
                                      return (order[a.bureau] ?? 9) - (order[b.bureau] ?? 9);
                                    }).map((br: any) => {
                                      const cardColors: Record<string, { badge: string; border: string }> = {
                                        eq: { badge: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700', border: isDark ? 'border-red-500/20' : 'border-red-200' },
                                        tu: { badge: isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700', border: isDark ? 'border-blue-500/20' : 'border-blue-200' },
                                        ex: { badge: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700', border: isDark ? 'border-green-500/20' : 'border-green-200' },
                                      };
                                      const cc = cardColors[br.bureau] || cardColors.eq;
                                      const bureauNames: Record<string, string> = { eq: 'Equifax', tu: 'TransUnion', ex: 'Experian' };
                                      const scoreVersion = expandedData.program?.scoreVersions?.[br.bureau] || null;
                                      const fields = br.rawOutput ? Object.entries(br.rawOutput).filter(([k]: [string, any]) => k !== 'credit_score') : [];
                                      return (
                                        <div key={br.bureau} className={`rounded-lg border p-4 ${cc.border} ${isDark ? 'bg-gray-800/40' : 'bg-white shadow-sm'}`}>
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2.5 py-0.5 text-[11px] rounded-full font-medium ${cc.badge}`}>
                                                {bureauNames[br.bureau] || br.bureau.toUpperCase()}
                                              </span>
                                              {br.createdAt && (
                                                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                  {new Date(br.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                                </span>
                                              )}
                                              {scoreVersion && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                                  {scoreVersion.replace(/_/g, ' ')}
                                                </span>
                                              )}
                                            </div>
                                            <span className={`text-xl font-semibold tabular-nums ${br.creditScore != null ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-300')}`}>
                                              {br.creditScore ?? '\u2014'}
                                            </span>
                                          </div>
                                          {fields.length > 0 && (
                                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                              {fields.map(([key, val]: [string, any]) => (
                                                <div key={key} className="flex justify-between items-baseline gap-2 text-xs">
                                                  <span className={`leading-tight ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {getFriendlyName(key)}
                                                  </span>
                                                  <span className={`font-medium whitespace-nowrap shrink-0 tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {formatAttributeValue(key, val)}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {!br.isHit && !br.creditScore && fields.length === 0 && (
                                            <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No match</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className={`text-sm py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Failed to load detail</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <p className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {total} results{totalPages > 1 && ` — page ${page} of ${totalPages}`}
                </p>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className={`px-2 py-1 rounded-md text-[11px] border outline-none cursor-pointer ${isDark ? 'bg-gray-700/60 border-gray-600/50 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} per page</option>
                  ))}
                </select>
              </div>
              {totalPages > 1 && (
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
