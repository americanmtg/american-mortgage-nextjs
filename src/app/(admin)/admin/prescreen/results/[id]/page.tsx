'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../../../../AdminContext';
import { ATTRIBUTE_MAP, CATEGORY_ORDER, getFriendlyName, formatAttributeValue } from '@/lib/altair-attributes';

interface BureauResult {
  bureau: string;
  creditScore: number | null;
  isHit: boolean;
  rawOutput: Record<string, any> | null;
  createdAt: string;
}

interface HardPull {
  id: number;
  pullDate: string;
  agency: string | null;
  lender: string | null;
  eqScore: number | null;
  tuScore: number | null;
  exScore: number | null;
  result: string | null;
  notes: string | null;
  performedByEmail: string | null;
  createdAt: string;
}

interface LeadDetail {
  id: number;
  firstName: string;
  lastName: string;
  middleInitial: string | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  ssnLastFour: string | null;
  hasSsn: boolean;
  hasDob: boolean;
  middleScore: number | null;
  tier: string;
  isQualified: boolean;
  matchStatus: string;
  segmentName: string | null;
  errorMessage: string | null;
  notes: string | null;
  firmOfferSent: boolean | null;
  firmOfferDate: string | null;
  firmOfferMethod: string | null;
  bureauResults: BureauResult[];
  hardPulls: HardPull[];
  program: { id: number; name: string } | null;
  batch: { id: number; name: string; submittedAt: string } | null;
  auditLog: Array<{ action: string; performedByEmail: string; createdAt: string }>;
  createdAt: string;
}

const getTierConfig = (tier: string, isDark: boolean) => {
  const configs: Record<string, { badge: string; label: string; dot: string }> = isDark ? {
    tier_1: { badge: 'bg-emerald-900/30 text-emerald-400', label: 'Tier 1', dot: 'bg-emerald-500' },
    tier_2: { badge: 'bg-blue-900/30 text-blue-400', label: 'Tier 2', dot: 'bg-blue-500' },
    tier_3: { badge: 'bg-amber-900/30 text-amber-400', label: 'Tier 3', dot: 'bg-amber-500' },
    below: { badge: 'bg-red-900/30 text-red-400', label: 'Below', dot: 'bg-red-500' },
    filtered: { badge: 'bg-gray-700/60 text-gray-400', label: 'Filtered', dot: 'bg-gray-400' },
    pending: { badge: 'bg-gray-700/60 text-gray-400', label: 'Pending', dot: 'bg-gray-400' },
  } : {
    tier_1: { badge: 'bg-emerald-50 text-emerald-700', label: 'Tier 1', dot: 'bg-emerald-500' },
    tier_2: { badge: 'bg-blue-50 text-blue-700', label: 'Tier 2', dot: 'bg-blue-500' },
    tier_3: { badge: 'bg-amber-50 text-amber-700', label: 'Tier 3', dot: 'bg-amber-500' },
    below: { badge: 'bg-red-50 text-red-600', label: 'Below', dot: 'bg-red-500' },
    filtered: { badge: 'bg-gray-100 text-gray-500', label: 'Filtered', dot: 'bg-gray-400' },
    pending: { badge: 'bg-gray-100 text-gray-500', label: 'Pending', dot: 'bg-gray-400' },
  };
  return configs[tier] || configs.pending;
};

const getBureauConfig = (bureau: string, isDark: boolean) => {
  const configs: Record<string, { name: string; color: string; bg: string; border: string }> = isDark ? {
    eq: { name: 'Equifax', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-800/30' },
    tu: { name: 'TransUnion', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800/30' },
    ex: { name: 'Experian', color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-800/30' },
  } : {
    eq: { name: 'Equifax', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    tu: { name: 'TransUnion', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    ex: { name: 'Experian', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  };
  const fallback = isDark
    ? { name: bureau.toUpperCase(), color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' }
    : { name: bureau.toUpperCase(), color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
  return configs[bureau] || fallback;
};

const resultBadge = (result: string | null, isDark: boolean) => {
  switch (result) {
    case 'approved': return isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    case 'denied': return isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600';
    case 'conditional': return isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-700';
    default: return isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600';
  }
};

function formatId(id: number) {
  return String(id).padStart(2, '0');
}

function ScoreRing({ score, label }: { score: number | null; label: string }) {
  const maxScore = 850;
  const pct = score ? Math.min((score / maxScore) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-100" />
          {score && (
            <circle cx="48" cy="48" r="40" fill="none" stroke="#6b7280" strokeWidth="5"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              strokeLinecap="round" className="transition-all duration-1000" />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{score ?? '--'}</span>
        </div>
      </div>
      <span className="text-[11px] font-medium mt-1.5 text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { isDark } = useTheme();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedSsn, setRevealedSsn] = useState<string | null>(null);
  const [revealedDob, setRevealedDob] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState<string | null>(null);

  // Notes
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

  // Hard pull form
  const [showHardPullForm, setShowHardPullForm] = useState(false);
  const [hpSaving, setHpSaving] = useState(false);
  const [hpDate, setHpDate] = useState(new Date().toISOString().split('T')[0]);
  const [hpAgency, setHpAgency] = useState('');
  const [hpLender, setHpLender] = useState('');
  const [hpEq, setHpEq] = useState('');
  const [hpTu, setHpTu] = useState('');
  const [hpEx, setHpEx] = useState('');
  const [hpResult, setHpResult] = useState('pending');
  const [hpNotes, setHpNotes] = useState('');

  // Firm offer
  const [foEditing, setFoEditing] = useState(false);
  const [foSent, setFoSent] = useState(false);
  const [foDate, setFoDate] = useState('');
  const [foMethod, setFoMethod] = useState('');
  const [foSaving, setFoSaving] = useState(false);

  // Bureau detail expand
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/prescreen/results/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setLead(data.data);
        setNotes(data.data?.notes || '');
        setFoSent(data.data?.firmOfferSent || false);
        setFoDate(data.data?.firmOfferDate ? new Date(data.data.firmOfferDate).toISOString().split('T')[0] : '');
        setFoMethod(data.data?.firmOfferMethod || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecrypt = async (field: 'ssn' | 'dob') => {
    setDecrypting(field);
    try {
      const res = await fetch(`/api/prescreen/results/${id}/decrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ field }),
      });
      if (res.ok) {
        const data = await res.json();
        if (field === 'ssn') {
          setRevealedSsn(data.data.value);
          setTimeout(() => setRevealedSsn(null), 10000);
        } else {
          setRevealedDob(data.data.value);
          setTimeout(() => setRevealedDob(null), 10000);
        }
      }
    } catch (err) {
      console.error('Decrypt failed:', err);
    } finally {
      setDecrypting(null);
    }
  };

  const saveNotes = async () => {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/prescreen/results/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });
      if (res.ok) setNotesDirty(false);
    } catch (err) {
      console.error('Save notes failed:', err);
    } finally {
      setNotesSaving(false);
    }
  };

  const saveHardPull = async () => {
    setHpSaving(true);
    try {
      const res = await fetch(`/api/prescreen/results/${id}/hard-pulls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pullDate: hpDate,
          agency: hpAgency || null,
          lender: hpLender || null,
          eqScore: hpEq ? parseInt(hpEq) : null,
          tuScore: hpTu ? parseInt(hpTu) : null,
          exScore: hpEx ? parseInt(hpEx) : null,
          result: hpResult,
          notes: hpNotes || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead(prev => prev ? {
          ...prev,
          hardPulls: [data.data, ...prev.hardPulls],
        } : prev);
        setShowHardPullForm(false);
        setHpDate(new Date().toISOString().split('T')[0]);
        setHpAgency(''); setHpLender('');
        setHpEq(''); setHpTu(''); setHpEx('');
        setHpResult('pending'); setHpNotes('');
      }
    } catch (err) {
      console.error('Save hard pull failed:', err);
    } finally {
      setHpSaving(false);
    }
  };

  const submitFirmOffer = async () => {
    setFoSaving(true);
    try {
      const res = await fetch(`/api/prescreen/results/${id}/firm-offer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sent: true,
          date: foDate || new Date().toISOString().split('T')[0],
          method: foMethod || null,
        }),
      });
      if (res.ok) {
        setFoSent(true);
        if (!foDate) setFoDate(new Date().toISOString().split('T')[0]);
        setFoEditing(false);
        setLead(prev => prev ? { ...prev, firmOfferSent: true, firmOfferDate: foDate || new Date().toISOString().split('T')[0], firmOfferMethod: foMethod } : prev);
      }
    } catch (err) {
      console.error('Save firm offer failed:', err);
    } finally {
      setFoSaving(false);
    }
  };

  const removeFirmOffer = async () => {
    if (!confirm('Remove firm offer record?')) return;
    setFoSaving(true);
    try {
      const res = await fetch(`/api/prescreen/results/${id}/firm-offer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sent: false, date: null, method: null }),
      });
      if (res.ok) {
        setFoSent(false);
        setFoDate('');
        setFoMethod('');
        setFoEditing(false);
        setLead(prev => prev ? { ...prev, firmOfferSent: false, firmOfferDate: null, firmOfferMethod: null } : prev);
      }
    } catch (err) {
      console.error('Remove firm offer failed:', err);
    } finally {
      setFoSaving(false);
    }
  };

  const deleteHardPull = async (hpId: number) => {
    if (!confirm('Delete this hard pull record?')) return;
    try {
      const res = await fetch(`/api/prescreen/results/${id}/hard-pulls?hardPullId=${hpId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setLead(prev => prev ? {
          ...prev,
          hardPulls: prev.hardPulls.filter(hp => hp.id !== hpId),
        } : prev);
      }
    } catch (err) {
      console.error('Delete hard pull failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className={`w-5 h-5 border-2 ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-200 border-t-gray-600'} rounded-full animate-spin`} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20">
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Lead not found.</p>
        <Link href="/admin/prescreen/results" className={`text-sm mt-2 inline-block ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
          Back to Results
        </Link>
      </div>
    );
  }

  const tc = getTierConfig(lead.tier, isDark);
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;
  const labelClass = `block text-[11px] font-medium uppercase tracking-wider mb-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`;
  const cardClass = `rounded-lg border ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200 shadow-sm'}`;
  const sectionTitle = `text-[11px] font-medium uppercase tracking-wider mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`;

  const categorizeFields = (rawOutput: Record<string, any> | null) => {
    if (!rawOutput) return {};
    const categories: Record<string, Array<{ key: string; friendlyName: string; formattedValue: string; rawValue: any }>> = {};

    for (const [key, val] of Object.entries(rawOutput)) {
      if (key === 'credit_score') continue;
      const attr = ATTRIBUTE_MAP[key];
      const category = attr?.category || 'Other';
      if (!categories[category]) categories[category] = [];
      categories[category].push({
        key,
        friendlyName: getFriendlyName(key),
        formattedValue: formatAttributeValue(key, val),
        rawValue: val,
      });
    }

    const sorted: typeof categories = {};
    for (const cat of CATEGORY_ORDER) {
      if (categories[cat]) sorted[cat] = categories[cat];
    }
    for (const [cat, items] of Object.entries(categories)) {
      if (!sorted[cat]) sorted[cat] = items;
    }

    return Object.fromEntries(Object.entries(sorted).filter(([, items]) => items.length > 0));
  };

  const hitBureaus = lead.bureauResults.filter(b => b.isHit);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Top Bar */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/prescreen/results"
            className={`p-2 rounded-md transition-colors shrink-0 ${isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lead.firstName} {lead.middleInitial ? `${lead.middleInitial}. ` : ''}{lead.lastName}
              </h1>
              <span className={`px-2.5 py-0.5 text-[11px] font-medium rounded-full ring-1 ${tc.badge} flex items-center gap-1.5`} style={{ ['--tw-ring-color' as any]: 'currentColor', ['--tw-ring-opacity' as any]: '0.1' }}>
                <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                {tc.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                {formatId(lead.id)}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {lead.program?.name}
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>&middot;</span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        {lead.hardPulls.length > 0 && (
          <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full capitalize shrink-0 ${resultBadge(lead.hardPulls[0].result, isDark)}`}>
            Hard Pull: {lead.hardPulls[0].result || 'pending'}
          </span>
        )}
      </div>

      {/* Error Banner */}
      {lead.errorMessage && (
        <div className={`rounded-lg border px-5 py-4 ${isDark ? 'bg-red-900/20 border-red-800/30' : 'bg-red-50/80 border-[#d93c37]/20'}`}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[#d93c37] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-[#d93c37]'}`}>
                {lead.matchStatus === 'api_error' ? 'API Submission Error' : 'Record Failed / Filtered'}
              </p>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {lead.errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal Info + Credit Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info - LEFT */}
        <div className={`${cardClass} p-6`}>
          <h2 className={sectionTitle}>Personal Info</h2>
          <div className="space-y-4">
            <div>
              <p className={labelClass}>Address</p>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {lead.address || '\u2014'}
                {lead.address2 && <><br />{lead.address2}</>}
                {(lead.city || lead.state || lead.zip) && (
                  <><br />{[lead.city, lead.state].filter(Boolean).join(', ')} {lead.zip}</>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={labelClass}>SSN</p>
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {revealedSsn || (lead.ssnLastFour ? `***-**-${lead.ssnLastFour}` : '\u2014')}
                  </p>
                  {lead.hasSsn && !revealedSsn && (
                    <button onClick={() => handleDecrypt('ssn')} disabled={decrypting === 'ssn'}
                      className={`text-xs font-medium disabled:opacity-50 ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
                      {decrypting === 'ssn' ? '...' : 'Show'}
                    </button>
                  )}
                </div>
                {revealedSsn && <span className="text-[10px] text-gray-400">Hides in 10s</span>}
              </div>
              <div>
                <p className={labelClass}>DOB</p>
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {revealedDob || (lead.hasDob ? '**/**/****' : '\u2014')}
                  </p>
                  {lead.hasDob && !revealedDob && (
                    <button onClick={() => handleDecrypt('dob')} disabled={decrypting === 'dob'}
                      className={`text-xs font-medium disabled:opacity-50 ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
                      {decrypting === 'dob' ? '...' : 'Show'}
                    </button>
                  )}
                </div>
                {revealedDob && <span className="text-[10px] text-gray-400">Hides in 10s</span>}
              </div>
            </div>
            {lead.batch && (
              <div>
                <p className={labelClass}>Batch</p>
                <Link href={`/admin/prescreen/results?batchId=${lead.batch.id}`} className={`text-sm ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>
                  {lead.batch.name}
                </Link>
              </div>
            )}
            {lead.segmentName && (
              <div>
                <p className={labelClass}>Segment</p>
                <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{lead.segmentName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Credit Scores - RIGHT */}
        <div className={`${cardClass} p-6 lg:col-span-2`}>
          <h2 className={sectionTitle}>Credit Scores</h2>

          {hitBureaus.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No bureau data returned</p>
              {lead.matchStatus === 'api_error' && (
                <p className="text-xs mt-1">Submission failed before credit data could be retrieved</p>
              )}
            </div>
          ) : (
            <>
              {/* Score Rings */}
              <div className="flex items-center justify-center gap-8 mb-6 pt-2">
                {lead.middleScore != null && hitBureaus.length !== 2 && (
                  <div className="text-center">
                    <ScoreRing score={lead.middleScore} label={hitBureaus.length === 3 ? 'Middle Score' : 'Credit Score'} />
                  </div>
                )}
                {hitBureaus.map((br) => {
                  return (
                    <ScoreRing key={br.bureau} score={br.creditScore} label={getBureauConfig(br.bureau, isDark).name} />
                  );
                })}
              </div>

              {/* Bureau explanation */}
              <div className={`text-center text-[11px] py-2 rounded-md ${isDark ? 'bg-gray-900/50 text-gray-500' : 'bg-gray-50/80 text-gray-400'}`}>
                {hitBureaus.length === 3 && 'Middle score computed from 3 bureau scores'}
                {hitBureaus.length === 2 && 'Two bureau scores available - higher score used for tiering'}
                {hitBureaus.length === 1 && 'Single bureau hit - score used directly for tiering'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bureau Detail Sections */}
      {lead.bureauResults.some((br) => br.rawOutput) && (
        <div className="space-y-3">
          <h2 className={sectionTitle}>Bureau Detail</h2>
          {lead.bureauResults.filter((br) => br.rawOutput).map((br) => {
            const cfg = getBureauConfig(br.bureau, isDark);
            const categories = categorizeFields(br.rawOutput);
            const isExpanded = expandedBureau === br.bureau;
            const categoryEntries = Object.entries(categories);

            return (
              <div key={br.bureau} className={cardClass}>
                {/* Bureau Header - clickable */}
                <button
                  onClick={() => setExpandedBureau(isExpanded ? null : br.bureau)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      {br.bureau.toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{cfg.name}</p>
                      <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {categoryEntries.reduce((sum, [, items]) => sum + items.length, 0)} attributes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {br.creditScore && (
                      <span className={`text-lg font-semibold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>{br.creditScore}</span>
                    )}
                    <svg className={`w-4 h-4 transition-transform ${isDark ? 'text-gray-500' : 'text-gray-400'} ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={`px-6 pb-6 border-t ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-5">
                      {categoryEntries.map(([category, fields]) => (
                        <div key={category}>
                          <h4 className={`text-[11px] font-medium uppercase tracking-wider mb-3 pb-2 border-b ${isDark ? 'text-gray-500 border-gray-700/60' : 'text-gray-400 border-gray-100'}`}>
                            {category}
                          </h4>
                          <div className="space-y-2">
                            {fields.map((field) => (
                              <div key={field.key} className="flex justify-between items-baseline text-sm gap-3">
                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} leading-tight`}>
                                  {field.friendlyName}
                                </span>
                                <span className={`font-medium whitespace-nowrap shrink-0 tabular-nums ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {field.formattedValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Firm Offer + Hard Pull row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firm Offer */}
        <div className={cardClass}>
          <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <h2 className={sectionTitle + ' !mb-0'}>Firm Offer of Credit</h2>
            {!foSent && !foEditing && (
              <button
                onClick={() => {
                  setFoEditing(true);
                  if (!foDate) setFoDate(new Date().toISOString().split('T')[0]);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm"
              >
                + Log Firm Offer
              </button>
            )}
            {foSent && !foEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setFoEditing(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isDark ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Edit
                </button>
                <button
                  onClick={removeFirmOffer}
                  disabled={foSaving}
                  className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="px-6 py-5">
            {foSent && !foEditing ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ring-1 ring-gray-400/10">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Firm Offer Sent</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {foDate ? new Date(foDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      {foMethod ? ` via ${foMethod}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : foEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Date Sent</label>
                    <input type="date" value={foDate} onChange={(e) => setFoDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Method</label>
                    <select value={foMethod} onChange={(e) => setFoMethod(e.target.value)} className={inputClass}>
                      <option value="">Select method...</option>
                      <option value="Mail">Mail</option>
                      <option value="Email">Email</option>
                      <option value="Phone">Phone</option>
                      <option value="Fax">Fax</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={submitFirmOffer}
                    disabled={foSaving || !foDate}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {foSaving ? 'Saving...' : foSent ? 'Update' : 'Submit'}
                  </button>
                  <button
                    onClick={() => setFoEditing(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isDark ? 'bg-gray-700/60 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                No firm offer logged yet.
              </p>
            )}
          </div>
        </div>

        {/* Hard Pull - RIGHT of Firm Offer */}
        <div className={cardClass}>
          <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <h2 className={sectionTitle + ' !mb-0'}>Hard Pull History</h2>
            <button
              onClick={() => setShowHardPullForm(!showHardPullForm)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm"
            >
              {showHardPullForm ? 'Cancel' : '+ Add Hard Pull'}
            </button>
          </div>

        {/* Add Hard Pull Form */}
        {showHardPullForm && (
          <div className={`px-6 py-5 border-b ${isDark ? 'border-gray-700/60 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className={labelClass}>Pull Date *</label>
                <input type="date" value={hpDate} onChange={(e) => setHpDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Agency / Bureau</label>
                <select value={hpAgency} onChange={(e) => setHpAgency(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="Equifax">Equifax</option>
                  <option value="TransUnion">TransUnion</option>
                  <option value="Experian">Experian</option>
                  <option value="Tri-Merge">Tri-Merge</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Lender</label>
                <input type="text" value={hpLender} onChange={(e) => setHpLender(e.target.value)} className={inputClass} placeholder="e.g., Wells Fargo" />
              </div>
              <div>
                <label className={labelClass}>Result</label>
                <select value={hpResult} onChange={(e) => setHpResult(e.target.value)} className={inputClass}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                  <option value="conditional">Conditional</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-3">
              <div>
                <label className={labelClass}>EQ Score</label>
                <input type="number" value={hpEq} onChange={(e) => setHpEq(e.target.value)} className={inputClass} placeholder="---" />
              </div>
              <div>
                <label className={labelClass}>TU Score</label>
                <input type="number" value={hpTu} onChange={(e) => setHpTu(e.target.value)} className={inputClass} placeholder="---" />
              </div>
              <div>
                <label className={labelClass}>EX Score</label>
                <input type="number" value={hpEx} onChange={(e) => setHpEx(e.target.value)} className={inputClass} placeholder="---" />
              </div>
              <div className="col-span-3">
                <label className={labelClass}>Notes</label>
                <input type="text" value={hpNotes} onChange={(e) => setHpNotes(e.target.value)} className={inputClass} placeholder="Additional notes..." />
              </div>
            </div>
            <button
              onClick={saveHardPull}
              disabled={hpSaving || !hpDate}
              className="px-4 py-2 text-sm font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {hpSaving ? 'Saving...' : 'Save Hard Pull'}
            </button>
          </div>
        )}

        {/* Hard Pull List */}
        {lead.hardPulls.length === 0 && !showHardPullForm ? (
          <p className={`px-6 py-8 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            No hard pulls recorded yet.
          </p>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
            {lead.hardPulls.map((hp) => (
              <div key={hp.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {new Date(hp.pullDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium capitalize ${resultBadge(hp.result, isDark)}`}>
                        {hp.result || 'pending'}
                      </span>
                      {hp.agency && (
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{hp.agency}</span>
                      )}
                      {hp.lender && (
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>via {hp.lender}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {hp.eqScore != null && (
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>EQ: <strong className="tabular-nums">{hp.eqScore}</strong></span>
                      )}
                      {hp.tuScore != null && (
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>TU: <strong className="tabular-nums">{hp.tuScore}</strong></span>
                      )}
                      {hp.exScore != null && (
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>EX: <strong className="tabular-nums">{hp.exScore}</strong></span>
                      )}
                      {hp.notes && (
                        <span className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{hp.notes}</span>
                      )}
                    </div>
                    {hp.performedByEmail && (
                      <p className={`text-[11px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>by {hp.performedByEmail}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHardPull(hp.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-gray-100"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Notes */}
      <div className={cardClass}>
        <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
          <h2 className={sectionTitle + ' !mb-0'}>Notes</h2>
          {notesDirty && (
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 shadow-sm"
            >
              {notesSaving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
        <div className="p-6">
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
            onBlur={() => { if (notesDirty) saveNotes(); }}
            className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all resize-y ${
              isDark ? 'bg-gray-900/50 border-gray-700/60 text-white placeholder-gray-600 focus:border-gray-500' : 'bg-gray-50/80 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
            }`}
            rows={3}
            placeholder="Add notes about this lead..."
          />
        </div>
      </div>

      {/* Audit Trail */}
      {lead.auditLog.length > 0 && (
        <div className={cardClass}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
            <h2 className={sectionTitle + ' !mb-0'}>Audit Trail</h2>
          </div>
          <div className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-50'}`}>
            {lead.auditLog.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{entry.performedByEmail}</span>
                  <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10'}`}>
                    {entry.action.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className={`text-[11px] tabular-nums ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
