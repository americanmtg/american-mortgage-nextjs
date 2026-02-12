'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '../../../AdminContext';
import {
  ALTAIR_ATTRIBUTES,
  ATTRIBUTES_BY_CATEGORY,
  CATEGORY_ORDER,
  type AltairAttribute,
} from '@/lib/altair-attributes';

// Recommended output attributes (from Altair build context)
const RECOMMENDED_OUTPUTS = new Set([
  'credit_score', 'income_est', 'dti_ratio',
  'bk_flag', 'bk_flag_c13', 'bk_flag_60mons', 'bk_flag_72mons', 'bk_flag_84mons',
  'fc_flag', 'mons_since_recent_bk', 'mons_since_recent_fc',
  'num_chg_off_trds', 'num_trds_30dpd_ever',
  'num_trds_30_DPD_within_12mons', 'num_trds_60_DPD_within_12mons', 'num_trds_90_DPD_within_12mons',
  'num_mtg_trds_30dpd_12mons', 'num_mtg_trds_60dpd_12mons',
  'mtg_curr_bal', 'mtg_orig_loan_amt', 'mtg_rate', 'mtg_mons_since_open', 'mtg_loan_type',
  'num_open_mtg_trds', 'newest_mtg_pmt', 'ttl_bal_open_mtg_trds', 'ttl_mon_payment_open_mtg_trds',
  'estimatedvalue', 'cltv', 'owner_status', 'gse_limit_eligible',
  'fha_mtg_curr_bal', 'va_mtg_curr_bal', 'conv_cashout_amt', 'va_cashout_amt',
  'reverse_mtg_flag', 'vaflag', 'va_confidence_rank',
  'num_open_heloc_trds', 'num_open_heloan_trds', 'ttl_bal_open_home_equity_trds',
  'mons_since_recent_mtg_inq',
  'num_open_trds', 'num_sat_trds', 'ttl_bal_open_trds',
  'util_open_rev_trds_no_heloc', 'num_inq_within_12mons',
  'age', 'lor',
]);

// Config stored in altair_config JSON field
interface ProgramConfig {
  criteria: Record<string, any>;  // attr_name -> { min?, max? } | boolean | string[]
  outputs: string[];              // attr names to return
}

interface Program {
  id: number;
  altairProgramId: number | null;
  name: string;
  description: string | null;
  minScore: number;
  maxScore: number;
  status: string;
  eqEnabled: boolean;
  exEnabled: boolean;
  tuEnabled: boolean;
  filterCriteria: ProgramConfig | null;
  leadCount: number;
  batchCount: number;
  createdAt: string;
  updatedAt: string;
}

function defaultConfig(): ProgramConfig {
  return {
    criteria: {
      credit_score: { min: 500, max: 900 },
    },
    outputs: Array.from(RECOMMENDED_OUTPUTS),
  };
}

export default function PrescreenPrograms() {
  const { isDark } = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minScore, setMinScore] = useState(500);
  const [maxScore, setMaxScore] = useState(850);
  const [eqEnabled, setEqEnabled] = useState(true);
  const [exEnabled, setExEnabled] = useState(false);
  const [tuEnabled, setTuEnabled] = useState(true);
  const [eqScoreVersion, setEqScoreVersion] = useState('FICO_CLASSIC');
  const [tuScoreVersion, setTuScoreVersion] = useState('FICO_CLASSIC');
  const [exScoreVersion, setExScoreVersion] = useState('FICO_CLASSIC');
  const [criteria, setCriteria] = useState<Record<string, any>>({ credit_score: { min: 500, max: 900 } });
  const [outputs, setOutputs] = useState<Set<string>>(new Set(RECOMMENDED_OUTPUTS));
  const [activeTab, setActiveTab] = useState<'settings' | 'criteria' | 'outputs'>('settings');

  // Collapsible categories
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORY_ORDER));

  useEffect(() => { loadPrograms(); }, []);

  const loadPrograms = async () => {
    try {
      const res = await fetch('/api/prescreen/programs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.data.items || []);
      }
    } catch (err) { console.error('Failed to load programs:', err); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setMinScore(500);
    setMaxScore(850);
    setEqEnabled(true);
    setExEnabled(false);
    setTuEnabled(true);
    setEqScoreVersion('FICO_CLASSIC');
    setTuScoreVersion('FICO_CLASSIC');
    setExScoreVersion('FICO_CLASSIC');
    const dc = defaultConfig();
    setCriteria({ ...dc.criteria });
    setOutputs(new Set(dc.outputs));
    setEditId(null);
    setError('');
    setActiveTab('settings');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (p: Program) => {
    setEditId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setMinScore(p.minScore);
    setMaxScore(p.maxScore);
    setEqEnabled(p.eqEnabled);
    setExEnabled(p.exEnabled);
    setTuEnabled(p.tuEnabled);
    const fc = p.filterCriteria as any;
    setEqScoreVersion(fc?.eqScoreVersion || 'FICO_CLASSIC');
    setTuScoreVersion(fc?.tuScoreVersion || 'FICO_CLASSIC');
    setExScoreVersion(fc?.exScoreVersion || 'FICO_CLASSIC');
    if (fc?.criteria) {
      setCriteria({ ...fc.criteria });
    } else {
      setCriteria({ credit_score: { min: p.minScore, max: p.maxScore } });
    }
    if (fc?.outputs) {
      setOutputs(new Set(fc.outputs));
    } else {
      setOutputs(new Set(RECOMMENDED_OUTPUTS));
    }
    setError('');
    setActiveTab('settings');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Program name is required'); return; }

    setSaving(true);
    try {
      const filterCriteria: ProgramConfig = {
        criteria,
        outputs: Array.from(outputs),
      };
      const body = { name, description, minScore, maxScore, eqEnabled, exEnabled, tuEnabled, eqScoreVersion, tuScoreVersion, exScoreVersion, filterCriteria };
      const url = editId ? `/api/prescreen/programs/${editId}` : '/api/prescreen/programs';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }

      setShowModal(false);
      loadPrograms();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async (p: Program) => {
    try {
      if (p.status === 'active') {
        await fetch(`/api/prescreen/programs/${p.id}`, { method: 'DELETE', credentials: 'include' });
      } else {
        await fetch(`/api/prescreen/programs/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: 'active' }),
        });
      }
      loadPrograms();
    } catch (err) { console.error('Toggle failed:', err); }
  };

  // Criteria helpers
  const toggleCriterion = (attr: AltairAttribute) => {
    setCriteria(prev => {
      const next = { ...prev };
      if (attrName(attr) in next) {
        delete next[attrName(attr)];
      } else {
        if (attr.filterType === 'range') next[attrName(attr)] = { min: attr.min, max: attr.max };
        else if (attr.filterType === 'flag') next[attrName(attr)] = false;
        else if (attr.filterType === 'choices') next[attrName(attr)] = [];
      }
      return next;
    });
  };
  const setCriterionRange = (name: string, field: 'min' | 'max', value: string) => {
    setCriteria(prev => ({
      ...prev,
      [name]: { ...(prev[name] || {}), [field]: value === '' ? undefined : Number(value) },
    }));
  };
  const setCriterionFlag = (name: string, value: boolean) => {
    setCriteria(prev => ({ ...prev, [name]: value }));
  };
  const toggleCriterionChoice = (name: string, choice: string) => {
    setCriteria(prev => {
      const current: string[] = Array.isArray(prev[name]) ? [...prev[name]] : [];
      const idx = current.indexOf(choice);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(choice);
      return { ...prev, [name]: current };
    });
  };
  const attrName = (a: AltairAttribute) => a.name;

  // Output helpers
  const toggleOutput = (name: string) => {
    setOutputs(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const selectAllOutputs = (category: string) => {
    const attrs = ATTRIBUTES_BY_CATEGORY[category]?.filter(a => a.isOutput) || [];
    setOutputs(prev => {
      const next = new Set(prev);
      attrs.forEach(a => next.add(a.name));
      return next;
    });
  };
  const deselectAllOutputs = (category: string) => {
    const attrs = ATTRIBUTES_BY_CATEGORY[category]?.filter(a => a.isOutput) || [];
    setOutputs(prev => {
      const next = new Set(prev);
      attrs.forEach(a => next.delete(a.name));
      return next;
    });
  };
  const loadRecommended = () => { setOutputs(new Set(RECOMMENDED_OUTPUTS)); };

  const toggleCategory = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const criteriaCount = Object.keys(criteria).length;
  const outputCount = outputs.size;

  // Styling
  const inputClass = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;
  const smallInputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all ${
    isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
  }`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  // Filter attributes by context
  const selectableAttrs = ALTAIR_ATTRIBUTES.filter(a => a.isSelection);
  const outputAttrs = ALTAIR_ATTRIBUTES.filter(a => a.isOutput);

  // Group selectable attributes by category
  const selectableByCat: Record<string, AltairAttribute[]> = {};
  for (const a of selectableAttrs) {
    if (!selectableByCat[a.category]) selectableByCat[a.category] = [];
    selectableByCat[a.category].push(a);
  }
  const outputByCat: Record<string, AltairAttribute[]> = {};
  for (const a of outputAttrs) {
    if (!outputByCat[a.category]) outputByCat[a.category] = [];
    outputByCat[a.category].push(a);
  }

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
          <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Prescreen Programs
          </h1>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
        >
          Create Program
        </button>
      </div>

      {/* Table */}
      <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`w-8 h-8 border-4 rounded-full animate-spin ${isDark ? 'border-gray-600 border-t-gray-300' : 'border-gray-200 border-t-gray-600'}`} />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No programs yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'border-b border-gray-700/60' : 'border-b border-gray-100'}>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Name</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Score Range</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Bureaus</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Score Model</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Criteria</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Outputs</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Status</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Leads</th>
                  <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                {programs.map((p) => {
                  const cCount = p.filterCriteria?.criteria ? Object.keys(p.filterCriteria.criteria).length : 0;
                  const oCount = p.filterCriteria?.outputs ? p.filterCriteria.outputs.length : 0;
                  return (
                    <tr key={p.id} className={isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}>
                      <td className={`px-5 py-3.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <p className="text-sm font-medium">{p.name}</p>
                        {p.description && (
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{p.description}</p>
                        )}
                      </td>
                      <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {p.minScore}–{p.maxScore}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1.5">
                          {p.eqEnabled && <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>EQ</span>}
                          {p.tuEnabled && <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>TU</span>}
                          {p.exEnabled && <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>EX</span>}
                        </div>
                      </td>
                      <td className={`px-5 py-3.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(() => {
                          const fc = p.filterCriteria as any;
                          const sv = fc?.eqScoreVersion || 'Not set';
                          return sv === 'FICO_CLASSIC' ? 'FICO Classic' : sv;
                        })()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {cCount > 0 ? `${cCount} active` : 'None'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {oCount} attrs
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                          isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className={`px-5 py-3.5 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {p.leadCount}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(p)} className={`text-xs font-medium ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}>Edit</button>
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`text-xs font-medium ${p.status === 'active' ? 'text-gray-400 hover:text-red-500' : (isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900')}`}
                          >
                            {p.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className={`relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-lg ${isDark ? 'bg-gray-800/80' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700/60' : 'border-gray-200'} flex items-center justify-between shrink-0`}>
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editId ? 'Edit Program' : 'Create Program'}
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Configure prescreen criteria and output attributes
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editId ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={`px-6 border-b ${isDark ? 'border-gray-700/60' : 'border-gray-200'} flex gap-0 shrink-0`}>
              {[
                { key: 'settings' as const, label: 'Settings' },
                { key: 'criteria' as const, label: `Criteria (${criteriaCount})` },
                { key: 'outputs' as const, label: `Outputs (${outputCount})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900'
                      : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg border border-red-300/20 bg-red-50/80 text-sm text-red-600 shrink-0">
                {error}
              </div>
            )}

            {/* Body -- scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-3xl space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Program Name *</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="e.g., Standard Prescreen" />
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <input type="text" value={description} onChange={e => setDescription(e.target.value)} className={inputClass} placeholder="What this program is used for" />
                    </div>
                  </div>

                  <div className={`rounded-lg border p-4 ${isDark ? 'border-gray-700/60 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Credit Score Range</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Minimum</label>
                        <input type="number" value={minScore} onChange={e => setMinScore(parseInt(e.target.value) || 0)} className={smallInputClass} />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Maximum</label>
                        <input type="number" value={maxScore} onChange={e => setMaxScore(parseInt(e.target.value) || 0)} className={smallInputClass} />
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg border p-4 ${isDark ? 'border-gray-700/60 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Credit Bureaus</h3>
                    <div className="flex gap-6">
                      {[
                        { label: 'Equifax', checked: eqEnabled, set: setEqEnabled },
                        { label: 'TransUnion', checked: tuEnabled, set: setTuEnabled },
                        { label: 'Experian', checked: exEnabled, set: setExEnabled, note: 'Not yet credentialed' },
                      ].map(b => (
                        <label key={b.label} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={b.checked} onChange={e => b.set(e.target.checked)} className="rounded border-gray-300" />
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {b.label}
                            {b.note && <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({b.note})</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-lg border p-4 ${isDark ? 'border-gray-700/60 bg-gray-900/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Credit Score Version</h3>
                      <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${isDark ? 'bg-gray-700/60 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                        Per Bureau
                      </span>
                    </div>
                    <p className={`text-xs mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Altair recommends FICO_CLASSIC for mortgage underwriting. This is the version typically used for actual pulls.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Equifax (EQ)', value: eqScoreVersion, set: setEqScoreVersion, enabled: eqEnabled },
                        { label: 'TransUnion (TU)', value: tuScoreVersion, set: setTuScoreVersion, enabled: tuEnabled },
                        { label: 'Experian (EX)', value: exScoreVersion, set: setExScoreVersion, enabled: exEnabled },
                      ].map(sv => (
                        <div key={sv.label}>
                          <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{sv.label}</label>
                          <select
                            value={sv.value}
                            onChange={e => sv.set(e.target.value)}
                            disabled={!sv.enabled}
                            className={`${smallInputClass} ${!sv.enabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <option value="FICO_CLASSIC">FICO Classic (Recommended)</option>
                            <option value="FICO_8">FICO 8</option>
                            <option value="FICO_9">FICO 9</option>
                            <option value="FICO_10">FICO 10</option>
                            <option value="VANTAGE_3">VantageScore 3.0</option>
                            <option value="VANTAGE_4">VantageScore 4.0</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Criteria Tab */}
              {activeTab === 'criteria' && (
                <div className="space-y-4">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Selection criteria control which records Altair filters before returning results. Only matching records count against your credits.
                  </p>
                  {CATEGORY_ORDER.filter(cat => selectableByCat[cat]?.length > 0).map(cat => {
                    const attrs = selectableByCat[cat];
                    const isExpanded = expandedCats.has(cat);
                    const activeInCat = attrs.filter(a => a.name in criteria).length;
                    return (
                      <div key={cat} className={`rounded-lg border overflow-hidden ${isDark ? 'border-gray-700/60' : 'border-gray-200'}`}>
                        <button
                          onClick={() => toggleCategory(cat)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{cat}</span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({attrs.length} attrs)</span>
                          </div>
                          {activeInCat > 0 && (
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              {activeInCat} active
                            </span>
                          )}
                        </button>
                        {isExpanded && (
                          <div className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                            {attrs.map(attr => {
                              const enabled = attr.name in criteria;
                              const val = criteria[attr.name];
                              return (
                                <div key={attr.name} className={`px-4 py-2.5 flex items-center gap-3 ${isDark ? 'bg-gray-800/80' : 'bg-white'}`}>
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={() => toggleCriterion(attr)}
                                    className="rounded border-gray-300 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm ${enabled ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                                        {attr.friendlyName}
                                      </span>
                                      {attr.isExtraCost && (
                                        <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>$</span>
                                      )}
                                    </div>
                                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{attr.name}</span>
                                  </div>
                                  {enabled && attr.filterType === 'range' && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <input
                                        type="number"
                                        value={val?.min ?? ''}
                                        onChange={e => setCriterionRange(attr.name, 'min', e.target.value)}
                                        placeholder="Min"
                                        className={`w-24 px-2 py-1 text-xs rounded-lg border outline-none transition-all ${isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 focus:border-gray-400'}`}
                                      />
                                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>to</span>
                                      <input
                                        type="number"
                                        value={val?.max ?? ''}
                                        onChange={e => setCriterionRange(attr.name, 'max', e.target.value)}
                                        placeholder="Max"
                                        className={`w-24 px-2 py-1 text-xs rounded-lg border outline-none transition-all ${isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 focus:border-gray-400'}`}
                                      />
                                    </div>
                                  )}
                                  {enabled && attr.filterType === 'flag' && (
                                    <div className="shrink-0">
                                      <select
                                        value={val === true ? 'require' : 'exclude'}
                                        onChange={e => setCriterionFlag(attr.name, e.target.value === 'require')}
                                        className={`px-2 py-1 text-xs rounded-lg border outline-none transition-all ${isDark ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500' : 'bg-white border-gray-200 focus:border-gray-400'}`}
                                      >
                                        <option value="exclude">Exclude</option>
                                        <option value="require">Require</option>
                                      </select>
                                    </div>
                                  )}
                                  {enabled && attr.filterType === 'choices' && attr.choices && (
                                    <div className="flex flex-wrap gap-1 shrink-0">
                                      {attr.choices.map(c => (
                                        <button
                                          key={c}
                                          onClick={() => toggleCriterionChoice(attr.name, c)}
                                          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                            (Array.isArray(val) && val.includes(c))
                                              ? isDark ? 'bg-gray-600 text-white border-gray-500' : 'bg-gray-200 text-gray-900 border-gray-300'
                                              : isDark ? 'bg-gray-800/80 text-gray-400 border-gray-700/60' : 'bg-gray-50 text-gray-500 border-gray-200'
                                          }`}
                                        >
                                          {c}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Outputs Tab */}
              {activeTab === 'outputs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Select which attributes Altair returns for matched records. Extra-cost attributes are marked with <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>$</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={loadRecommended}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Load Recommended
                      </button>
                      <button
                        onClick={() => setOutputs(new Set())}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  {CATEGORY_ORDER.filter(cat => outputByCat[cat]?.length > 0).map(cat => {
                    const attrs = outputByCat[cat];
                    const isExpanded = expandedCats.has(cat);
                    const selectedInCat = attrs.filter(a => outputs.has(a.name)).length;
                    return (
                      <div key={cat} className={`rounded-lg border overflow-hidden ${isDark ? 'border-gray-700/60' : 'border-gray-200'}`}>
                        <div className={`flex items-center justify-between px-4 py-3 ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}`}>
                          <button
                            onClick={() => toggleCategory(cat)}
                            className="flex items-center gap-2 text-left"
                          >
                            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{cat}</span>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {selectedInCat}/{attrs.length}
                            </span>
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => selectAllOutputs(cat)}
                              className={`text-xs font-medium ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
                            >
                              All
                            </button>
                            <button
                              onClick={() => deselectAllOutputs(cat)}
                              className={`text-xs font-medium ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                            >
                              None
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className={`grid grid-cols-2 xl:grid-cols-3 gap-0 ${isDark ? 'bg-gray-800/80' : 'bg-white'}`}>
                            {attrs.map(attr => (
                              <label
                                key={attr.name}
                                className={`flex items-center gap-2 px-4 py-2 cursor-pointer border-t transition-colors ${isDark ? 'border-gray-700/60 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50/80'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={outputs.has(attr.name)}
                                  onChange={() => toggleOutput(attr.name)}
                                  className="rounded border-gray-300 shrink-0"
                                />
                                <span className={`text-sm truncate ${outputs.has(attr.name) ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                                  {attr.friendlyName}
                                </span>
                                {attr.isExtraCost && (
                                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium shrink-0 ${isDark ? 'bg-gray-700/60 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>$</span>
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
