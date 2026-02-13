'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '../../../AdminContext';

interface Program {
  id: number;
  name: string;
  altairProgramId: number | null;
  status: string;
}

interface BatchRecord {
  firstName: string;
  lastName: string;
  middleInitial: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  ssn: string;
  dob: string;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const CSV_TEMPLATE = 'first_name,last_name,middle_initial,address,city,state,zip,ssn,dob\nJohn,Doe,,123 Main St,Little Rock,AR,72201,123456789,1990-06-15\nJane,Smith,A,456 Oak Ave,Conway,AR,72032,,1985-03-22';

export default function PrescreenSubmit() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<'single' | 'csv'>('single');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [batchName, setBatchName] = useState('');

  // Batch queue
  const [batchRecords, setBatchRecords] = useState<BatchRecord[]>([]);

  // Retry queue
  const [retryLeads, setRetryLeads] = useState<any[]>([]);
  const [loadingRetry, setLoadingRetry] = useState(false);

  // Single entry fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [ssn, setSsn] = useState('');
  const [dob, setDob] = useState('');

  // CSV fields
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    fetch('/api/prescreen/programs?status=active', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.items) setPrograms(data.data.items);
      })
      .catch(console.error);
    loadRetryQueue();
  }, []);

  const loadRetryQueue = () => {
    fetch('/api/prescreen/retry-queue', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setRetryLeads(data.data?.leads || []))
      .catch(console.error);
  };

  const loadRetryIntoBatch = async () => {
    if (retryLeads.length === 0) return;
    setLoadingRetry(true);
    try {
      // Decrypt SSN/DOB for each lead via the decrypt API
      const records: BatchRecord[] = [];
      for (const lead of retryLeads) {
        let ssn = '';
        let dob = '';
        if (lead.hasSsn) {
          try {
            const res = await fetch(`/api/prescreen/results/${lead.id}/decrypt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ field: 'ssn' }),
            });
            if (res.ok) { const d = await res.json(); ssn = d.data?.value || ''; }
          } catch { /* skip */ }
        }
        if (lead.hasDob) {
          try {
            const res = await fetch(`/api/prescreen/results/${lead.id}/decrypt`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ field: 'dob' }),
            });
            if (res.ok) { const d = await res.json(); dob = d.data?.value || ''; }
          } catch { /* skip */ }
        }
        records.push({
          firstName: lead.firstName,
          lastName: lead.lastName,
          middleInitial: lead.middleInitial || '',
          address: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          zip: lead.zip || '',
          ssn: ssn.replace(/\D/g, ''),
          dob,
        });
      }
      setBatchRecords(prev => [...prev, ...records]);

      // Clear retry queue flags
      const ids = retryLeads.map((l: any) => l.id);
      await fetch('/api/prescreen/retry-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ leadIds: ids, queued: false }),
      });
      setRetryLeads([]);
    } catch (err) {
      console.error('Failed to load retry queue:', err);
    } finally {
      setLoadingRetry(false);
    }
  };

  const inputClass = `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
    isDark
      ? 'bg-gray-800/80 border-gray-700/60 text-white focus:border-gray-500 placeholder-gray-500'
      : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 placeholder-gray-400'
  }`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  // SSN mask
  const handleSsnChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) setSsn(digits);
    else if (digits.length <= 5) setSsn(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    else setSsn(`${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`);
  };

  // DOB mask
  const handleDobChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) setDob(digits);
    else if (digits.length <= 4) setDob(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    else setDob(`${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`);
  };

  const dobToISO = (val: string): string => {
    if (!val) return '';
    const digits = val.replace(/\D/g, '');
    if (digits.length === 8) {
      const mm = digits.slice(0, 2);
      const dd = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      return `${yyyy}-${mm}-${dd}`;
    }
    return val;
  };

  const addToBatch = () => {
    setError('');
    if (!firstName || !lastName) { setError('First and last name are required'); return; }
    if (!address || !city || !state || !zip) { setError('Full address is required'); return; }

    setBatchRecords(prev => [...prev, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleInitial: middleInitial.trim(),
      address: address.trim(),
      city: city.trim(),
      state,
      zip: zip.trim(),
      ssn: ssn.replace(/\D/g, ''),
      dob: dobToISO(dob),
    }]);

    setFirstName(''); setLastName(''); setMiddleInitial('');
    setAddress(''); setCity(''); setState(''); setZip('');
    setSsn(''); setDob('');
  };

  const removeFromBatch = (index: number) => {
    setBatchRecords(prev => prev.filter((_, i) => i !== index));
  };

  const clearBatch = () => { setBatchRecords([]); };

  const parseCSV = () => {
    setError('');
    const lines = csvText.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { setError('CSV must have a header row and at least one data row'); return; }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['first_name', 'last_name', 'address', 'city', 'state', 'zip'];
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) { setError(`Missing required CSV columns: ${missing.join(', ')}`); return; }

    const newRecords: BatchRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const record: any = {};
      headers.forEach((h, idx) => { record[h] = values[idx] || ''; });
      newRecords.push({
        firstName: record.first_name || '',
        lastName: record.last_name || '',
        middleInitial: record.middle_initial || '',
        address: record.address || '',
        city: record.city || '',
        state: record.state || '',
        zip: record.zip || '',
        ssn: (record.ssn || '').replace(/\D/g, ''),
        dob: record.dob || '',
      });
    }

    setBatchRecords(prev => [...prev, ...newRecords]);
    setCsvText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { setCsvText(event.target?.result as string); };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prescreen_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitBatch = async () => {
    setError('');
    if (!selectedProgram) { setError('Please select a program'); return; }
    if (batchRecords.length === 0) { setError('Add at least one record to the batch'); return; }
    if (batchRecords.length < 2) {
      setError('Equifax requires at least 2 records per submission. Add another record or use batch upload.');
      return;
    }

    setSubmitting(true);
    try {
      const records = batchRecords.map(r => ({
        firstName: r.firstName,
        lastName: r.lastName,
        middleInitial: r.middleInitial || undefined,
        address: r.address,
        city: r.city,
        state: r.state,
        zip: r.zip,
        ssn: r.ssn || undefined,
        dob: r.dob || undefined,
      }));

      const res = await fetch('/api/prescreen/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          programId: parseInt(selectedProgram),
          records,
          batchName: batchName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed'); return; }
      router.push(`/admin/prescreen/results?batchId=${data.data.batchId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
            Submit Prescreen
          </h1>
        </div>
        {batchRecords.length >= 2 && (
          <button
            onClick={submitBatch}
            disabled={submitting || !selectedProgram}
            className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              `Run Pre-Screen (${batchRecords.length})`
            )}
          </button>
        )}
      </div>

      {/* Program + Batch Name -- inline */}
      <div className={`rounded-lg border p-5 mb-4 ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass}>Program *</label>
            <select value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)} className={inputClass}>
              <option value="">Select program...</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {!p.altairProgramId ? '(Local Only)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Batch Name</label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className={inputClass}
              placeholder="e.g., Zillow Leads Feb 2026"
            />
          </div>
        </div>
      </div>

      {/* Retry Queue Banner */}
      {retryLeads.length > 0 && (
        <div className={`mb-4 rounded-lg border px-5 py-4 flex items-center justify-between ${
          isDark ? 'bg-amber-900/10 border-amber-800/30' : 'bg-amber-50/80 border-amber-200/60'
        }`}>
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
              {retryLeads.length} lead{retryLeads.length !== 1 ? 's' : ''} queued for retry
            </p>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-amber-500/70' : 'text-amber-600/70'}`}>
              {retryLeads.map(l => `${l.firstName} ${l.lastName}`).join(', ')}
            </p>
          </div>
          <button
            onClick={loadRetryIntoBatch}
            disabled={loadingRetry}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isDark
                ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {loadingRetry ? 'Loading...' : 'Load into Batch'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-300/20 bg-red-50/80 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Input Methods + Queue -- side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input Form */}
        <div className={`rounded-lg border ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          {/* Tabs */}
          <div className={`flex border-b ${isDark ? 'border-gray-700/60' : 'border-gray-200'}`}>
            <button
              onClick={() => setTab('single')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'single'
                  ? isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900'
                  : `border-transparent ${isDark ? 'text-gray-400' : 'text-gray-500'}`
              }`}
            >
              Single Entry
            </button>
            <button
              onClick={() => setTab('csv')}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'csv'
                  ? isDark ? 'border-white text-white' : 'border-gray-900 text-gray-900'
                  : `border-transparent ${isDark ? 'text-gray-400' : 'text-gray-500'}`
              }`}
            >
              CSV Upload
            </button>
          </div>

          <div className="p-5">
            {/* Single Entry Form */}
            {tab === 'single' && (
              <div className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>First Name *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="John" />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Last Name *</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Doe" />
                  </div>
                  <div>
                    <label className={labelClass}>MI</label>
                    <input type="text" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.slice(0, 1))} className={inputClass} maxLength={1} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelClass}>Street Address *</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="123 Main Street" />
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>City *</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Little Rock" />
                  </div>
                  <div>
                    <label className={labelClass}>State *</label>
                    <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                      <option value="">--</option>
                      {US_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>ZIP Code *</label>
                    <input type="text" value={zip} onChange={(e) => setZip(e.target.value.slice(0, 10))} className={inputClass} placeholder="72201" />
                  </div>
                </div>

                {/* SSN + DOB */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>SSN</label>
                    <input type="text" value={ssn} onChange={(e) => handleSsnChange(e.target.value)} className={inputClass} placeholder="XXX-XX-XXXX" />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input type="text" value={dob} onChange={(e) => handleDobChange(e.target.value)} className={inputClass} placeholder="MM/DD/YYYY" />
                  </div>
                </div>

                <button
                  onClick={addToBatch}
                  className="w-full mt-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-gray-900 text-white hover:bg-gray-800"
                >
                  + Add to Batch
                </button>
              </div>
            )}

            {/* CSV Upload */}
            {tab === 'csv' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className={labelClass}>Upload or paste CSV</label>
                  <button
                    onClick={downloadTemplate}
                    className={`flex items-center gap-1.5 text-sm font-medium ${isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </button>
                </div>

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className={`block w-full text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200`}
                />

                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className={`${inputClass} font-mono !text-xs`}
                  rows={8}
                  placeholder="first_name,last_name,address,city,state,zip,ssn,dob"
                />

                <button
                  onClick={parseCSV}
                  disabled={!csvText.trim()}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  Parse & Add to Batch
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Batch Queue */}
        <div className={`rounded-lg border ${isDark ? 'bg-gray-800/80 border-gray-700/60' : 'bg-white border-gray-200'}`}>
          <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700/60' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Batch Queue
              </h2>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${
                isDark
                  ? 'bg-gray-700/60 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {batchRecords.length}
              </span>
            </div>
            {batchRecords.length > 0 && (
              <button onClick={clearBatch} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">
                Clear
              </button>
            )}
          </div>

          {batchRecords.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <svg className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Add records using the form or CSV upload
              </p>
            </div>
          ) : (
            <>
              {batchRecords.length === 1 && (
                <div className={`mx-4 mt-3 px-3 py-2 rounded-lg border text-sm ${
                  isDark
                    ? 'border-gray-600 bg-gray-700/40 text-gray-300'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}>
                  Minimum 2 records required for Equifax
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                      <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>#</th>
                      <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Name</th>
                      <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Location</th>
                      <th className={`px-5 py-3.5 text-left text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>SSN</th>
                      <th className="px-5 py-3.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-gray-700/60' : 'divide-gray-100'}`}>
                    {batchRecords.map((r, i) => (
                      <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-gray-700/20' : 'hover:bg-gray-50/80'}`}>
                        <td className={`px-5 py-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{i + 1}</td>
                        <td className={`px-5 py-3.5 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {r.firstName} {r.lastName}
                        </td>
                        <td className={`px-5 py-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {r.city}, {r.state} {r.zip}
                        </td>
                        <td className={`px-5 py-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {r.ssn ? `***${r.ssn.slice(-4)}` : '\u2014'}
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => removeFromBatch(i)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Submit at bottom of queue */}
              <div className="p-4">
                <button
                  onClick={submitBatch}
                  disabled={submitting || batchRecords.length < 2 || !selectedProgram}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting {batchRecords.length} records...
                    </span>
                  ) : (
                    `Run Pre-Screen (${batchRecords.length} records)`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
