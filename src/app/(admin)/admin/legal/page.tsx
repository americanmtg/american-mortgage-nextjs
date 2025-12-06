'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LegalPage {
  id: number;
  slug: string;
  title: string;
  meta_description: string | null;
  content: string | null;
  contact_company: string | null;
  contact_nmls_id: string | null;
  contact_address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_website: string | null;
  updated_at: string;
}

const pageLabels: Record<string, { name: string; description: string; icon: JSX.Element }> = {
  'terms': {
    name: 'Terms & Conditions',
    description: 'Website terms of use, giveaway rules, SMS terms',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  'privacy-policy': {
    name: 'Privacy Policy',
    description: 'Data collection, cookies, user rights',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  'disclaimer': {
    name: 'Disclaimer',
    description: 'Loan disclaimers, rate information, liability',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  'licenses': {
    name: 'Licenses & Disclosures',
    description: 'NMLS info, state licenses, compliance',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
};

export default function LegalAdminPage() {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    meta_description: '',
    content: '',
    contact_company: '',
    contact_nmls_id: '',
    contact_address: '',
    contact_email: '',
    contact_phone: '',
    contact_website: '',
  });

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      setFormData({
        title: selectedPage.title || '',
        meta_description: selectedPage.meta_description || '',
        content: selectedPage.content || '',
        contact_company: selectedPage.contact_company || '',
        contact_nmls_id: selectedPage.contact_nmls_id || '',
        contact_address: selectedPage.contact_address || '',
        contact_email: selectedPage.contact_email || '',
        contact_phone: selectedPage.contact_phone || '',
        contact_website: selectedPage.contact_website || '',
      });
    }
  }, [selectedPage]);

  async function fetchPages() {
    try {
      const res = await fetch('/api/legal-pages', { credentials: 'include' });
      const result = await res.json();
      if (result.success) {
        setPages(result.data);
        // Auto-select first page if none selected
        if (!selectedPage && result.data.length > 0) {
          setSelectedPage(result.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load legal pages');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedPage) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/legal-pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          slug: selectedPage.slug,
          ...formData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSuccessMessage('Changes saved successfully!');
        // Update the local state
        setPages(pages.map(p =>
          p.slug === selectedPage.slug ? { ...p, ...formData, updated_at: new Date().toISOString() } : p
        ));
        setSelectedPage({ ...selectedPage, ...formData, updated_at: new Date().toISOString() });
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Legal Pages</h1>
        <p className="text-gray-600 mt-1">
          Manage legal content including Terms, Privacy Policy, Disclaimer, and Licenses.
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700">{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Pages</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pages.map((page) => {
                const info = pageLabels[page.slug] || { name: page.title, description: '', icon: null };
                const isSelected = selectedPage?.slug === page.slug;

                return (
                  <button
                    key={page.slug}
                    onClick={() => setSelectedPage(page)}
                    className={`w-full text-left p-4 transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-4 border-blue-600'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                        {info.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {info.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {info.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated {formatDate(page.updated_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Preview Pages</h3>
            <div className="space-y-2">
              {pages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  /{page.slug}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3">
          {selectedPage ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Editor Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {pageLabels[selectedPage.slug]?.name || selectedPage.title}
                  </h2>
                  <p className="text-sm text-gray-500">/{selectedPage.slug}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              {/* Editor Form */}
              <div className="p-6 space-y-6">
                {/* Page Info Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Page Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta Description
                      </label>
                      <input
                        type="text"
                        value={formData.meta_description}
                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Information
                    <span className="text-xs font-normal text-gray-400">(shown in footer of each page)</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={formData.contact_company}
                        onChange={(e) => setFormData({ ...formData, contact_company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NMLS ID
                      </label>
                      <input
                        type="text"
                        value={formData.contact_nmls_id}
                        onChange={(e) => setFormData({ ...formData, contact_nmls_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.contact_address}
                        onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        value={formData.contact_website}
                        onChange={(e) => setFormData({ ...formData, contact_website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Content Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Additional Content
                    <span className="text-xs font-normal text-gray-400">(optional, will be appended to page)</span>
                  </h3>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    placeholder="Add any additional custom content here (HTML supported)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">Select a page to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
