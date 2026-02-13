'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../AdminContext';
import { getFriendlyName, formatAttributeValue } from '@/lib/altair-attributes';

interface Stats {
  totalLeads: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  belowCount: number;
  filteredCount: number;
  noMatchCount: number;
  unqualifiedCount: number;
  totalBatches: number;
  totalPrograms: number;
}

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  ssnLastFour: string | null;
  middleScore: number | null;
  tier: string;
  matchStatus: string;
  bureauScores: Record<string, number | null>;
  bureauHits: Record<string, boolean>;
  firmOfferSent: boolean | null;
  firmOfferMethod: string | null;
  hardPullCount: number;
  programName: string;
  createdAt: string;
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

export default function PrescreenDashboard() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Retry queue
  const [queuedIds, setQueuedIds] = useState<Set<number>>(new Set());
  const [retryLeads, setRetryLeads] = useState<any[]>([]);
  const [loadingRetry, setLoadingRetry] = useState(false);

  // Expanded row detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);

  // Inline detail state
  const [inlineNotes, setInlineNotes] = useState('');
  const [inlineNotesSaving, setInlineNotesSaving] = useState(false);
  const [inlineNotesDirty, setInlineNotesDirty] = useState(false);
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

  // API Status (manual check only)
  const [apiStatus, setApiStatus] = useState<{ status: string; message: string; latencyMs?: number } | null>(null);
  const [apiLastChecked, setApiLastChecked] = useState<Date | null>(null);
  const [apiChecking, setApiChecking] = useState(false);

  // Fill missing bureaus
  const [fillData, setFillData] = useState<{ summary: { totalLeadsWithMissing: number; missingEq: number; missingTu: number; missingEx: number }; leads: any[] } | null>(null);
  const [fillExpanded, setFillExpanded] = useState(false);
  const [fillSelected, setFillSelected] = useState<Set<number>>(new Set());
  const [filling, setFilling] = useState(false);
  const [fillResult, setFillResult] = useState<{ results: Record<string, { submitted: number; qualified: number; failed: number; error?: string }>; totalUpdated: number } | null>(null);

  // Quick-add form
  interface QaRecord { firstName: string; lastName: string; address: string; city: string; state: string; zip: string; ssn: string; dob: string; }
  const [qaProgram, setQaProgram] = useState('');
  const [qaFirst, setQaFirst] = useState('');
  const [qaLast, setQaLast] = useState('');
  const [qaAddress, setQaAddress] = useState('');
  const [qaCity, setQaCity] = useState('');
  const [qaState, setQaState] = useState('AR');
  const [qaTab, setQaTab] = useState<'single' | 'csv'>('single');
  const [qaCsv, setQaCsv] = useState('');
  const [qaZip, setQaZip] = useState('');
  const [qaSsn, setQaSsn] = useState('');
  const [qaDob, setQaDob] = useState('');
  const [qaBatch, setQaBatch] = useState<QaRecord[]>([]);
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [qaError, setQaError] = useState('');

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

  const handleQaSsn = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 9);
    if (d.length <= 3) setQaSsn(d);
    else if (d.length <= 5) setQaSsn(`${d.slice(0,3)}-${d.slice(3)}`);
    else setQaSsn(`${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`);
  };
  const handleQaDob = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    if (d.length <= 2) setQaDob(d);
    else if (d.length <= 4) setQaDob(`${d.slice(0,2)}/${d.slice(2)}`);
    else setQaDob(`${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`);
  };

  const addToQaBatch = () => {
    setQaError('');
    if (!qaFirst || !qaLast) { setQaError('Name required'); return; }
    if (!qaAddress || !qaCity || !qaState || !qaZip) { setQaError('Address required'); return; }
    const ssnDigits = qaSsn.replace(/\D/g, '');
    const dobDigits = qaDob.replace(/\D/g, '');
    const dobISO = dobDigits.length === 8 ? `${dobDigits.slice(4,8)}-${dobDigits.slice(0,2)}-${dobDigits.slice(2,4)}` : '';
    setQaBatch(prev => [...prev, { firstName: qaFirst.trim(), lastName: qaLast.trim(), address: qaAddress.trim(), city: qaCity.trim(), state: qaState, zip: qaZip.trim(), ssn: ssnDigits, dob: dobISO }]);
    setQaFirst(''); setQaLast(''); setQaAddress(''); setQaCity(''); setQaState(''); setQaZip(''); setQaSsn(''); setQaDob('');
  };

  const parseQaCsv = () => {
    setQaError('');
    const lines = qaCsv.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setQaError('CSV needs header + data rows'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const required = ['first_name','last_name','address','city','state','zip'];
    const missing = required.filter(h => !headers.includes(h));
    if (missing.length) { setQaError(`Missing columns: ${missing.join(', ')}`); return; }
    const newRecords: QaRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
      newRecords.push({ firstName: row.first_name, lastName: row.last_name, address: row.address, city: row.city, state: row.state, zip: row.zip, ssn: (row.ssn || '').replace(/\D/g, ''), dob: row.dob || '' });
    }
    setQaBatch(prev => [...prev, ...newRecords]);
    setQaCsv('');
  };

  const submitQaBatch = async () => {
    setQaError('');
    if (!qaProgram) { setQaError('Select a program'); return; }
    if (qaBatch.length < 2) { setQaError('Min 2 records required'); return; }
    setQaSubmitting(true);
    try {
      const res = await fetch('/api/prescreen/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ programId: parseInt(qaProgram), records: qaBatch.map(r => ({ ...r, ssn: r.ssn || undefined, dob: r.dob || undefined })) }),
      });
      const data = await res.json();
      if (!res.ok) { setQaError(data.error || 'Submission failed'); return; }
      setQaBatch([]);
      router.push(`/admin/prescreen/results?batchId=${data.data.batchId}`);
    } catch (err: any) { setQaError(err.message); }
    finally { setQaSubmitting(false); }
  };

  // Debounce search input
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearchInput = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  // Load stats + programs once
  useEffect(() => {
    Promise.all([
      fetch('/api/prescreen/stats', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/prescreen/programs', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([statsData, programsData]) => {
      if (statsData) setStats(statsData.data);
      if (programsData) {
        const items = programsData.data?.items || [];
        setPrograms(items);
        if (items.length > 0) setQaProgram(String(items[0].id));
      }
    }).catch(console.error);
    fetch('/api/prescreen/retry-queue', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const leads = data.data?.leads || [];
        setRetryLeads(leads);
        setQueuedIds(new Set(leads.map((l: any) => l.id)));
      })
      .catch(console.error);
    fetch('/api/prescreen/fill-missing', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.data) setFillData(data.data); })
      .catch(console.error);
  }, []);

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
        if (newQueued) {
          // Add lead to retryLeads from current leads list
          const lead = leads.find(l => l.id === leadId);
          if (lead) {
            setRetryLeads(prev => [...prev, {
              id: lead.id,
              firstName: lead.firstName,
              lastName: lead.lastName,
              address: '', city: '', state: '', zip: '',
              hasSsn: !!lead.ssnLastFour,
              hasDob: true,
            }]);
          }
        } else {
          setRetryLeads(prev => prev.filter(l => l.id !== leadId));
        }
      }
    } catch { /* ignore */ }
  };

  const loadRetryIntoBatch = async () => {
    if (retryLeads.length === 0) return;
    setLoadingRetry(true);
    setQaError('');
    try {
      // Re-fetch retry queue for complete lead data (address, etc.)
      const queueRes = await fetch('/api/prescreen/retry-queue', { credentials: 'include' });
      const queueData = await queueRes.json();
      const freshLeads = queueData.data?.leads || [];
      if (freshLeads.length === 0) {
        setRetryLeads([]);
        setQueuedIds(new Set());
        setLoadingRetry(false);
        return;
      }

      const records: QaRecord[] = [];
      // Decrypt PII in parallel for speed
      await Promise.all(freshLeads.map(async (lead: any) => {
        let ssn = '';
        let dob = '';
        const [ssnRes, dobRes] = await Promise.all([
          lead.hasSsn
            ? fetch(`/api/prescreen/results/${lead.id}/decrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ field: 'ssn' }),
              }).then(r => r.ok ? r.json() : null).catch(() => null)
            : null,
          lead.hasDob
            ? fetch(`/api/prescreen/results/${lead.id}/decrypt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ field: 'dob' }),
              }).then(r => r.ok ? r.json() : null).catch(() => null)
            : null,
        ]);
        if (ssnRes) ssn = ssnRes.data?.value || '';
        if (dobRes) dob = dobRes.data?.value || '';
        records.push({
          firstName: lead.firstName,
          lastName: lead.lastName,
          address: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          zip: lead.zip || '',
          ssn: ssn.replace(/\D/g, ''),
          dob,
        });
      }));
      setQaBatch(prev => [...prev, ...records]);

      // Clear retry queue flags
      const ids = freshLeads.map((l: any) => l.id);
      await fetch('/api/prescreen/retry-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds: ids, queued: false }),
      });
      setRetryLeads([]);
      setQueuedIds(new Set());
    } catch (err) {
      console.error('Failed to load retry queue:', err);
      setQaError('Failed to load retry leads');
    } finally {
      setLoadingRetry(false);
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedData(null);
      setExpandedBureau(null);
      return;
    }
    setExpandedId(id);
    setExpandedData(null);
    setExpandedBureau(null);
    setExpandedLoading(true);
    setInlineFoEditing(false);
    try {
      const res = await fetch(`/api/prescreen/results/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.data) {
        setExpandedData(data.data);
        setInlineNotes(data.data.notes || '');
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
        // Refresh expanded data
        const r2 = await fetch(`/api/prescreen/results/${expandedId}`, { credentials: 'include' });
        const d2 = await r2.json();
        if (r2.ok && d2.data) setExpandedData(d2.data);
        loadResults();
      }
    } finally {
      setInlineHpSaving(false);
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

  const handleFillMissing = async (leadIds?: number[]) => {
    setFilling(true);
    setFillResult(null);
    try {
      const body = leadIds ? JSON.stringify({ leadIds }) : undefined;
      const res = await fetch('/api/prescreen/fill-missing', {
        method: 'POST', credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setFillResult(data.data);
        setFillSelected(new Set());
        // Refresh stats + table + fill preview
        fetch('/api/prescreen/stats', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d.data); });
        fetch('/api/prescreen/fill-missing', { credentials: 'include' }).then(r => r.ok ? r.json() : null).then(d => { if (d?.data) setFillData(d.data); });
        loadResults();
      } else {
        setFillResult({ results: {}, totalUpdated: 0 });
      }
    } catch (err) {
      console.error('Fill missing error:', err);
    } finally {
      setFilling(false);
    }
  };

  // Load results with filters
  const loadResults = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (tierFilter) params.set('tier', tierFilter);
      if (matchStatusFilter) params.set('matchStatus', matchStatusFilter);
      if (programFilter) params.set('programId', programFilter);
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
      setTableLoading(false);
      setLoading(false);
    }
  }, [page, tierFilter, matchStatusFilter, programFilter, sortBy, sortDir, debouncedSearch]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  // Auto-poll API status every 60s
  const checkApiStatus = useCallback(async () => {
    setApiChecking(true);
    try {
      const res = await fetch('/api/prescreen/test-connection', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data.data);
        setApiLastChecked(new Date());
      } else {
        setApiStatus({ status: 'error', message: 'Failed to reach test endpoint' });
        setApiLastChecked(new Date());
      }
    } catch (err: any) {
      setApiStatus({ status: 'error', message: err.message });
      setApiLastChecked(new Date());
    } finally {
      setApiChecking(false);
    }
  }, []);

  // Connection check is manual only — click the status indicator to check

  const SortIcon = ({ field }: { field: string }) => (
    <svg className={`w-3 h-3 ml-0.5 inline-block transition-opacity ${sortBy === field ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {sortBy === field && sortDir === 'asc' ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );

  // No full-page spinner — page renders immediately, sections show skeleton states

  const inputBase = `px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 placeholder-gray-400'
  }`;
  const chevronSvg = isDark
    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`
    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E")`;
  const selectBase = `px-3 py-2 pr-10 rounded-lg border text-sm outline-none transition-all cursor-pointer appearance-none bg-no-repeat ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;
  const selectStyle = { backgroundImage: chevronSvg, backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat' as const };
  const qaInput = `px-2.5 py-1.5 rounded-md border text-xs outline-none transition-all appearance-none ${
    isDark ? 'bg-gray-700/50 border-gray-600/60 text-white focus:border-gray-500 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-300 placeholder-gray-400'
  }`;

  const tierItems = [
    { label: 'Tier 1', desc: '620+', value: stats?.tier1Count ?? 0, tier: 'tier_1', color: isDark ? 'text-emerald-400' : 'text-emerald-600', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
    { label: 'Tier 2', desc: '580 - 619', value: stats?.tier2Count ?? 0, tier: 'tier_2', color: isDark ? 'text-blue-400' : 'text-blue-600', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' },
    { label: 'Tier 3', desc: '500 - 579', value: stats?.tier3Count ?? 0, tier: 'tier_3', color: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
    { label: 'Below', desc: 'Under 500', value: stats?.belowCount ?? 0, tier: 'below', color: isDark ? 'text-red-400' : 'text-red-600', bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
    { label: 'Unqualified', desc: 'Filtered', value: stats?.unqualifiedCount ?? 0, tier: 'unqualified', color: isDark ? 'text-gray-400' : 'text-gray-500', bg: isDark ? 'bg-gray-500/10' : 'bg-gray-50' },
    { label: 'No Match', desc: 'Not found', value: stats?.noMatchCount ?? 0, tier: 'no_match', color: isDark ? 'text-red-400/70' : 'text-red-400', bg: isDark ? 'bg-red-500/5' : 'bg-red-50/50' },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Prescreen
          </h1>
          {/* Live API status indicator */}
          <div className="relative group">
            <button onClick={checkApiStatus} disabled={apiChecking} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
              apiChecking ? (isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-400') :
              !apiStatus ? (isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-400') :
              apiStatus.status === 'connected' ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
              apiStatus.status === 'error' || apiStatus.status === 'blocked' ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600') :
              (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600')
            }`}>
              <span className="relative flex h-2.5 w-2.5">
                {apiChecking && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-50" />
                )}
                {apiStatus?.status === 'connected' && !apiChecking && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  apiChecking ? (isDark ? 'bg-gray-500' : 'bg-gray-400') :
                  !apiStatus ? (isDark ? 'bg-gray-500' : 'bg-gray-300') :
                  apiStatus.status === 'connected' ? 'bg-emerald-500' :
                  apiStatus.status === 'error' || apiStatus.status === 'blocked' ? 'bg-red-500' :
                  'bg-amber-500'
                }`} />
              </span>
              {apiChecking ? 'Checking...' :
               !apiStatus ? 'Check Status' :
               apiStatus.status === 'connected' ? 'System Online' :
               apiStatus.status === 'blocked' ? 'IP Blocked' :
               apiStatus.status === 'not_configured' ? 'Not Configured' : 'Offline'}
            </button>
            {/* Hover tooltip */}
            <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-200'
            }`}>
              {!apiStatus && !apiChecking && <span>Click to test Altair connection</span>}
              {apiStatus?.message && <span>{apiStatus.message}</span>}
              {apiLastChecked && (
                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{apiStatus?.message ? ' \u00B7 ' : ''}Checked {apiLastChecked.toLocaleTimeString()} \u00B7 Click to recheck</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: 'Programs', href: '/admin/prescreen/programs' },
            { label: 'Batches', href: '/admin/prescreen/batches' },
            { label: 'Billing', href: '/admin/prescreen/billing' },
            { label: 'Log', href: '/admin/prescreen/logs' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Metrics + Quick Add — side by side */}
      <div className="flex gap-4 items-start">
        {/* Score Metrics */}
        <div className={`rounded-xl border w-[220px] flex-shrink-0 ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => { setTierFilter(''); setMatchStatusFilter(''); setProgramFilter(''); setSearch(''); setDebouncedSearch(''); setPage(1); }}
            className={`w-full px-3 py-1.5 text-left border-b flex items-center justify-between transition-colors ${
              isDark ? 'border-gray-700/60 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50'
            } ${!tierFilter ? (isDark ? 'bg-gray-700/20' : 'bg-gray-50/80') : ''}`}
          >
            <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Leads</p>
            <p className={`text-lg font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {stats?.totalLeads ?? 0}
            </p>
          </button>
          <div className="px-1.5 py-1.5">
            {tierItems.map((item) => (
              <button
                key={item.tier}
                onClick={() => {
                  const isActive = tierFilter === (item.tier === 'unqualified' || item.tier === 'no_match' ? 'filtered' : item.tier) && (
                    item.tier === 'unqualified' ? matchStatusFilter === 'matched' :
                    item.tier === 'no_match' ? matchStatusFilter === 'no_match' : !matchStatusFilter
                  );
                  if (isActive) { setTierFilter(''); setMatchStatusFilter(''); }
                  else if (item.tier === 'unqualified') { setTierFilter('filtered'); setMatchStatusFilter('matched'); }
                  else if (item.tier === 'no_match') { setTierFilter('filtered'); setMatchStatusFilter('no_match'); }
                  else { setTierFilter(item.tier); setMatchStatusFilter(''); }
                  setPage(1);
                }}
                className={(() => {
                  const isActive = tierFilter === (item.tier === 'unqualified' || item.tier === 'no_match' ? 'filtered' : item.tier) && (
                    item.tier === 'unqualified' ? matchStatusFilter === 'matched' :
                    item.tier === 'no_match' ? matchStatusFilter === 'no_match' : !matchStatusFilter
                  );
                  return `w-full flex items-center justify-between px-2.5 py-1 rounded-md text-sm transition-colors ${
                    isActive ? `${item.bg} ${item.color}` : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')
                  }`;
                })()}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.desc}</span>
                </div>
                <span className={`tabular-nums font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add Form */}
        <div className={`flex-1 rounded-xl border ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          {/* Tabs + queue count header */}
          <div className={`flex items-center justify-between border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <div className="flex">
              <button onClick={() => setQaTab('single')} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${qaTab === 'single' ? (isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900') : `border-transparent ${isDark ? 'text-gray-500' : 'text-gray-400'}`}`}>
                Single Entry
              </button>
              <button onClick={() => setQaTab('csv')} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${qaTab === 'csv' ? (isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900') : `border-transparent ${isDark ? 'text-gray-500' : 'text-gray-400'}`}`}>
                CSV
              </button>
            </div>
            <div className="flex items-center gap-2 pr-3">
              <select value={qaProgram} onChange={(e) => setQaProgram(e.target.value)} className={`${qaInput} w-40`} style={selectStyle}>
                <option value="">Program...</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {qaBatch.length > 0 && (
                <>
                  <span className={`text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{qaBatch.length} queued</span>
                  <button onClick={() => setQaBatch([])} className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>Clear</button>
                </>
              )}
            </div>
          </div>
          {/* Retry Queue Banner */}
          {retryLeads.length > 0 && (
            <div className={`mx-3 mt-2 px-3 py-2 rounded-lg border flex items-center justify-between ${
              isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50/80 border-amber-200/60'
            }`}>
              <div className="min-w-0">
                <p className={`text-xs font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                  {retryLeads.length} queued for retry
                </p>
                <p className={`text-[10px] truncate ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'}`}>
                  {retryLeads.map((l: any) => `${l.firstName} ${l.lastName}`).join(', ')}
                </p>
              </div>
              <button
                onClick={loadRetryIntoBatch}
                disabled={loadingRetry}
                className={`ml-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-50 ${
                  isDark
                    ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                {loadingRetry ? 'Loading...' : 'Load into Batch'}
              </button>
            </div>
          )}

          <div className="px-3 py-2">
            {qaError && <p className="text-xs text-red-500 mb-1.5">{qaError}</p>}

            {qaTab === 'single' ? (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <input type="text" value={qaFirst} onChange={(e) => setQaFirst(e.target.value)} placeholder="First name" className={`flex-1 ${qaInput}`} />
                  <input type="text" value={qaLast} onChange={(e) => setQaLast(e.target.value)} placeholder="Last name" className={`flex-1 ${qaInput}`} />
                  <input type="text" value={qaSsn} onChange={(e) => handleQaSsn(e.target.value)} placeholder="SSN" className={`w-28 ${qaInput}`} />
                  <input type="text" value={qaDob} onChange={(e) => handleQaDob(e.target.value)} placeholder="DOB" className={`w-24 ${qaInput}`} />
                </div>
                <div className="flex gap-1.5">
                  <input type="text" value={qaAddress} onChange={(e) => setQaAddress(e.target.value)} placeholder="Street address" className={`flex-[2] ${qaInput}`} />
                  <input type="text" value={qaCity} onChange={(e) => setQaCity(e.target.value)} placeholder="City" className={`flex-1 ${qaInput}`} />
                  <select value={qaState} onChange={(e) => setQaState(e.target.value)} className={`w-16 ${qaInput}`} style={selectStyle}>
                    <option value="">ST</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="text" value={qaZip} onChange={(e) => setQaZip(e.target.value.slice(0,10))} placeholder="ZIP" className={`w-20 ${qaInput}`} />
                  <button onClick={addToQaBatch} className={`px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    + Add
                  </button>
                  <button
                    onClick={submitQaBatch}
                    disabled={qaSubmitting || qaBatch.length < 2}
                    className="px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {qaSubmitting ? 'Running...' : `Run (${qaBatch.length})`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <textarea
                    value={qaCsv}
                    onChange={(e) => setQaCsv(e.target.value)}
                    className={`flex-1 font-mono ${qaInput}`}
                    rows={3}
                    placeholder="first_name,last_name,address,city,state,zip,ssn,dob"
                  />
                  <div className="flex flex-col gap-1.5 justify-end">
                    <button onClick={parseQaCsv} disabled={!qaCsv.trim()} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-30`}>
                      Parse
                    </button>
                    <button
                      onClick={submitQaBatch}
                      disabled={qaSubmitting || qaBatch.length < 2}
                      className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {qaSubmitting ? '...' : `Run (${qaBatch.length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mini batch queue */}
            {qaBatch.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {qaBatch.map((r, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {r.firstName} {r.lastName}
                    <button onClick={() => setQaBatch(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-0.5">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fill Missing Bureaus */}
      {fillData && fillData.summary.totalLeadsWithMissing > 0 && !fillResult && (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          {/* Header row — always visible */}
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setFillExpanded(!fillExpanded)} className="flex items-center gap-2 min-w-0">
              <svg className={`w-3.5 h-3.5 transition-transform ${fillExpanded ? 'rotate-90' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h3 className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Missing Bureau Scores
              </h3>
              <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                {fillData.summary.totalLeadsWithMissing}
              </span>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {fillData.summary.missingEq > 0 && <span className="ml-1"><span className={isDark ? 'text-red-400' : 'text-red-500'}>EQ</span> {fillData.summary.missingEq}</span>}
                {fillData.summary.missingTu > 0 && <span className="ml-2"><span className={isDark ? 'text-blue-400' : 'text-blue-500'}>TU</span> {fillData.summary.missingTu}</span>}
                {fillData.summary.missingEx > 0 && <span className="ml-2"><span className={isDark ? 'text-purple-400' : 'text-purple-500'}>EX</span> {fillData.summary.missingEx}</span>}
              </span>
            </button>
            <div className="flex items-center gap-2">
              {fillSelected.size > 0 && (
                <button
                  onClick={() => handleFillMissing(Array.from(fillSelected))}
                  disabled={filling}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-gray-800'
                  } disabled:opacity-50`}
                >
                  {filling ? 'Filling...' : `Fill Selected (${fillSelected.size})`}
                </button>
              )}
              <button
                onClick={() => handleFillMissing()}
                disabled={filling}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-gray-800'
                } disabled:opacity-50`}
              >
                {filling ? (
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 border-2 rounded-full animate-spin ${isDark ? 'border-gray-500 border-t-white' : 'border-gray-400 border-t-white'}`} />
                    Filling...
                  </span>
                ) : 'Fill All'}
              </button>
            </div>
          </div>

          {/* Expandable lead list */}
          {fillExpanded && fillData.leads.length > 0 && (
            <div className={`border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
              {/* Select all */}
              <div className={`px-4 py-2 flex items-center gap-2 ${isDark ? 'bg-gray-900/30' : 'bg-gray-50/50'}`}>
                <input
                  type="checkbox"
                  checked={fillSelected.size === fillData.leads.length}
                  onChange={() => {
                    if (fillSelected.size === fillData.leads.length) {
                      setFillSelected(new Set());
                    } else {
                      setFillSelected(new Set(fillData.leads.map((l: any) => l.id)));
                    }
                  }}
                  className="w-3.5 h-3.5 rounded cursor-pointer accent-gray-600"
                />
                <span className={`text-[11px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {fillSelected.size === fillData.leads.length ? 'Deselect All' : 'Select All'}
                </span>
              </div>
              {/* Lead rows */}
              <div className="max-h-64 overflow-y-auto">
                {fillData.leads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className={`px-4 py-2 flex items-center gap-3 ${
                      isDark ? 'hover:bg-gray-700/20 border-b border-gray-700/20' : 'hover:bg-gray-50 border-b border-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={fillSelected.has(lead.id)}
                      onChange={() => {
                        setFillSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(lead.id)) next.delete(lead.id);
                          else next.add(lead.id);
                          return next;
                        });
                      }}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-gray-600"
                    />
                    <span className={`text-xs font-mono ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{formatId(lead.id)}</span>
                    <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {lead.firstName} {lead.lastName}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {lead.existingScores && Object.entries(lead.existingScores).map(([b, s]: [string, any]) => (
                        <span key={b} className="mr-2">
                          <span className="font-medium" style={{ color: b === 'eq' ? '#ef4444' : b === 'tu' ? '#3b82f6' : '#a855f7' }}>{b.toUpperCase()}</span>
                          <span className="ml-0.5">{s ?? '--'}</span>
                        </span>
                      ))}
                    </span>
                    <span className={`text-[10px] ml-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>
                      missing: {lead.missingBureaus.map((b: string) => b.toUpperCase()).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fill Results */}
      {fillResult && (
        <div className={`rounded-lg border px-4 py-3 ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Fill Complete
              </span>
              {fillResult.totalUpdated > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  {fillResult.totalUpdated} score{fillResult.totalUpdated !== 1 ? 's' : ''} added
                </span>
              )}
              {fillResult.totalUpdated === 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  No new scores found
                </span>
              )}
            </div>
            <button
              onClick={() => setFillResult(null)}
              className={`text-xs ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Dismiss
            </button>
          </div>
          <div className="flex gap-4 mt-2">
            {(['eq', 'tu', 'ex'] as const).map((b) => {
              const r = fillResult.results[b];
              if (!r || (r.submitted === 0 && !r.error)) return null;
              const colors = { eq: isDark ? '#f87171' : '#ef4444', tu: isDark ? '#60a5fa' : '#3b82f6', ex: isDark ? '#c084fc' : '#a855f7' };
              return (
                <div key={b} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-semibold" style={{ color: colors[b] }}>{b.toUpperCase()}</span>
                  {r.submitted > 0 && <span className="ml-1">{r.submitted} sent</span>}
                  {r.qualified > 0 && <span className={`ml-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{r.qualified} found</span>}
                  {r.failed > 0 && <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{r.failed} no match</span>}
                  {r.error && <span className={`ml-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>{r.error}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
        {/* Filters toolbar */}
        <div className={`flex flex-wrap items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by name..."
              className={`w-full px-3 py-1.5 rounded-md border text-sm outline-none transition-all ${
                isDark ? 'bg-gray-700/50 border-gray-600/60 text-white focus:border-gray-500 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-300 placeholder-gray-400'
              }`}
            />
          </div>
          <select
            value={tierFilter === 'filtered' && matchStatusFilter === 'matched' ? 'unqualified' : tierFilter === 'filtered' && matchStatusFilter === 'no_match' ? 'no_match_filter' : tierFilter}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'unqualified') { setTierFilter('filtered'); setMatchStatusFilter('matched'); }
              else if (v === 'no_match_filter') { setTierFilter('filtered'); setMatchStatusFilter('no_match'); }
              else { setTierFilter(v); setMatchStatusFilter(''); }
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md border text-sm outline-none transition-all cursor-pointer appearance-none ${
              isDark ? 'bg-gray-700/50 border-gray-600/60 text-white focus:border-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-300'
            }`}
            style={{ ...selectStyle, paddingRight: '2rem' }}
          >
            <option value="">All tiers</option>
            <option value="tier_1">Tier 1 (620+)</option>
            <option value="tier_2">Tier 2 (580-619)</option>
            <option value="tier_3">Tier 3 (500-579)</option>
            <option value="below">Below (under 500)</option>
            <option value="unqualified">Unqualified</option>
            <option value="no_match_filter">No Match</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={programFilter}
            onChange={(e) => { setProgramFilter(e.target.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-md border text-sm outline-none transition-all cursor-pointer appearance-none ${
              isDark ? 'bg-gray-700/50 border-gray-600/60 text-white focus:border-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gray-300'
            }`}
            style={{ ...selectStyle, paddingRight: '2rem' }}
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {(tierFilter || matchStatusFilter || programFilter || search) && (
            <button
              onClick={() => { setTierFilter(''); setMatchStatusFilter(''); setProgramFilter(''); setSearch(''); setDebouncedSearch(''); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/60' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Clear
            </button>
          )}
          <span className={`text-xs ml-auto tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {total} result{total !== 1 ? 's' : ''}
          </span>
        </div>
        {tableLoading && leads.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className={`w-5 h-5 border-2 ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-200 border-t-gray-600'} rounded-full animate-spin`} />
          </div>
        ) : leads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {search || tierFilter || programFilter
                ? 'No results match your filters.'
                : 'No results yet. Submit your first prescreen to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className={`overflow-x-auto ${tableLoading ? 'opacity-50' : ''}`}>
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
                            { key: 'ex', label: 'EX', score: lead.bureauScores?.ex, hit: lead.bureauHits?.ex, color: isDark ? '#c084fc' : '#a855f7' },
                          ].map((b) => {
                            const hasRow = b.key in (lead.bureauScores || {});
                            const hasScore = b.score != null;
                            const hasBureauData = Object.keys(lead.bureauScores || {}).length > 0;
                            // 4 states: score | greyX (below threshold) | noMatch | dash (not checked)
                            // Leads WITH result rows: use rows for state, missing bureaus = dash
                            // Leads with ZERO rows: fall back to lead-level matchStatus
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
                                        ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)')
                                        : isGreyX
                                          ? (isDark ? 'rgba(107,114,128,0.08)' : 'rgba(107,114,128,0.05)')
                                          : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                    border: hasScore
                                      ? `2.5px solid ${b.color}`
                                      : isNoMatch
                                        ? `2px dashed ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`
                                        : isGreyX
                                          ? `2px dashed ${isDark ? 'rgba(107,114,128,0.4)' : 'rgba(107,114,128,0.25)'}`
                                          : `2px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                                  }}
                                >
                                  {hasScore ? (
                                    <span className={`text-[10px] font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.score}</span>
                                  ) : isNoMatch ? (
                                    <span className={`text-[7px] font-bold ${isDark ? 'text-red-400/60' : 'text-red-400/50'}`}>N/M</span>
                                  ) : isGreyX ? (
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{'\u2717'}</span>
                                  ) : (
                                    <span className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>{'\u2014'}</span>
                                  )}
                                </div>
                                <span className="text-[9px] font-semibold tracking-wide" style={{ color: hasScore || hasRow ? b.color : (isDark ? '#4b5563' : '#d1d5db') }}>{b.label}</span>
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
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-white text-gray-500 shadow-sm border border-gray-100'}`}>
                                      ***-**-{expandedData.ssnLastFour}
                                    </span>
                                  )}
                                  {expandedData.program && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${isDark ? 'bg-blue-900/20 text-blue-400/80' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                      {expandedData.program.name}{expandedData.batch ? ` / ${expandedData.batch.name}` : ''}
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
                                      {expandedData.hardPulls.length > 0 && !inlineHpForm && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                                          {expandedData.hardPulls.length} logged
                                        </span>
                                      )}
                                    </div>
                                    {expandedData.hardPulls.length > 0 && !inlineHpForm && (
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
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[11px] font-semibold shrink-0 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Notes</span>
                                    <input
                                      type="text"
                                      value={inlineNotes}
                                      onChange={(e) => { setInlineNotes(e.target.value); setInlineNotesDirty(true); }}
                                      placeholder="Add notes about this lead..."
                                      className={`flex-1 px-3 py-1.5 text-xs rounded-md border ${isDark ? 'bg-gray-600/30 border-gray-600/40 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400'}`}
                                    />
                                    {inlineNotesDirty && (
                                      <button onClick={saveInlineNotes} disabled={inlineNotesSaving}
                                        className="px-3 py-1.5 text-[11px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40">
                                        {inlineNotesSaving ? '...' : 'Save'}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Bureau Attributes — tab buttons */}
                                {expandedData.bureauResults.some((br: any) => br.rawOutput) && (
                                  <div>
                                    <div className="flex items-center gap-1">
                                      {expandedData.bureauResults.filter((br: any) => br.rawOutput).map((br: any) => {
                                        const colors: Record<string, { bg: string; text: string; activeBg: string }> = {
                                          eq: { bg: isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50', text: isDark ? 'text-red-400' : 'text-red-500', activeBg: isDark ? 'bg-red-900/25 border-red-500/30' : 'bg-red-50 border-red-200' },
                                          tu: { bg: isDark ? 'hover:bg-blue-900/20' : 'hover:bg-blue-50', text: isDark ? 'text-blue-400' : 'text-blue-500', activeBg: isDark ? 'bg-blue-900/25 border-blue-500/30' : 'bg-blue-50 border-blue-200' },
                                          ex: { bg: isDark ? 'hover:bg-purple-900/20' : 'hover:bg-purple-50', text: isDark ? 'text-purple-400' : 'text-purple-500', activeBg: isDark ? 'bg-purple-900/25 border-purple-500/30' : 'bg-purple-50 border-purple-200' },
                                        };
                                        const c = colors[br.bureau] || colors.eq;
                                        const isOpen = expandedBureau === br.bureau;
                                        const fields = Object.entries(br.rawOutput || {}).filter(([k]) => k !== 'credit_score');
                                        return (
                                          <button key={br.bureau}
                                            onClick={(e) => { e.stopPropagation(); setExpandedBureau(isOpen ? null : br.bureau); }}
                                            className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all border ${
                                              isOpen
                                                ? `${c.activeBg} ${c.text}`
                                                : `border-transparent ${c.text} ${c.bg} opacity-60 hover:opacity-100`
                                            }`}
                                          >
                                            {br.bureau.toUpperCase()}
                                            <span className={`ml-1 text-[10px] font-normal ${isOpen ? 'opacity-60' : 'opacity-40'}`}>{fields.length}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {expandedBureau && (() => {
                                      const br = expandedData.bureauResults.find((r: any) => r.bureau === expandedBureau);
                                      if (!br?.rawOutput) return null;
                                      const fields = Object.entries(br.rawOutput).filter(([k]) => k !== 'credit_score');
                                      const bColors: Record<string, string> = { eq: isDark ? 'border-red-500/20' : 'border-red-100', tu: isDark ? 'border-blue-500/20' : 'border-blue-100', ex: isDark ? 'border-purple-500/20' : 'border-purple-100' };
                                      return (
                                        <div className={`mt-2 p-3 rounded-lg border ${bColors[expandedBureau] || ''} ${isDark ? 'bg-gray-800/40' : 'bg-white shadow-sm'}`}>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1.5">
                                            {fields.map(([key, value]) => (
                                              <div key={key} className="flex justify-between items-baseline text-[11px] gap-2">
                                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{getFriendlyName(key)}</span>
                                                <span className={`font-medium tabular-nums ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{formatAttributeValue(key, value)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })()}
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
            {totalPages > 1 && (
              <div className={`flex items-center justify-between px-5 py-3 border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                <p className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Page {page} of {totalPages}
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
          </>
        )}
      </div>
    </div>
  );
}
