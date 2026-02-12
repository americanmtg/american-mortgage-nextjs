'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../AdminContext';

interface Stats {
  totalLeads: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  belowCount: number;
  filteredCount: number;
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
  bureauScores: Record<string, number | null>;
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

const tierLabel = (tier: string) => {
  switch (tier) {
    case 'tier_1': return 'Tier 1';
    case 'tier_2': return 'Tier 2';
    case 'tier_3': return 'Tier 3';
    case 'below': return 'Below';
    case 'filtered': return 'Filtered';
    default: return 'Pending';
  }
};

const tierBadge = (tier: string, isDark: boolean) => {
  switch (tier) {
    case 'tier_1': return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    case 'tier_2': return isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700';
    case 'tier_3': return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700';
    case 'below': return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
    case 'filtered': return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
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
  const [programFilter, setProgramFilter] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // API Status (manual check only)
  const [apiStatus, setApiStatus] = useState<{ status: string; message: string; latencyMs?: number } | null>(null);
  const [apiLastChecked, setApiLastChecked] = useState<Date | null>(null);
  const [apiChecking, setApiChecking] = useState(false);

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
  }, []);

  // Load results with filters
  const loadResults = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (tierFilter) params.set('tier', tierFilter);
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
  }, [page, tierFilter, programFilter, sortBy, sortDir, debouncedSearch]);

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
    { label: 'Filtered', desc: 'No hit', value: stats?.filteredCount ?? 0, tier: 'filtered', color: isDark ? 'text-red-400' : 'text-red-500', bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
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
            onClick={() => { setTierFilter(''); setProgramFilter(''); setSearch(''); setDebouncedSearch(''); setPage(1); }}
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
                onClick={() => { setTierFilter(tierFilter === item.tier ? '' : item.tier); setPage(1); }}
                className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-sm transition-colors ${
                  tierFilter === item.tier
                    ? `${item.bg} ${item.color}`
                    : (isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700/20' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50')
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className={`text-xs ${tierFilter === item.tier ? 'opacity-70' : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>{item.desc}</span>
                </div>
                <span className={`tabular-nums font-semibold ${tierFilter === item.tier ? item.color : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>{item.value}</span>
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
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
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
            <option value="filtered">Filtered</option>
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
          {(tierFilter || programFilter || search) && (
            <button
              onClick={() => { setTierFilter(''); setProgramFilter(''); setSearch(''); setDebouncedSearch(''); setPage(1); }}
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
                      { key: '', label: 'ID' },
                      { key: 'last_name', label: 'Name' },
                      { key: 'middle_score', label: 'Score' },
                      { key: 'tier', label: 'Tier' },
                      { key: 'firm_offer_sent', label: 'Firm Offer' },
                      { key: '', label: 'Hard Pull' },
                      { key: 'created_at', label: 'Date' },
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
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/admin/prescreen/results/${lead.id}`)}
                      className={`cursor-pointer transition-colors ${
                        isDark
                          ? `hover:bg-gray-700/20 ${idx !== leads.length - 1 ? 'border-b border-gray-700/30' : ''}`
                          : `hover:bg-gray-50/80 ${idx !== leads.length - 1 ? 'border-b border-gray-100/80' : ''}`
                      }`}
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
                      <td className="px-5 py-2.5">
                        <div className={`text-sm tabular-nums font-semibold ${
                          lead.middleScore != null ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-600' : 'text-gray-300')
                        }`}>
                          {lead.middleScore ?? '\u2014'}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] tabular-nums">
                            <span className={isDark ? 'text-red-400' : 'text-red-500'}>EQ</span>
                            <span className={`ml-0.5 ${lead.bureauScores?.eq != null ? (isDark ? 'text-gray-300' : 'text-gray-600') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>{lead.bureauScores?.eq ?? 'N/A'}</span>
                          </span>
                          <span className="text-[10px] tabular-nums">
                            <span className={isDark ? 'text-blue-400' : 'text-blue-500'}>TU</span>
                            <span className={`ml-0.5 ${lead.bureauScores?.tu != null ? (isDark ? 'text-gray-300' : 'text-gray-600') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>{lead.bureauScores?.tu ?? 'N/A'}</span>
                          </span>
                          <span className="text-[10px] tabular-nums">
                            <span className={isDark ? 'text-emerald-400' : 'text-emerald-500'}>EX</span>
                            <span className={`ml-0.5 ${lead.bureauScores?.ex != null ? (isDark ? 'text-gray-300' : 'text-gray-600') : (isDark ? 'text-gray-600' : 'text-gray-400')}`}>{lead.bureauScores?.ex ?? 'N/A'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded-full font-medium ${tierBadge(lead.tier, isDark)}`}>
                          {tierLabel(lead.tier)}
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
                    </tr>
                  ))}
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
