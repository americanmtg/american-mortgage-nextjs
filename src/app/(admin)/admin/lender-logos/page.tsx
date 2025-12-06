'use client';

import { useEffect, useState, useRef } from 'react';

interface LenderLogo {
  id: number;
  name: string;
  logoUrl: string | null;
  mediaId: number | null;
  width: number;
  height: number;
  displayOrder: number;
  isActive: boolean;
}

export default function LenderLogosPage() {
  const [logos, setLogos] = useState<LenderLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('Trusted Lender Partners');
  const [savingTitle, setSavingTitle] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    mediaId: null as number | null,
    width: 120,
    height: 40,
    displayOrder: 0,
    isActive: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLogos();
  }, []);

  async function fetchLogos() {
    try {
      const res = await fetch('/api/lender-logos', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data?.items) {
          setLogos(result.data.items);
        }
        if (result.data?.settings?.sectionTitle) {
          setSectionTitle(result.data.settings.sectionTitle);
        }
      }
    } catch (err) {
      console.error('Failed to fetch logos:', err);
      setError('Failed to load lender logos');
    } finally {
      setLoading(false);
    }
  }

  async function saveSectionTitle() {
    setSavingTitle(true);
    try {
      const res = await fetch('/api/lender-logos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sectionTitle }),
      });

      if (res.ok) {
        setSuccess('Section title updated!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update section title');
      }
    } catch (err) {
      console.error('Save title error:', err);
      setError('Failed to update section title');
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setFormData(prev => ({
            ...prev,
            logoUrl: result.data.url,
            mediaId: result.data.id,
          }));
        }
      } else {
        setError('Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  async function saveLogo() {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch('/api/lender-logos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(editingId ? 'Logo updated!' : 'Logo added!');
        resetForm();
        fetchLogos();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save logo');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save logo');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLogo(id: number) {
    if (!confirm('Are you sure you want to delete this lender logo?')) return;

    try {
      const res = await fetch(`/api/lender-logos?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess('Logo deleted!');
        fetchLogos();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete logo');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete logo');
    }
  }

  function startEdit(logo: LenderLogo) {
    setEditingId(logo.id);
    setFormData({
      name: logo.name,
      logoUrl: logo.logoUrl || '',
      mediaId: logo.mediaId,
      width: logo.width || 120,
      height: logo.height || 40,
      displayOrder: logo.displayOrder || 0,
      isActive: logo.isActive ?? true,
    });
    setShowAddForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      logoUrl: '',
      mediaId: null,
      width: 120,
      height: 40,
      displayOrder: 0,
      isActive: true,
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lender Logos</h1>
          <p className="text-gray-500 text-sm mt-1">Manage lender partner logos displayed on the homepage</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Logo
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Section Title Setting */}
      <div className="mb-6 p-4 bg-white border rounded-xl shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title (displayed above logos on homepage)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Trusted Lender Partners"
          />
          <button
            onClick={saveSectionTitle}
            disabled={savingTitle}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {savingTitle ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-white border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Logo' : 'Add New Logo'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lender Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., UWM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 120 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 40 }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Image
              </label>
              <div className="flex items-center gap-4">
                {formData.logoUrl && (
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      style={{ width: `${formData.width}px`, height: `${formData.height}px`, objectFit: 'contain' }}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : formData.logoUrl ? 'Change Image' : 'Upload Image'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: PNG with transparent background
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Or use URL directly
              </label>
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value, mediaId: null }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active (visible on homepage)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={saveLogo}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Logo' : 'Add Logo'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Logos List */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {logos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No lender logos added yet. Click "Add Logo" to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logos.map((logo) => (
                <tr key={logo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {logo.logoUrl ? (
                      <div className="p-2 bg-gray-100 rounded inline-block">
                        <img
                          src={logo.logoUrl}
                          alt={logo.name}
                          style={{ width: '80px', height: '30px', objectFit: 'contain' }}
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{logo.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{logo.width}x{logo.height}px</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{logo.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      logo.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {logo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(logo)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteLogo(logo.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Preview Section */}
      {logos.filter(l => l.isActive).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Preview (as shown on homepage)</h2>
          <div className="bg-[#141a47] p-6 rounded-xl">
            <p className="text-white/60 text-center text-sm mb-4">{sectionTitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {logos.filter(l => l.isActive).map((logo) => (
                <div key={logo.id} className="flex items-center justify-center">
                  {logo.logoUrl ? (
                    <img
                      src={logo.logoUrl}
                      alt={logo.name}
                      style={{
                        width: `${logo.width}px`,
                        height: `${logo.height}px`,
                        objectFit: 'contain'
                      }}
                      className="opacity-90"
                    />
                  ) : (
                    <span className="text-white/80 font-semibold">{logo.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
