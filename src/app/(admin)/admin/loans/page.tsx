'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../AdminContext';

interface MediaImage {
  id?: number;
  url: string;
  filename: string;
}

interface FeaturedLoan {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  image?: MediaImage;
  linkUrl?: string;
  linkText?: string;
  features?: { text: string }[];
  order: number;
  isActive: boolean;
  showDPA?: boolean;
  dpaText?: string;
  learnMoreEnabled?: boolean;
  learnMoreUrl?: string;
  learnMoreText?: string;
}

const iconOptions = [
  { value: 'home', label: 'Home' },
  { value: 'building', label: 'Building' },
  { value: 'refresh', label: 'Refresh' },
  { value: 'shield', label: 'Shield' },
  { value: 'star', label: 'Star' },
  { value: 'dollar', label: 'Dollar' },
  { value: 'chart', label: 'Chart' },
  { value: 'key', label: 'Key' },
];

const IconDisplay = ({ icon, className = "w-6 h-6" }: { icon?: string; className?: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    home: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    building: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    refresh: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    shield: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    star: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    dollar: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    chart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    key: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  };
  return iconMap[icon || 'home'] || iconMap.home;
};

export default function LoansPage() {
  const { isDark } = useTheme();
  const [loans, setLoans] = useState<FeaturedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState<FeaturedLoan | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    icon: 'home',
    image: null as MediaImage | null,
    linkUrl: '',
    linkText: 'Learn More',
    features: [] as string[],
    order: 0,
    isActive: true,
    showDPA: true,
    dpaText: 'Down Payment Assistance Available',
    learnMoreEnabled: false,
    learnMoreUrl: '',
    learnMoreText: 'Learn More',
  });
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [cmsUrl, setCmsUrl] = useState('');

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/featured-loans', { credentials: 'include' });
      const result = await res.json();
      setLoans(result.data?.items || []);
    } catch (err) {
      setError('Failed to fetch featured loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const url = editingLoan
        ? `/api/featured-loans/${editingLoan.id}`
        : '/api/featured-loans';
      const method = editingLoan ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        features: formData.features.map((text) => ({ text })),
        imageId: formData.image?.id || null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      await fetchLoans();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save loan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this featured loan?')) return;

    try {
      await fetch(`/api/featured-loans/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchLoans();
    } catch (err) {
      setError('Failed to delete loan');
    }
  };

  const openAddModal = () => {
    setEditingLoan(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      icon: 'home',
      image: null,
      linkUrl: '',
      linkText: 'Learn More',
      features: [],
      order: loans.length,
      isActive: true,
      showDPA: true,
      dpaText: 'Down Payment Assistance Available',
      learnMoreEnabled: false,
      learnMoreUrl: '',
      learnMoreText: 'Learn More',
    });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (loan: FeaturedLoan) => {
    setEditingLoan(loan);
    setFormData({
      title: loan.title,
      subtitle: loan.subtitle || '',
      description: loan.description || '',
      icon: loan.icon || 'home',
      image: loan.image || null,
      linkUrl: loan.linkUrl || '',
      linkText: loan.linkText || 'Learn More',
      features: loan.features?.map((f) => f.text) || [],
      order: loan.order,
      isActive: loan.isActive,
      showDPA: loan.showDPA ?? true,
      dpaText: loan.dpaText || 'Down Payment Assistance Available',
      learnMoreEnabled: loan.learnMoreEnabled ?? false,
      learnMoreUrl: loan.learnMoreUrl || '',
      learnMoreText: loan.learnMoreText || 'Learn More',
    });
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLoan(null);
    setNewFeature('');
    setError('');
  };

  const addFeature = () => {
    if (newFeature.trim() && formData.features.length < 5) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const features = [...formData.features];
    features.splice(index, 1);
    setFormData({ ...formData, features });
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    setError('');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('alt', file.name);

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        setFormData((prev) => ({
          ...prev,
          image: {
            id: data.id,
            url: data.url,
            filename: data.filename,
          },
        }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError('Failed to upload image. Make sure you are logged in.');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Featured Loans
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage loan type cards displayed on the homepage
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Loan Type
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map((loan) => (
          <div
            key={loan.id}
            className={`rounded-xl border overflow-hidden ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } ${!loan.isActive ? 'opacity-60' : ''}`}
          >
            {loan.image ? (
              <div className="relative">
                <img
                  src={loan.image.url.startsWith('/') ? loan.image.url : `/${loan.image.url}`}
                  alt={loan.title}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                      <IconDisplay icon={loan.icon} className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      loan.isActive ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {loan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{loan.title}</h3>
                  {loan.subtitle && (
                    <p className="text-white/80 text-sm">{loan.subtitle}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-6 ${isDark ? 'bg-gradient-to-br from-blue-900 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <IconDisplay icon={loan.icon} className="w-6 h-6 text-white" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    loan.isActive ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-300'
                  }`}>
                    {loan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-4">{loan.title}</h3>
                {loan.subtitle && (
                  <p className="text-blue-100 text-sm mt-1">{loan.subtitle}</p>
                )}
              </div>
            )}
            <div className="p-4">
              {loan.description && (
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {loan.description}
                </p>
              )}
              {loan.features && loan.features.length > 0 && (
                <ul className={`text-sm space-y-1 mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {loan.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f.text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Order: {loan.order}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(loan)}
                    className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(loan.id)}
                    className={`p-1.5 rounded-lg text-red-500 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loans.length === 0 && (
          <div className={`col-span-full text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <IconDisplay icon="home" className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No featured loans yet</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Loan Type
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className={`relative w-full max-w-lg rounded-xl shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'} my-8`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {editingLoan ? 'Edit Featured Loan' : 'Add Featured Loan'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Conventional Loan"
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Most Popular Choice"
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Card Image
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file);
                    }}
                  />
                  {formData.image ? (
                    <div className={`relative rounded-lg overflow-hidden border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                      <img
                        src={formData.image.url.startsWith('/') ? formData.image.url : `/${formData.image.url}`}
                        alt={formData.image.filename}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 bg-white text-gray-900 text-sm rounded-lg hover:bg-gray-100"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className={`px-3 py-2 text-xs truncate ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                        {formData.image.filename}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className={`w-full px-4 py-6 rounded-lg border-2 border-dashed ${
                        isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                      } transition-colors flex flex-col items-center gap-2`}
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Click to upload an image</span>
                        </>
                      )}
                    </button>
                  )}
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Optional. If no image is set, the card will use a gradient background.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Link URL
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="/loans/conventional"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Primary Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Start Your Conventional Loan"
                  />
                </div>

                {/* DPA Banner Section */}
                <div className={`col-span-2 p-4 rounded-lg border ${isDark ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      DPA Banner Overlay
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.showDPA}
                        onChange={(e) => setFormData({ ...formData, showDPA: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Show
                      </span>
                    </label>
                  </div>

                  {formData.showDPA && (
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Banner Text
                      </label>
                      <input
                        type="text"
                        value={formData.dpaText}
                        onChange={(e) => setFormData({ ...formData, dpaText: e.target.value })}
                        className={`w-full px-3 py-2 text-sm rounded-lg border ${
                          isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 outline-none`}
                        placeholder="Down Payment Assistance Available"
                      />
                    </div>
                  )}
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Shows a banner at the bottom of the loan image with custom text.
                  </p>
                </div>

                {/* Learn More Button Section */}
                <div className={`col-span-2 p-4 rounded-lg border ${isDark ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Learn More Button
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.learnMoreEnabled}
                        onChange={(e) => setFormData({ ...formData, learnMoreEnabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Enable
                      </span>
                    </label>
                  </div>

                  {formData.learnMoreEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={formData.learnMoreText}
                          onChange={(e) => setFormData({ ...formData, learnMoreText: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 outline-none`}
                          placeholder="Learn More"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          URL (Article Link)
                        </label>
                        <input
                          type="text"
                          value={formData.learnMoreUrl}
                          onChange={(e) => setFormData({ ...formData, learnMoreUrl: e.target.value })}
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                          } focus:ring-2 focus:ring-blue-500 outline-none`}
                          placeholder="/blog/conventional-loans-guide"
                        />
                      </div>
                    </div>
                  )}
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Shows a secondary "Learn More" button that links to an article about this loan type.
                  </p>
                </div>

                <div className="col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Key Features (max 5)
                  </label>
                  <div className="space-y-2">
                    {formData.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`flex-1 px-3 py-1.5 text-sm rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {feature}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFeature(i)}
                          className="text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {formData.features.length < 5 && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                          className={`flex-1 px-3 py-1.5 text-sm rounded border ${
                            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                          placeholder="Add feature..."
                        />
                        <button
                          type="button"
                          onClick={addFeature}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Active (show on homepage)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className={`px-4 py-2.5 rounded-lg font-medium ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingLoan ? 'Save Changes' : 'Add Loan Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
