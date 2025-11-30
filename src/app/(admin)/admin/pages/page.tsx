'use client';

import { useEffect, useState } from 'react';

interface Page {
  id: number;
  title: string;
  slug: string;
  template?: string;
  content?: string;
  subtitle?: string;
  sidebarTitle?: string;
  sidebarContent?: string;
  ctaTitle?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
  metaTitle?: string;
  metaDescription?: string;
  updatedAt: string;
}

interface EditingPage {
  id?: number;
  title: string;
  slug: string;
  template: string;
  content: string;
  subtitle: string;
  sidebarTitle: string;
  sidebarContent: string;
  ctaTitle: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  metaTitle: string;
  metaDescription: string;
}

const TEMPLATES = [
  { value: 'default', label: 'Default', description: 'Simple page layout with title and content' },
  { value: 'template-1', label: 'Template 1 - Professional', description: 'Two-column layout with hero section, sidebar, and CTA banner' },
];

const emptyPage: EditingPage = {
  title: '',
  slug: '',
  template: 'default',
  content: '',
  subtitle: '',
  sidebarTitle: '',
  sidebarContent: '',
  ctaTitle: '',
  ctaButtonText: '',
  ctaButtonLink: '',
  metaTitle: '',
  metaDescription: '',
};

export default function PagesManagement() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<EditingPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  async function fetchPages() {
    try {
      const res = await fetch('/api/pages', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        setPages(result.data?.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function getTemplateLabel(value: string) {
    return TEMPLATES.find(t => t.value === value)?.label || 'Default';
  }

  function startCreating() {
    setEditingPage({ ...emptyPage });
    setIsCreating(true);
  }

  function startEditing(page: Page) {
    setEditingPage({
      id: page.id,
      title: page.title,
      slug: page.slug,
      template: page.template || 'default',
      content: page.content || '',
      subtitle: page.subtitle || '',
      sidebarTitle: page.sidebarTitle || '',
      sidebarContent: page.sidebarContent || '',
      ctaTitle: page.ctaTitle || '',
      ctaButtonText: page.ctaButtonText || '',
      ctaButtonLink: page.ctaButtonLink || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
    });
    setIsCreating(false);
  }

  function cancelEditing() {
    setEditingPage(null);
    setIsCreating(false);
    setError(null);
  }

  async function savePage() {
    if (!editingPage) return;
    if (!editingPage.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!editingPage.slug.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const slug = editingPage.slug || generateSlug(editingPage.title);

      const payload: Record<string, unknown> = {
        title: editingPage.title,
        slug,
        template: editingPage.template,
        content: editingPage.content,
        metaTitle: editingPage.metaTitle || null,
        metaDescription: editingPage.metaDescription || null,
      };

      // Add template-1 specific fields
      if (editingPage.template === 'template-1') {
        payload.subtitle = editingPage.subtitle || null;
        payload.sidebarTitle = editingPage.sidebarTitle || null;
        payload.sidebarContent = editingPage.sidebarContent || null;
        payload.ctaTitle = editingPage.ctaTitle || null;
        payload.ctaButtonText = editingPage.ctaButtonText || null;
        payload.ctaButtonLink = editingPage.ctaButtonLink || null;
      }

      const url = isCreating
        ? '/api/pages'
        : `/api/pages/${editingPage.id}`;

      const res = await fetch(url, {
        method: isCreating ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(isCreating ? 'Page created successfully!' : 'Page updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
        setEditingPage(null);
        setIsCreating(false);
        fetchPages();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save page');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Make sure you are logged in.');
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(id: number, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    setDeleting(id);
    setError(null);

    try {
      const res = await fetch(`/api/pages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess('Page deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchPages();
      } else {
        throw new Error('Failed to delete page');
      }
    } catch (err) {
      setError('Failed to delete. Make sure you are logged in.');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Edit/Create Form
  if (editingPage) {
    const isTemplate1 = editingPage.template === 'template-1';

    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isCreating ? 'New Page' : 'Edit Page'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={cancelEditing}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={savePage}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isCreating ? 'Create Page' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 space-y-6">
          {/* Template Selection */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">
              Page Template
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEMPLATES.map((template) => (
                <label
                  key={template.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    editingPage.template === template.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.value}
                    checked={editingPage.template === template.value}
                    onChange={(e) => setEditingPage(prev => prev ? { ...prev, template: e.target.value } : null)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white block">
                      {template.label}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {template.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={editingPage.title}
              onChange={(e) => {
                const title = e.target.value;
                setEditingPage(prev => prev ? {
                  ...prev,
                  title,
                  slug: prev.slug || generateSlug(title),
                } : null);
              }}
              placeholder="Enter page title"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-lg"
            />
          </div>

          {/* Subtitle (Template 1 only) */}
          {isTemplate1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={editingPage.subtitle}
                onChange={(e) => setEditingPage(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                placeholder="Optional subtitle shown below the title"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 dark:text-gray-400 mr-2">/</span>
              <input
                type="text"
                value={editingPage.slug}
                onChange={(e) => setEditingPage(prev => prev ? { ...prev, slug: e.target.value } : null)}
                placeholder="page-url-slug"
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              This will be the URL path for your page (e.g., /about-us)
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={editingPage.content}
              onChange={(e) => setEditingPage(prev => prev ? { ...prev, content: e.target.value } : null)}
              placeholder="Write your page content here... (Supports HTML)"
              rows={15}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Tip: You can use HTML tags for formatting.
            </p>
          </div>

          {/* Sidebar Settings (Template 1 only) */}
          {isTemplate1 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Sidebar Settings
              </h3>

              <div className="space-y-4">
                {/* Sidebar Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sidebar Title
                  </label>
                  <input
                    type="text"
                    value={editingPage.sidebarTitle}
                    onChange={(e) => setEditingPage(prev => prev ? { ...prev, sidebarTitle: e.target.value } : null)}
                    placeholder="e.g., Quick Links, About Us"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Sidebar Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sidebar Content
                  </label>
                  <textarea
                    value={editingPage.sidebarContent}
                    onChange={(e) => setEditingPage(prev => prev ? { ...prev, sidebarContent: e.target.value } : null)}
                    placeholder="Content shown in the sidebar..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* CTA Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CTA Title
                  </label>
                  <input
                    type="text"
                    value={editingPage.ctaTitle}
                    onChange={(e) => setEditingPage(prev => prev ? { ...prev, ctaTitle: e.target.value } : null)}
                    placeholder="e.g., Ready to Get Started?"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CTA Button Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={editingPage.ctaButtonText}
                      onChange={(e) => setEditingPage(prev => prev ? { ...prev, ctaButtonText: e.target.value } : null)}
                      placeholder="e.g., Apply Now"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* CTA Button Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CTA Button Link
                    </label>
                    <input
                      type="text"
                      value={editingPage.ctaButtonLink}
                      onChange={(e) => setEditingPage(prev => prev ? { ...prev, ctaButtonLink: e.target.value } : null)}
                      placeholder="e.g., /apply"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              SEO Settings
            </h3>

            {/* Meta Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={editingPage.metaTitle}
                onChange={(e) => setEditingPage(prev => prev ? { ...prev, metaTitle: e.target.value } : null)}
                placeholder="SEO title (appears in browser tab and search results)"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {editingPage.metaTitle.length}/60 characters (recommended max)
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meta Description
              </label>
              <textarea
                value={editingPage.metaDescription}
                onChange={(e) => setEditingPage(prev => prev ? { ...prev, metaDescription: e.target.value } : null)}
                placeholder="Brief description for search engines"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
              />
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {editingPage.metaDescription.length}/160 characters (recommended max)
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Pages List
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your website pages.
          </p>
        </div>
        <button
          onClick={startCreating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {pages.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pages yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first page.</p>
          <button
            onClick={startCreating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Create Page
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900 dark:text-white">{page.title}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-500 dark:text-gray-400">/{page.slug}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      page.template === 'template-1'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {getTemplateLabel(page.template || 'default')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(page.updatedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View Page"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => startEditing(page)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deletePage(page.id, page.title)}
                        disabled={deleting === page.id}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === page.id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
