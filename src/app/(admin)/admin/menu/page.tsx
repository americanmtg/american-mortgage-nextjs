'use client';

import { useEffect, useState } from 'react';

interface MenuItem {
  id?: number;
  label: string;
  url: string;
  openInNewTab?: boolean;
  enabled?: boolean;
  showOnDesktop?: boolean;
  showOnMobileBar?: boolean;
  showInHamburger?: boolean;
  children?: MenuItem[];
}

interface Navigation {
  mainMenu?: MenuItem[];
}

export default function MenuManagement() {
  const [navigation, setNavigation] = useState<Navigation>({ mainMenu: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchNavigation();
  }, []);

  async function fetchNavigation() {
    try {
      const res = await fetch('/api/settings/navigation', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setNavigation(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch navigation:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveNavigation() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/settings/navigation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(navigation),
      });

      if (res.ok) {
        setSuccess('Menu saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchNavigation();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch {
      setError('Failed to save menu. Make sure you are logged in.');
    } finally {
      setSaving(false);
    }
  }

  function addMenuItem() {
    const newItem: MenuItem = {
      label: '',
      url: '/',
      openInNewTab: false,
      enabled: true,
      showOnDesktop: true,
      showOnMobileBar: false,
      showInHamburger: true,
    };
    setNavigation({
      ...navigation,
      mainMenu: [...(navigation.mainMenu || []), newItem],
    });
    setEditingIndex((navigation.mainMenu?.length || 0));
  }

  function updateMenuItem(index: number, updates: Partial<MenuItem>) {
    const newMenu = [...(navigation.mainMenu || [])];
    newMenu[index] = { ...newMenu[index], ...updates };
    setNavigation({ ...navigation, mainMenu: newMenu });
  }

  function removeMenuItem(index: number) {
    const newMenu = [...(navigation.mainMenu || [])];
    newMenu.splice(index, 1);
    setNavigation({ ...navigation, mainMenu: newMenu });
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }

  function moveMenuItem(index: number, direction: 'up' | 'down') {
    const newMenu = [...(navigation.mainMenu || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newMenu.length) return;

    [newMenu[index], newMenu[newIndex]] = [newMenu[newIndex], newMenu[index]];
    setNavigation({ ...navigation, mainMenu: newMenu });

    if (editingIndex === index) {
      setEditingIndex(newIndex);
    } else if (editingIndex === newIndex) {
      setEditingIndex(index);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add, remove, and reorder navigation menu items.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addMenuItem}
            className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
          <button
            onClick={saveNavigation}
            disabled={saving}
            className="px-4 py-2 bg-red text-white rounded-lg font-medium hover:bg-red-dark transition-colors disabled:opacity-50 flex items-center gap-2"
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Menu Items List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
        {!navigation.mainMenu || navigation.mainMenu.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No menu items yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by adding your first menu item.</p>
            <button
              onClick={addMenuItem}
              className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors"
            >
              Add Menu Item
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {navigation.mainMenu.map((item, index) => (
              <div key={index} className="p-4">
                {editingIndex === index ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => updateMenuItem(index, { label: e.target.value })}
                          placeholder="e.g., About Us"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          URL
                        </label>
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => updateMenuItem(index, { url: e.target.value })}
                          placeholder="e.g., /about or https://..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(e) => updateMenuItem(index, { enabled: e.target.checked })}
                          className="w-4 h-4 text-navy rounded focus:ring-navy"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.openInNewTab || false}
                          onChange={(e) => updateMenuItem(index, { openInNewTab: e.target.checked })}
                          className="w-4 h-4 text-navy rounded focus:ring-navy"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Open in new tab</span>
                      </label>
                    </div>
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Visibility</p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.showOnDesktop !== false}
                            onChange={(e) => updateMenuItem(index, { showOnDesktop: e.target.checked })}
                            className="w-4 h-4 text-navy rounded focus:ring-navy"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Desktop Nav</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.showOnMobileBar || false}
                            onChange={(e) => updateMenuItem(index, { showOnMobileBar: e.target.checked })}
                            className="w-4 h-4 text-navy rounded focus:ring-navy"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Mobile Bar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.showInHamburger !== false}
                            onChange={(e) => updateMenuItem(index, { showInHamburger: e.target.checked })}
                            className="w-4 h-4 text-navy rounded focus:ring-navy"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Hamburger Menu</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Drag Handle / Reorder */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveMenuItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveMenuItem(index, 'down')}
                          disabled={index === (navigation.mainMenu?.length || 0) - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${item.enabled === false ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                            {item.label || '(No label)'}
                          </span>
                          {item.enabled === false && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                              Disabled
                            </span>
                          )}
                          {item.openInNewTab && (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{item.url}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          <div className="flex items-center gap-1">
                            {item.showOnDesktop !== false && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Desktop</span>
                            )}
                            {item.showOnMobileBar && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">Mobile Bar</span>
                            )}
                            {item.showInHamburger !== false && (
                              <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">Hamburger</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingIndex(index)}
                        className="p-2 text-gray-400 hover:text-navy dark:hover:text-blue-400 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeMenuItem(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Use relative URLs (e.g., /about) for internal pages and full URLs for external links.
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>Desktop Nav:</strong> Shows in the main navigation bar on desktop screens.
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>Mobile Bar:</strong> Shows in the quick-access bar below the header on mobile (e.g., About, Reviews, Learn).
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>Hamburger Menu:</strong> Shows when the mobile hamburger menu is opened.
          </li>
        </ul>
      </div>
    </div>
  );
}
