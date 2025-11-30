'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../../AdminContext';

interface FooterLink {
  id?: number;
  label: string;
  url: string;
  openInNewTab?: boolean;
}

interface FooterColumn {
  id?: number;
  title: string;
  links: FooterLink[];
}

interface FooterSettings {
  tagline?: string;
  columns?: FooterColumn[];
  copyrightText?: string;
  nmlsInfo?: string;
  ctaText?: string;
  ctaButtonText?: string;
  ctaButtonUrl?: string;
}

export default function FooterPage() {
  const { isDark } = useTheme();
  const [footer, setFooter] = useState<FooterSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchFooter();
  }, []);

  const fetchFooter = async () => {
    try {
      const res = await fetch('/api/settings/footer', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setFooter(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch footer:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveFooter = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(footer),
      });

      if (res.ok) {
        setSuccess('Footer saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchFooter();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (err) {
      setError('Failed to save footer settings');
    } finally {
      setSaving(false);
    }
  };

  const addColumn = () => {
    const newColumn: FooterColumn = { title: '', links: [] };
    setFooter({
      ...footer,
      columns: [...(footer.columns || []), newColumn],
    });
    setEditingColumnIndex((footer.columns?.length || 0));
  };

  const updateColumn = (index: number, updates: Partial<FooterColumn>) => {
    const columns = [...(footer.columns || [])];
    columns[index] = { ...columns[index], ...updates };
    setFooter({ ...footer, columns });
  };

  const removeColumn = (index: number) => {
    const columns = [...(footer.columns || [])];
    columns.splice(index, 1);
    setFooter({ ...footer, columns });
    setEditingColumnIndex(null);
  };

  const addLink = (columnIndex: number) => {
    const columns = [...(footer.columns || [])];
    columns[columnIndex].links = [
      ...columns[columnIndex].links,
      { label: '', url: '', openInNewTab: false },
    ];
    setFooter({ ...footer, columns });
  };

  const updateLink = (columnIndex: number, linkIndex: number, updates: Partial<FooterLink>) => {
    const columns = [...(footer.columns || [])];
    columns[columnIndex].links[linkIndex] = {
      ...columns[columnIndex].links[linkIndex],
      ...updates,
    };
    setFooter({ ...footer, columns });
  };

  const removeLink = (columnIndex: number, linkIndex: number) => {
    const columns = [...(footer.columns || [])];
    columns[columnIndex].links.splice(linkIndex, 1);
    setFooter({ ...footer, columns });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Footer Settings
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage footer content and link columns
          </p>
        </div>
        <button
          onClick={saveFooter}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* General Settings */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          General Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Tagline
            </label>
            <input
              type="text"
              value={footer.tagline || ''}
              onChange={(e) => setFooter({ ...footer, tagline: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 outline-none`}
              placeholder="Making homeownership possible for everyone."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Copyright Text
            </label>
            <textarea
              value={footer.copyrightText || ''}
              onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })}
              rows={2}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 outline-none`}
              placeholder="American Mortgage is a DBA of..."
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Use {'{{year}}'} for dynamic year
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              NMLS Information
            </label>
            <input
              type="text"
              value={footer.nmlsInfo || ''}
              onChange={(e) => setFooter({ ...footer, nmlsInfo: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 outline-none`}
              placeholder="NMLS ID #1907 (www.nmlsconsumeraccess.org)"
            />
          </div>
        </div>
      </div>

      {/* CTA Bar Settings */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          CTA Bar (Sticky Banner)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              CTA Text
            </label>
            <input
              type="text"
              value={footer.ctaText || ''}
              onChange={(e) => setFooter({ ...footer, ctaText: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 outline-none`}
              placeholder="See what home loan is right for you"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Button Text
            </label>
            <input
              type="text"
              value={footer.ctaButtonText || ''}
              onChange={(e) => setFooter({ ...footer, ctaButtonText: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 outline-none`}
              placeholder="Start Here"
            />
          </div>
          <div className="md:col-span-3">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Button URL
            </label>
            <input
              type="text"
              value={footer.ctaButtonUrl || ''}
              onChange={(e) => setFooter({ ...footer, ctaButtonUrl: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 outline-none`}
              placeholder="/apply"
            />
          </div>
        </div>
      </div>

      {/* Footer Columns */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Link Columns
          </h2>
          <button
            onClick={addColumn}
            disabled={(footer.columns?.length || 0) >= 4}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Column
          </button>
        </div>

        {!footer.columns || footer.columns.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No columns yet. Add up to 4 footer columns.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {footer.columns.map((column, colIndex) => (
              <div
                key={colIndex}
                className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => updateColumn(colIndex, { title: e.target.value })}
                    className={`font-medium px-2 py-1 rounded border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Column Title"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingColumnIndex(editingColumnIndex === colIndex ? null : colIndex)}
                      className={`text-sm px-2 py-1 rounded ${
                        isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {editingColumnIndex === colIndex ? 'Done' : 'Edit Links'}
                    </button>
                    <button
                      onClick={() => removeColumn(colIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {editingColumnIndex === colIndex && (
                  <div className="space-y-2 mt-3">
                    {column.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(colIndex, linkIndex, { label: e.target.value })}
                          className={`flex-1 px-2 py-1.5 text-sm rounded border ${
                            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Label"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateLink(colIndex, linkIndex, { url: e.target.value })}
                          className={`flex-1 px-2 py-1.5 text-sm rounded border ${
                            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="URL"
                        />
                        <button
                          onClick={() => removeLink(colIndex, linkIndex)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addLink(colIndex)}
                      className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      + Add Link
                    </button>
                  </div>
                )}

                {editingColumnIndex !== colIndex && column.links.length > 0 && (
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {column.links.length} link{column.links.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
