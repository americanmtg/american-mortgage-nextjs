'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../AdminContext';

interface LoanOfficer {
  id: number;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PreapprovalLetter {
  id: number;
  borrowerName: string;
  letterDate: string;
  referenceId: string;
  status: 'authentic' | 'invalid' | 'expired';
  loanOfficerId: number | null;
  loanOfficer: LoanOfficer | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VerifyPageSettings {
  pageTitle: string;
  pageSubtitle: string;
  successTitle: string;
  successMessage: string;
  failTitle: string;
  failMessage: string;
  defaultContactName: string;
  defaultContactPhone: string;
  defaultContactEmail: string;
}

type TabType = 'letters' | 'officers' | 'settings';

export default function PreapprovalLettersPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('letters');

  // Settings state
  const [settings, setSettings] = useState<VerifyPageSettings>({
    pageTitle: 'Pre-Approval Letter Verification',
    pageSubtitle: 'Enter the reference ID from your pre-approval letter to verify its authenticity.',
    successTitle: 'Verified - Authentic Letter',
    successMessage: 'This pre-approval letter is authentic.',
    failTitle: 'Verification Failed',
    failMessage: 'We could not verify this reference ID. The letter may be invalid, expired, or entered incorrectly.',
    defaultContactName: 'American Mortgage',
    defaultContactPhone: '(XXX) XXX-XXXX',
    defaultContactEmail: 'verify@americanmtg.com',
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Letters state
  const [letters, setLetters] = useState<PreapprovalLetter[]>([]);
  const [lettersLoading, setLettersLoading] = useState(true);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [editingLetter, setEditingLetter] = useState<PreapprovalLetter | null>(null);
  const [letterFormData, setLetterFormData] = useState({
    borrowerName: '',
    letterDate: '',
    referenceId: '',
    status: 'authentic' as 'authentic' | 'invalid' | 'expired',
    loanOfficerId: '' as string,
    notes: '',
  });
  const [letterSaving, setLetterSaving] = useState(false);
  const [deleteLetterConfirm, setDeleteLetterConfirm] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Officers state
  const [officers, setOfficers] = useState<LoanOfficer[]>([]);
  const [officersLoading, setOfficersLoading] = useState(true);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<LoanOfficer | null>(null);
  const [officerFormData, setOfficerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    isActive: true,
  });
  const [officerSaving, setOfficerSaving] = useState(false);
  const [deleteOfficerConfirm, setDeleteOfficerConfirm] = useState<number | null>(null);

  const [error, setError] = useState('');

  // Fetch functions
  const fetchLetters = async () => {
    try {
      const url = filterStatus
        ? `/api/preapproval-letters?status=${filterStatus}`
        : '/api/preapproval-letters';
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        setLetters(json.data.items);
      } else {
        setError(json.error || 'Failed to fetch letters');
      }
    } catch (err) {
      setError('Failed to fetch letters');
    } finally {
      setLettersLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await fetch('/api/loan-officers');
      const json = await res.json();
      if (res.ok && json.data) {
        setOfficers(json.data.items);
      } else {
        setError(json.error || 'Failed to fetch loan officers');
      }
    } catch (err) {
      setError('Failed to fetch loan officers');
    } finally {
      setOfficersLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/verify-page');
      const json = await res.json();
      if (res.ok && json.data) {
        setSettings(json.data);
      }
    } catch (err) {
      // Use defaults if fetch fails
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    setSettingsSaving(true);
    setError('');
    setSettingsSaved(false);

    try {
      const res = await fetch('/api/settings/verify-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to save settings');
        return;
      }

      setSettings(json.data);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  useEffect(() => {
    fetchLetters();
    fetchOfficers();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'letters') {
      fetchLetters();
    }
  }, [filterStatus]);

  // Letter handlers
  const handleLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLetterSaving(true);
    setError('');

    try {
      const url = editingLetter
        ? `/api/preapproval-letters/${editingLetter.id}`
        : '/api/preapproval-letters';
      const method = editingLetter ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerName: letterFormData.borrowerName,
          letterDate: letterFormData.letterDate,
          referenceId: letterFormData.referenceId,
          status: letterFormData.status,
          loanOfficerId: letterFormData.loanOfficerId ? parseInt(letterFormData.loanOfficerId) : null,
          notes: letterFormData.notes || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to save letter');
        return;
      }

      await fetchLetters();
      closeLetterModal();
    } catch (err) {
      setError('Failed to save letter');
    } finally {
      setLetterSaving(false);
    }
  };

  const handleDeleteLetter = async (id: number) => {
    try {
      const res = await fetch(`/api/preapproval-letters/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete letter');
        return;
      }

      await fetchLetters();
      setDeleteLetterConfirm(null);
    } catch (err) {
      setError('Failed to delete letter');
    }
  };

  const openAddLetterModal = () => {
    setEditingLetter(null);
    setLetterFormData({
      borrowerName: '',
      letterDate: new Date().toISOString().split('T')[0],
      referenceId: '',
      status: 'authentic',
      loanOfficerId: officers.length > 0 ? officers[0].id.toString() : '',
      notes: '',
    });
    setShowLetterModal(true);
    setError('');
  };

  const openEditLetterModal = (letter: PreapprovalLetter) => {
    setEditingLetter(letter);
    setLetterFormData({
      borrowerName: letter.borrowerName,
      letterDate: new Date(letter.letterDate).toISOString().split('T')[0],
      referenceId: letter.referenceId,
      status: letter.status,
      loanOfficerId: letter.loanOfficerId?.toString() || '',
      notes: letter.notes || '',
    });
    setShowLetterModal(true);
    setError('');
  };

  const closeLetterModal = () => {
    setShowLetterModal(false);
    setEditingLetter(null);
    setLetterFormData({
      borrowerName: '',
      letterDate: '',
      referenceId: '',
      status: 'authentic',
      loanOfficerId: '',
      notes: '',
    });
    setError('');
  };

  // Officer handlers
  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerSaving(true);
    setError('');

    try {
      const url = editingOfficer
        ? `/api/loan-officers/${editingOfficer.id}`
        : '/api/loan-officers';
      const method = editingOfficer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: officerFormData.name,
          phone: officerFormData.phone,
          email: officerFormData.email,
          isActive: officerFormData.isActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to save loan officer');
        return;
      }

      await fetchOfficers();
      closeOfficerModal();
    } catch (err) {
      setError('Failed to save loan officer');
    } finally {
      setOfficerSaving(false);
    }
  };

  const handleDeleteOfficer = async (id: number) => {
    try {
      const res = await fetch(`/api/loan-officers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete loan officer');
        return;
      }

      await fetchOfficers();
      setDeleteOfficerConfirm(null);
    } catch (err) {
      setError('Failed to delete loan officer');
    }
  };

  const openAddOfficerModal = () => {
    setEditingOfficer(null);
    setOfficerFormData({
      name: '',
      phone: '',
      email: '',
      isActive: true,
    });
    setShowOfficerModal(true);
    setError('');
  };

  const openEditOfficerModal = (officer: LoanOfficer) => {
    setEditingOfficer(officer);
    setOfficerFormData({
      name: officer.name,
      phone: officer.phone,
      email: officer.email,
      isActive: officer.isActive,
    });
    setShowOfficerModal(true);
    setError('');
  };

  const closeOfficerModal = () => {
    setShowOfficerModal(false);
    setEditingOfficer(null);
    setOfficerFormData({
      name: '',
      phone: '',
      email: '',
      isActive: true,
    });
    setError('');
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'bg-green-100 text-green-700';
      case 'invalid':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loading = activeTab === 'letters' ? lettersLoading : activeTab === 'officers' ? officersLoading : settingsLoading;

  if (loading && letters.length === 0 && officers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pre-Approval Letters
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage pre-approval letters and loan officers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className={`flex gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('letters')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'letters'
                ? 'bg-white text-blue-600 shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Letters
          </button>
          <button
            onClick={() => setActiveTab('officers')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'officers'
                ? 'bg-white text-blue-600 shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Loan Officers
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-blue-600 shadow-sm'
                : isDark
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Page Settings
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Letters Tab */}
      {activeTab === 'letters' && (
        <>
          {/* Filter and Add Button */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Filter by Status:
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
              >
                <option value="">All</option>
                <option value="authentic">Authentic</option>
                <option value="invalid">Invalid</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <button
              onClick={openAddLetterModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Letter
            </button>
          </div>

          {/* Letters Table */}
          <div className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
            {letters.length === 0 ? (
              <div className={`p-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No pre-approval letters found</p>
                <button
                  onClick={openAddLetterModal}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first letter
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Borrower
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Reference ID
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Letter Date
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Loan Officer
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-4 text-right text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {letters.map((letter) => (
                    <tr key={letter.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {letter.borrowerName}
                        </p>
                      </td>
                      <td className={`px-6 py-4 font-mono text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {letter.referenceId}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(letter.letterDate)}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {letter.loanOfficer?.name || <span className="text-gray-400 italic">Not assigned</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full capitalize ${getStatusBadge(letter.status)}`}>
                          {letter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditLetterModal(letter)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Edit letter"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {deleteLetterConfirm === letter.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteLetter(letter.id)}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteLetterConfirm(null)}
                                className={`px-3 py-1.5 text-sm rounded-lg ${
                                  isDark
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteLetterConfirm(letter.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                                  : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Delete letter"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Public Verification Link Info */}
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
              <strong>Public Verification Page:</strong>{' '}
              <a href="/verify" target="_blank" className="underline hover:no-underline">
                /verify
              </a>
              {' '}- Share this link with third parties who need to verify pre-approval letters.
            </p>
          </div>
        </>
      )}

      {/* Officers Tab */}
      {activeTab === 'officers' && (
        <>
          {/* Add Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={openAddOfficerModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Loan Officer
            </button>
          </div>

          {/* Officers Table */}
          <div className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} overflow-hidden`}>
            {officers.length === 0 ? (
              <div className={`p-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p>No loan officers found</p>
                <button
                  onClick={openAddOfficerModal}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first loan officer
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className={isDark ? 'bg-gray-900' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Name
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Phone
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Email
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Status
                    </th>
                    <th className={`px-6 py-4 text-right text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {officers.map((officer) => (
                    <tr key={officer.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {officer.name}
                        </p>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {officer.phone}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {officer.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full ${
                          officer.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {officer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditOfficerModal(officer)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Edit officer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {deleteOfficerConfirm === officer.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteOfficer(officer.id)}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteOfficerConfirm(null)}
                                className={`px-3 py-1.5 text-sm rounded-lg ${
                                  isDark
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteOfficerConfirm(officer.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark
                                  ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                                  : 'text-red-500 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Delete officer"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Info */}
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
              <strong>Note:</strong> Loan officers added here will be available to select when creating pre-approval letters.
              Their contact information will be displayed on the public verification page.
            </p>
          </div>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className={`rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
          <div className="space-y-8">
            {/* Page Header Settings */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Page Header
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={settings.pageTitle}
                    onChange={(e) => setSettings({ ...settings, pageTitle: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Page Subtitle
                  </label>
                  <textarea
                    value={settings.pageSubtitle}
                    onChange={(e) => setSettings({ ...settings, pageSubtitle: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Success Message Settings */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Success Message (Verified Letters)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Success Title
                  </label>
                  <input
                    type="text"
                    value={settings.successTitle}
                    onChange={(e) => setSettings({ ...settings, successTitle: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Success Message
                  </label>
                  <textarea
                    value={settings.successMessage}
                    onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none`}
                  />
                  <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{Borrower Name}'}</code> and <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{Letter Date}'}</code> as placeholders.
                  </p>
                </div>
              </div>
            </div>

            {/* Fail Message Settings */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Failure Message (Invalid/Expired/Not Found)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Failure Title
                  </label>
                  <input
                    type="text"
                    value={settings.failTitle}
                    onChange={(e) => setSettings({ ...settings, failTitle: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Failure Message
                  </label>
                  <textarea
                    value={settings.failMessage}
                    onChange={(e) => setSettings({ ...settings, failMessage: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Default Contact Settings */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Default Contact Information
              </h3>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                This contact info is shown when no loan officer is assigned to a letter.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={settings.defaultContactName}
                    onChange={(e) => setSettings({ ...settings, defaultContactName: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone
                  </label>
                  <input
                    type="text"
                    value={settings.defaultContactPhone}
                    onChange={(e) => setSettings({ ...settings, defaultContactPhone: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.defaultContactEmail}
                    onChange={(e) => setSettings({ ...settings, defaultContactEmail: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                {settingsSaved && (
                  <span className="text-green-600 text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Settings saved successfully
                  </span>
                )}
              </div>
              <button
                onClick={handleSettingsSave}
                disabled={settingsSaving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {settingsSaving && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                Save Settings
              </button>
            </div>
          </div>

          {/* Preview Link */}
          <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-blue-50'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
              <strong>Preview:</strong>{' '}
              <a href="/verify" target="_blank" className="underline hover:no-underline">
                Open verification page in new tab
              </a>
              {' '}- See how these settings appear to visitors.
            </p>
          </div>
        </div>
      )}

      {/* Letter Modal */}
      {showLetterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeLetterModal} />
          <div className={`relative w-full max-w-lg rounded-xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingLetter ? 'Edit Pre-Approval Letter' : 'Add New Pre-Approval Letter'}
              </h2>
            </div>

            <form onSubmit={handleLetterSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Borrower Name *
                </label>
                <input
                  type="text"
                  value={letterFormData.borrowerName}
                  onChange={(e) => setLetterFormData({ ...letterFormData, borrowerName: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Letter Date *
                </label>
                <input
                  type="date"
                  value={letterFormData.letterDate}
                  onChange={(e) => setLetterFormData({ ...letterFormData, letterDate: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reference ID *
                </label>
                <input
                  type="text"
                  value={letterFormData.referenceId}
                  onChange={(e) => setLetterFormData({ ...letterFormData, referenceId: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border font-mono ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  placeholder="PA-2024-001234"
                />
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Unique identifier that will be used for verification
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Loan Officer
                </label>
                <select
                  value={letterFormData.loanOfficerId}
                  onChange={(e) => setLetterFormData({ ...letterFormData, loanOfficerId: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                >
                  <option value="">-- Select Loan Officer --</option>
                  {officers.filter(o => o.isActive).map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name}
                    </option>
                  ))}
                </select>
                <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Their contact info will be shown on the verification page
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  value={letterFormData.status}
                  onChange={(e) => setLetterFormData({ ...letterFormData, status: e.target.value as 'authentic' | 'invalid' | 'expired' })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                >
                  <option value="authentic">Authentic - Valid and verifiable</option>
                  <option value="expired">Expired - No longer valid</option>
                  <option value="invalid">Invalid - Not authentic</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={letterFormData.notes}
                  onChange={(e) => setLetterFormData({ ...letterFormData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none`}
                  placeholder="Internal notes about this letter..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeLetterModal}
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={letterSaving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {letterSaving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {editingLetter ? 'Save Changes' : 'Add Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Officer Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closeOfficerModal} />
          <div className={`relative w-full max-w-lg rounded-xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingOfficer ? 'Edit Loan Officer' : 'Add New Loan Officer'}
              </h2>
            </div>

            <form onSubmit={handleOfficerSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={officerFormData.name}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, name: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  placeholder="Preston Million"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone *
                </label>
                <input
                  type="tel"
                  value={officerFormData.phone}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, phone: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={officerFormData.email}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, email: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  placeholder="preston@example.com"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={officerFormData.isActive}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Active (available for selection on new letters)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeOfficerModal}
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={officerSaving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {officerSaving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {editingOfficer ? 'Save Changes' : 'Add Loan Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
