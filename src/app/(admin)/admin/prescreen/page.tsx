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
    case 'below':
    case 'filtered': return matchStatus === 'no_match' ? 'No Match' : 'Unqualified';
    default: return 'Pending';
  }
};

const tierBadge = (tier: string, isDark: boolean, matchStatus?: string) => {
  switch (tier) {
    case 'tier_1': return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    case 'tier_2': return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700';
    case 'tier_3': return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700';
    case 'below':
    case 'filtered': return matchStatus === 'no_match'
      ? (isDark ? 'bg-red-900/20 text-red-400/70' : 'bg-red-50 text-red-400')
      : (isDark ? 'bg-gray-700/40 text-gray-400' : 'bg-gray-100 text-gray-500');
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
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Retry queue
  const [queuedIds, setQueuedIds] = useState<Set<number>>(new Set());
  const [retryLeads, setRetryLeads] = useState<any[]>([]);
  const [loadingRetry, setLoadingRetry] = useState(false);

  // Table collapse
  const [tableCollapsed, setTableCollapsed] = useState(false);

  // Expanded row detail
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<any>(null);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);

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

  // API Status (manual check only)
  const [apiStatus, setApiStatus] = useState<{ status: string; message: string; latencyMs?: number } | null>(null);
  const [apiLastChecked, setApiLastChecked] = useState<Date | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prescreen_last_checked');
      return saved ? new Date(saved) : null;
    }
    return null;
  });
  const [apiChecking, setApiChecking] = useState(false);

  // Fill missing bureaus
  const [fillData, setFillData] = useState<{ summary: { totalLeadsWithMissing: number; missingEq: number; missingTu: number; missingEx: number }; leads: any[] } | null>(null);
  const [fillExpanded, setFillExpanded] = useState(false);
  const [fillSelected, setFillSelected] = useState<Map<number, Set<string>>>(new Map());
  const [filling, setFilling] = useState(false);
  const [fillResult, setFillResult] = useState<{ results: Record<string, { submitted: number; qualified: number; failed: number; error?: string }>; totalUpdated: number } | null>(null);
  const [fillSearch, setFillSearch] = useState('');

  // Incoming applications (from Arive/Zapier)
  interface IncomingApp {
    id: number;
    source: string;
    sourceLoanId: string | null;
    borrowerType: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    dob: string | null;
    hasSsn: boolean;
    ssnLastFour: string | null;
    hasDob: boolean;
    loanAmount: number | null;
    loanPurpose: string | null;
    loanType: string | null;
    status: string;
    prescreenLeadId: number | null;
    createdAt: string;
  }
  const [incomingApps, setIncomingApps] = useState<IncomingApp[]>([]);
  const [dismissedApps, setDismissedApps] = useState<IncomingApp[]>([]);
  const [incomingExpanded, setIncomingExpanded] = useState(false);
  const [incomingTab, setIncomingTab] = useState<'pending' | 'dismissed'>('pending');
  const [incomingLoading, setIncomingLoading] = useState(false);
  const [incomingSsnInputs, setIncomingSsnInputs] = useState<Record<number, string>>({});
  const [incomingDobInputs, setIncomingDobInputs] = useState<Record<number, string>>({});
  const handleIncomingSsn = (appId: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 9);
    let formatted = d;
    if (d.length > 5) formatted = `${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`;
    else if (d.length > 3) formatted = `${d.slice(0,3)}-${d.slice(3)}`;
    setIncomingSsnInputs(prev => ({ ...prev, [appId]: formatted }));
  };

  const handleIncomingDob = (appId: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    let formatted = d;
    if (d.length > 4) formatted = `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
    else if (d.length > 2) formatted = `${d.slice(0,2)}/${d.slice(2)}`;
    setIncomingDobInputs(prev => ({ ...prev, [appId]: formatted }));
  };

  const sortByLoanGroup = (items: IncomingApp[]) => {
    items.sort((a, b) => {
      const aLoan = a.sourceLoanId || '';
      const bLoan = b.sourceLoanId || '';
      if (aLoan && bLoan && aLoan === bLoan) {
        return a.borrowerType === 'primary' ? -1 : 1;
      }
      return 0;
    });
    return items;
  };

  const loadIncomingApps = useCallback(async () => {
    try {
      const [pendingRes, dismissedRes] = await Promise.all([
        fetch('/api/prescreen/applications?status=pending', { credentials: 'include' }),
        fetch('/api/prescreen/applications?status=dismissed', { credentials: 'include' }),
      ]);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setIncomingApps(sortByLoanGroup(data.data?.items || []));
      }
      if (dismissedRes.ok) {
        const data = await dismissedRes.json();
        setDismissedApps(sortByLoanGroup(data.data?.items || []));
      }
    } catch (e) {
      console.error('Failed to load incoming apps:', e);
    }
  }, []);

  const saveSsnDob = async (appId: number) => {
    const ssnRaw = (incomingSsnInputs[appId] || '').replace(/\D/g, '');
    const dobRaw = (incomingDobInputs[appId] || '').replace(/\D/g, '');
    const updates: any = {};
    if (ssnRaw.length === 9) updates.ssn = ssnRaw;
    if (dobRaw.length === 8) updates.dob = `${dobRaw.slice(4,8)}-${dobRaw.slice(0,2)}-${dobRaw.slice(2,4)}`;
    if (Object.keys(updates).length === 0) return;
    try {
      const res = await fetch(`/api/prescreen/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (res.ok) loadIncomingApps();
    } catch (e) {
      console.error('Failed to save SSN/DOB:', e);
    }
  };

  const addAppToBatch = async (appId: number) => {
    // Auto-save SSN/DOB first if entered
    await saveSsnDob(appId);
    const app = incomingApps.find(a => a.id === appId);
    if (!app) return;

    const ssnRaw = (incomingSsnInputs[appId] || '').replace(/\D/g, '');
    const dobRaw = (incomingDobInputs[appId] || '').replace(/\D/g, '');
    const dobISO = dobRaw.length === 8 ? `${dobRaw.slice(4,8)}-${dobRaw.slice(0,2)}-${dobRaw.slice(2,4)}` : '';
    // If DOB came from Arive (stored on the app), convert it
    let finalDob = dobISO;
    if (!finalDob && app.dob) {
      // Arive DOB may be MM/DD/YYYY or YYYY-MM-DD
      const d = app.dob.replace(/\D/g, '');
      if (d.length === 8 && app.dob.includes('/')) {
        finalDob = `${d.slice(4,8)}-${d.slice(0,2)}-${d.slice(2,4)}`;
      } else if (app.dob.includes('-')) {
        finalDob = app.dob;
      }
    }

    setQaBatch(prev => [...prev, {
      firstName: app.firstName,
      lastName: app.lastName,
      address: app.address || '',
      address2: '',
      city: app.city || '',
      state: app.state || 'AR',
      zip: app.zip || '',
      ssn: ssnRaw,
      dob: finalDob,
    }]);

    // Mark as added (dismiss from incoming queue)
    try {
      await fetch(`/api/prescreen/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'dismissed' }),
      });
      loadIncomingApps();
    } catch (e) {
      console.error('Error dismissing app after add:', e);
    }
  };

  const dismissApp = async (appId: number) => {
    try {
      await fetch(`/api/prescreen/applications/${appId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      loadIncomingApps();
    } catch (e) {
      console.error('Dismiss error:', e);
    }
  };

  const restoreApp = async (appId: number) => {
    try {
      await fetch(`/api/prescreen/applications/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'pending' }),
      });
      setIncomingTab('pending');
      loadIncomingApps();
    } catch (e) {
      console.error('Restore error:', e);
    }
  };

  // Quick-add form
  interface QaRecord { firstName: string; lastName: string; address: string; address2: string; city: string; state: string; zip: string; ssn: string; dob: string; }
  const [qaProgram, setQaProgram] = useState('');
  const [qaFirst, setQaFirst] = useState('');
  const [qaLast, setQaLast] = useState('');
  const [qaAddress, setQaAddress] = useState('');
  const [qaAddress2, setQaAddress2] = useState('');
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
    setQaBatch(prev => [...prev, { firstName: qaFirst.trim(), lastName: qaLast.trim(), address: qaAddress.trim(), address2: qaAddress2.trim(), city: qaCity.trim(), state: qaState, zip: qaZip.trim(), ssn: ssnDigits, dob: dobISO }]);
    setQaFirst(''); setQaLast(''); setQaAddress(''); setQaAddress2(''); setQaCity(''); setQaState('AR'); setQaZip(''); setQaSsn(''); setQaDob('');
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
      newRecords.push({ firstName: row.first_name, lastName: row.last_name, address: row.address, address2: row.address_2 || row.address2 || row.apt || row.unit || '', city: row.city, state: row.state, zip: row.zip, ssn: (row.ssn || '').replace(/\D/g, ''), dob: row.dob || '' });
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
        const standard = items.find((p: Program) => p.name.toLowerCase().includes('standard'));
        setQaProgram(String((standard || items[0])?.id || ''));
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
    loadIncomingApps();
  }, [loadIncomingApps]);

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
          address2: lead.address2 || '',
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

  // Compute selected bureau counts from fillSelected map
  const fillBureauCounts = (() => {
    const counts: Record<string, number> = { eq: 0, tu: 0, ex: 0 };
    fillSelected.forEach((bureaus) => {
      bureaus.forEach((b) => { counts[b] = (counts[b] || 0) + 1; });
    });
    return counts;
  })();
  const fillTotalSelections = fillBureauCounts.eq + fillBureauCounts.tu + fillBureauCounts.ex;

  const handleFillMissing = async (selections?: Map<number, Set<string>>) => {
    setFilling(true);
    setFillResult(null);
    try {
      let body: string | undefined;
      if (selections && selections.size > 0) {
        // Convert Map<number, Set<string>> to { selections: { [leadId]: string[] } }
        const obj: Record<number, string[]> = {};
        selections.forEach((bureaus, leadId) => { obj[leadId] = Array.from(bureaus); });
        body = JSON.stringify({ selections: obj });
      }
      const res = await fetch('/api/prescreen/fill-missing', {
        method: 'POST', credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setFillResult(data.data);
        setFillSelected(new Map());
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
      params.set('limit', limit.toString());
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
  }, [page, limit, tierFilter, matchStatusFilter, programFilter, sortBy, sortDir, debouncedSearch]);

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
        const now = new Date();
        setApiLastChecked(now);
        localStorage.setItem('prescreen_last_checked', now.toISOString());
      } else {
        setApiStatus({ status: 'error', message: 'Failed to reach test endpoint' });
        const now = new Date();
        setApiLastChecked(now);
        localStorage.setItem('prescreen_last_checked', now.toISOString());
      }
    } catch (err: any) {
      setApiStatus({ status: 'error', message: err.message });
      const now = new Date();
      setApiLastChecked(now);
      localStorage.setItem('prescreen_last_checked', now.toISOString());
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
    { label: 'Unqualified', desc: 'Under 500', value: (stats?.belowCount ?? 0) + (stats?.unqualifiedCount ?? 0), tier: 'unqualified', color: isDark ? 'text-gray-400' : 'text-gray-500', bg: isDark ? 'bg-gray-500/10' : 'bg-gray-100' },
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
          {!apiChecking && (apiStatus || apiLastChecked) && (
            <span className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {apiStatus?.message && <span>{apiStatus.message} · </span>}
              {apiLastChecked && (
                <span>Last checked {apiLastChecked.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'America/Chicago' })} {apiLastChecked.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })} CST</span>
              )}
            </span>
          )}
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
      <div className="flex gap-4 items-stretch">
        {/* Score Metrics */}
        <div className={`rounded-xl border w-[240px] flex-shrink-0 flex flex-col ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          {/* Total */}
          <button
            onClick={() => { setTierFilter(''); setMatchStatusFilter(''); setProgramFilter(''); setSearch(''); setDebouncedSearch(''); setPage(1); }}
            className={`px-3 py-2 border-b flex items-center justify-between transition-colors ${
              isDark ? 'border-gray-700/60 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50'
            } ${!tierFilter ? (isDark ? 'bg-gray-700/20' : 'bg-gray-50/80') : ''}`}
          >
            <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total</span>
            <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.totalLeads ?? 0}</span>
          </button>
          {/* Tiers */}
          <div className="p-1.5 flex-1 flex flex-col justify-center">
            {tierItems.map((item) => {
              const isActive = tierFilter === (item.tier === 'no_match' ? 'filtered' : item.tier) && (
                item.tier === 'no_match' ? matchStatusFilter === 'no_match' : !matchStatusFilter
              );
              return (
                <button
                  key={item.tier}
                  onClick={() => {
                    if (isActive) { setTierFilter(''); setMatchStatusFilter(''); }
                    else if (item.tier === 'unqualified') { setTierFilter('unqualified'); setMatchStatusFilter(''); }
                    else if (item.tier === 'no_match') { setTierFilter('filtered'); setMatchStatusFilter('no_match'); }
                    else { setTierFilter(item.tier); setMatchStatusFilter(''); }
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-[3px] rounded text-[12px] transition-colors ${
                    isActive ? `${item.bg} ${item.color}` : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className={`tabular-nums font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.value}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Add Form */}
        <div className={`rounded-xl border w-fit ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          {/* Tabs + queue count header */}
          <div className={`flex items-center justify-between border-b px-4 py-1 ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <div className="flex gap-1">
              <button onClick={() => setQaTab('single')} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${qaTab === 'single' ? (isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900') : `border-transparent ${isDark ? 'text-gray-500' : 'text-gray-400'}`}`}>
                Single Entry
              </button>
              <button onClick={() => setQaTab('csv')} className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${qaTab === 'csv' ? (isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900') : `border-transparent ${isDark ? 'text-gray-500' : 'text-gray-400'}`}`}>
                CSV
              </button>
            </div>
            <div className="flex items-center gap-2">
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

          <div className="px-4 py-3">
            {qaError && <p className="text-xs text-red-500 mb-1.5">{qaError}</p>}

            <div className="grid" style={{ gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }}>
              {/* Single Entry — always in DOM */}
              <div className={`space-y-1.5 max-w-2xl transition-opacity duration-150 ${qaTab === 'single' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ gridArea: '1 / 1' }}>
                <div className="flex gap-1.5">
                  <input type="text" value={qaFirst} onChange={(e) => setQaFirst(e.target.value)} placeholder="First name" className={`w-32 ${qaInput}`} />
                  <input type="text" value={qaLast} onChange={(e) => setQaLast(e.target.value)} placeholder="Last name" className={`w-32 ${qaInput}`} />
                  <input type="text" value={qaSsn} onChange={(e) => handleQaSsn(e.target.value)} placeholder="SSN" className={`w-28 ${qaInput}`} />
                  <input type="text" value={qaDob} onChange={(e) => handleQaDob(e.target.value)} placeholder="DOB" className={`w-24 ${qaInput}`} />
                </div>
                <div className="flex gap-1.5">
                  <input type="text" value={qaAddress} onChange={(e) => setQaAddress(e.target.value)} placeholder="Street address" className={`w-44 ${qaInput}`} />
                  <input type="text" value={qaAddress2} onChange={(e) => setQaAddress2(e.target.value)} placeholder="Apt/Unit" className={`w-20 ${qaInput}`} />
                  <input type="text" value={qaCity} onChange={(e) => setQaCity(e.target.value)} placeholder="City" className={`w-28 ${qaInput}`} />
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
              {/* CSV — always in DOM */}
              <div className={`space-y-1.5 transition-opacity duration-150 ${qaTab === 'csv' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ gridArea: '1 / 1' }}>
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
            </div>

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

      {/* Incoming Applications (Arive/Zapier) */}
      {(incomingApps.length > 0 || dismissedApps.length > 0) && (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          <div className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`} onClick={() => setIncomingExpanded(!incomingExpanded)}>
            <div className="flex items-center gap-2 min-w-0">
              <svg className={`w-3.5 h-3.5 transition-transform ${incomingExpanded ? 'rotate-90' : ''} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                Incoming Applications
              </span>
              {incomingApps.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  {incomingApps.length}
                </span>
              )}
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>from Arive</span>
            </div>
          </div>

          {incomingExpanded && (
            <div className={`border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
              {/* Pending / Dismissed tabs */}
              {dismissedApps.length > 0 && (
                <div className={`flex gap-0 border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                  <button
                    onClick={() => setIncomingTab('pending')}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${incomingTab === 'pending'
                      ? (isDark ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600')
                      : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}
                  >
                    Pending{incomingApps.length > 0 ? ` (${incomingApps.length})` : ''}
                  </button>
                  <button
                    onClick={() => setIncomingTab('dismissed')}
                    className={`px-4 py-2 text-xs font-medium transition-colors ${incomingTab === 'dismissed'
                      ? (isDark ? 'text-blue-400 border-b-2 border-blue-400' : 'text-blue-600 border-b-2 border-blue-600')
                      : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}`}
                  >
                    Dismissed ({dismissedApps.length})
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={isDark ? 'bg-gray-900/40' : 'bg-gray-50'}>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</th>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Address</th>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Contact</th>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loan</th>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>SSN</th>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>DOB</th>
                      <th className={`px-3 py-2 text-left font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Received</th>
                      <th className={`px-3 py-2 text-center font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/40' : 'divide-gray-100'}`}>
                    {(() => {
                      // Group apps by loan ID for visual linking
                      const activeApps = incomingTab === 'pending' ? incomingApps : dismissedApps;
                      const loanGroups = new Map<string, IncomingApp[]>();
                      const ungrouped: IncomingApp[] = [];
                      activeApps.forEach(app => {
                        if (app.sourceLoanId) {
                          const group = loanGroups.get(app.sourceLoanId) || [];
                          group.push(app);
                          loanGroups.set(app.sourceLoanId, group);
                        } else {
                          ungrouped.push(app);
                        }
                      });
                      // Flatten: grouped first (in order), then ungrouped
                      const ordered: { app: IncomingApp; groupSize: number; groupIndex: number; partner: string | null }[] = [];
                      loanGroups.forEach(group => {
                        group.sort((a, b) => a.borrowerType === 'primary' ? -1 : 1);
                        group.forEach((app, i) => {
                          const partner = group.find(g => g.id !== app.id);
                          ordered.push({ app, groupSize: group.length, groupIndex: i, partner: partner ? `${partner.firstName} ${partner.lastName}` : null });
                        });
                      });
                      ungrouped.forEach(app => ordered.push({ app, groupSize: 1, groupIndex: 0, partner: null }));

                      return ordered.map(({ app, groupSize, groupIndex, partner }) => {
                        const isCo = app.borrowerType === 'coborrower';
                        const isGrouped = groupSize > 1;
                        const isFirstInGroup = groupIndex === 0;
                        const isLastInGroup = groupIndex === groupSize - 1;
                        return (
                      <tr key={app.id} className={`${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'} transition-colors relative`}>
                        <td className={`py-2.5 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          <div className="flex items-start gap-0">
                            {/* Color bar for grouped loans */}
                            {isGrouped ? (
                              <div className={`w-1 self-stretch flex-shrink-0 ${isDark ? 'bg-blue-500' : 'bg-blue-400'} ${isFirstInGroup ? 'rounded-t' : ''} ${isLastInGroup ? 'rounded-b' : ''}`} style={{ minHeight: '100%' }} />
                            ) : (
                              <div className="w-1 flex-shrink-0" />
                            )}
                            <div className="pl-2.5">
                              <div className="font-medium flex items-center gap-1.5">
                                {isCo && <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>&#8627;</span>}
                                {app.firstName} {app.lastName}
                                {isCo && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>Co-Borrower</span>
                                )}
                              </div>
                              {partner && (
                                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {isCo ? `Primary: ${partner}` : `Co-Borrower: ${partner}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-3 py-2.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="max-w-[200px] truncate">{app.address}{app.city ? `, ${app.city}` : ''}{app.state ? `, ${app.state}` : ''} {app.zip}</div>
                        </td>
                        <td className={`px-3 py-2.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="max-w-[160px] truncate">{app.email || app.phone || '—'}</div>
                        </td>
                        <td className={`px-3 py-2.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {app.loanPurpose || app.loanType || '—'}
                          {app.loanAmount ? <span className="ml-1 opacity-60">${(app.loanAmount / 1000).toFixed(0)}k</span> : ''}
                        </td>
                        <td className="px-3 py-2.5">
                          {app.hasSsn ? (
                            <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>***-**-{app.ssnLastFour}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="XXX-XX-XXXX"
                              value={incomingSsnInputs[app.id] || ''}
                              onChange={e => handleIncomingSsn(app.id, e.target.value)}
                              onBlur={() => saveSsnDob(app.id)}
                              className={`w-[105px] px-1.5 py-1 text-xs rounded border ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {app.hasDob ? (
                            <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{app.dob || 'Set'}</span>
                          ) : (
                            <input
                              type="text"
                              placeholder="MM/DD/YYYY"
                              value={incomingDobInputs[app.id] || (app.dob ? app.dob.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$2/$3/$1') : '')}
                              onChange={e => handleIncomingDob(app.id, e.target.value)}
                              onBlur={() => saveSsnDob(app.id)}
                              className={`w-[95px] px-1.5 py-1 text-xs rounded border ${isDark ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                          )}
                        </td>
                        <td className={`px-3 py-2.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {incomingTab === 'pending' ? (
                              <>
                                <button
                                  onClick={() => addAppToBatch(app.id)}
                                  title="Add to Quick Add batch"
                                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                >
                                  + Add to Batch
                                </button>
                                <button
                                  onClick={() => dismissApp(app.id)}
                                  title="Dismiss"
                                  className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'}`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => restoreApp(app.id)}
                                title="Restore to pending"
                                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                              >
                                Restore
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                        );
                      });
                    })()}
                    {(incomingTab === 'pending' ? incomingApps : dismissedApps).length === 0 && (
                      <tr>
                        <td colSpan={8} className={`px-4 py-6 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {incomingTab === 'pending' ? 'No pending applications' : 'No dismissed applications'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fill Missing Bureaus */}
      {fillData && fillData.summary.totalLeadsWithMissing > 0 && !fillResult && (
        <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          {/* Header row — always visible, click anywhere to expand */}
          <div className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50'}`} onClick={() => setFillExpanded(!fillExpanded)}>
            <div className="flex items-center gap-2 min-w-0">
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
                {fillData.summary.missingEx > 0 && <span className="ml-2"><span className={isDark ? 'text-green-400' : 'text-green-500'}>EX</span> {fillData.summary.missingEx}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {fillTotalSelections > 0 && (
                <>
                  <span className={`text-[10px] tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {fillBureauCounts.eq > 0 && <span className="mr-1.5"><span className={isDark ? 'text-red-400' : 'text-red-500'}>EQ</span> {fillBureauCounts.eq}</span>}
                    {fillBureauCounts.tu > 0 && <span className="mr-1.5"><span className={isDark ? 'text-blue-400' : 'text-blue-500'}>TU</span> {fillBureauCounts.tu}</span>}
                    {fillBureauCounts.ex > 0 && <span><span className={isDark ? 'text-green-400' : 'text-green-500'}>EX</span> {fillBureauCounts.ex}</span>}
                  </span>
                  <button
                    onClick={() => handleFillMissing(fillSelected)}
                    disabled={filling}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50`}
                  >
                    {filling ? 'Filling...' : `Fill Selected (${fillTotalSelections})`}
                  </button>
                </>
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
              {/* Search + Select all */}
              <div className={`px-4 py-2 flex items-center gap-3 ${isDark ? 'bg-gray-900/30' : 'bg-gray-50/50'}`}>
                <input
                  type="text"
                  value={fillSearch}
                  onChange={(e) => setFillSearch(e.target.value)}
                  placeholder="Search by name..."
                  className={`px-2.5 py-1 rounded-md border text-xs outline-none w-48 ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-gray-600' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300'
                  }`}
                />
                <button
                  onClick={() => {
                    const filtered = fillData.leads.filter((l: any) => {
                      if (!fillSearch) return true;
                      const q = fillSearch.toLowerCase();
                      return `${l.firstName} ${l.lastName}`.toLowerCase().includes(q);
                    });
                    const allSelected = filtered.every((l: any) => {
                      const sel = fillSelected.get(l.id);
                      return sel && l.missingBureaus.every((b: string) => sel.has(b));
                    });
                    if (allSelected) {
                      setFillSelected(prev => {
                        const next = new Map(prev);
                        filtered.forEach((l: any) => next.delete(l.id));
                        return next;
                      });
                    } else {
                      setFillSelected(prev => {
                        const next = new Map(prev);
                        filtered.forEach((l: any) => { next.set(l.id, new Set(l.missingBureaus)); });
                        return next;
                      });
                    }
                  }}
                  className={`text-[11px] font-medium ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {fillData.leads.filter((l: any) => {
                    if (!fillSearch) return true;
                    const q = fillSearch.toLowerCase();
                    return `${l.firstName} ${l.lastName}`.toLowerCase().includes(q);
                  }).every((l: any) => {
                    const sel = fillSelected.get(l.id);
                    return sel && l.missingBureaus.every((b: string) => sel.has(b));
                  }) ? 'Deselect All' : 'Select All'}
                </button>
                {fillSearch && (
                  <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {fillData.leads.filter((l: any) => `${l.firstName} ${l.lastName}`.toLowerCase().includes(fillSearch.toLowerCase())).length} of {fillData.leads.length}
                  </span>
                )}
              </div>
              {/* Lead rows */}
              <div className="max-h-64 overflow-y-auto">
                {fillData.leads.filter((l: any) => {
                  if (!fillSearch) return true;
                  const q = fillSearch.toLowerCase();
                  return `${l.firstName} ${l.lastName}`.toLowerCase().includes(q);
                }).map((lead: any) => {
                  const selectedBureaus = fillSelected.get(lead.id) || new Set<string>();
                  const bureauColors: Record<string, { text: string; accent: string }> = {
                    eq: { text: isDark ? 'text-red-400' : 'text-red-500', accent: isDark ? '#f87171' : '#ef4444' },
                    tu: { text: isDark ? 'text-blue-400' : 'text-blue-500', accent: isDark ? '#60a5fa' : '#3b82f6' },
                    ex: { text: isDark ? 'text-green-400' : 'text-green-500', accent: isDark ? '#4ade80' : '#22c55e' },
                  };
                  return (
                    <div
                      key={lead.id}
                      className={`px-4 py-2 flex items-center gap-3 ${
                        isDark ? 'hover:bg-gray-700/20 border-b border-gray-700/20' : 'hover:bg-gray-50 border-b border-gray-50'
                      }`}
                    >
                      <span className={`text-xs font-mono ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{formatId(lead.id)}</span>
                      <span className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {lead.firstName} {lead.lastName}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {lead.existingScores && Object.entries(lead.existingScores).map(([b, s]: [string, any]) => (
                          <span key={b} className="mr-2">
                            <span className="font-medium" style={{ color: bureauColors[b]?.accent || '#888' }}>{b.toUpperCase()}</span>
                            <span className="ml-0.5">{s ?? '--'}</span>
                          </span>
                        ))}
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        {lead.missingBureaus.map((b: string) => {
                          const isChecked = selectedBureaus.has(b);
                          const colors = bureauColors[b] || { text: 'text-gray-400', accent: '#888' };
                          return (
                            <label key={b} className="flex items-center gap-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setFillSelected(prev => {
                                    const next = new Map(prev);
                                    const bureaus = new Set(next.get(lead.id) || []);
                                    if (isChecked) bureaus.delete(b);
                                    else bureaus.add(b);
                                    if (bureaus.size === 0) next.delete(lead.id);
                                    else next.set(lead.id, bureaus);
                                    return next;
                                  });
                                }}
                                className="w-3 h-3 rounded cursor-pointer accent-gray-600"
                              />
                              <span className={`text-[10px] font-semibold ${colors.text}`}>{b.toUpperCase()}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
              const colors = { eq: isDark ? '#f87171' : '#ef4444', tu: isDark ? '#60a5fa' : '#3b82f6', ex: isDark ? '#4ade80' : '#22c55e' };
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
        {/* Collapsible header */}
        <div
          onClick={() => setTableCollapsed(!tableCollapsed)}
          className={`flex items-center justify-between px-4 py-2.5 cursor-pointer select-none transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'} ${!tableCollapsed ? (isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100') : ''}`}
        >
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 transition-transform ${tableCollapsed ? '' : 'rotate-90'} ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Results</span>
            <span className={`text-xs tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{total}</span>
          </div>
          {tableCollapsed && (
            <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Click to expand</span>
          )}
        </div>
        {!tableCollapsed && <>
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
            value={tierFilter === 'filtered' && matchStatusFilter === 'no_match' ? 'no_match_filter' : tierFilter}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'no_match_filter') { setTierFilter('filtered'); setMatchStatusFilter('no_match'); }
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
                      { key: 'middle_score', label: 'Bureaus' },
                      { key: 'middle_score', label: 'Mid' },
                      { key: 'tier', label: 'Tier' },
                      { key: 'firm_offer_sent', label: 'Firm Offer' },
                      { key: '', label: 'Hard Pull' },
                      { key: 'created_at', label: 'Date' },
                      { key: '', label: '' },
                    ].map((col, i) => (
                      <th
                        key={i}
                        onClick={col.key ? () => handleSort(col.key) : undefined}
                        className={`px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider whitespace-nowrap group ${
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
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatId(lead.id)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[13px] font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {lead.firstName} {lead.lastName}
                        </span>
                        {lead.ssnLastFour && (
                          <span className={`ml-1.5 text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {lead.ssnLastFour}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {[
                            { key: 'eq', label: 'EQ', score: lead.bureauScores?.eq, hit: lead.bureauHits?.eq, color: isDark ? '#f87171' : '#ef4444' },
                            { key: 'tu', label: 'TU', score: lead.bureauScores?.tu, hit: lead.bureauHits?.tu, color: isDark ? '#60a5fa' : '#3b82f6' },
                            { key: 'ex', label: 'EX', score: lead.bureauScores?.ex, hit: lead.bureauHits?.ex, color: isDark ? '#4ade80' : '#22c55e' },
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
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
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
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {lead.middleScore != null && lead.bureauScores?.eq != null && lead.bureauScores?.tu != null && lead.bureauScores?.ex != null ? (
                          <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.middleScore}</span>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{'\u2014'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-full font-medium ${tierBadge(lead.tier, isDark, lead.matchStatus)}`}>
                          {tierLabel(lead.tier, lead.matchStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {lead.firmOfferSent ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-full font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>Sent</span>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{'\u2014'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {lead.hardPullCount > 0 ? (
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-full font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>{lead.hardPullCount}</span>
                        ) : (
                          <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>{'\u2014'}</span>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-[11px] tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {new Date((lead as any).lastActivity || lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5">
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
                        <td colSpan={9} className={`px-0 py-0 ${isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-100/80'}`}>
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
                  className={`px-2 py-0.5 rounded text-[11px] border outline-none cursor-pointer ${isDark ? 'bg-gray-700/50 border-gray-600/60 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} / page</option>
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
        </>}
      </div>
    </div>
  );
}
