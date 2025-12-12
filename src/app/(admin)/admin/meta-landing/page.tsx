'use client';

import { useEffect, useState } from 'react';

interface MenuItem {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

interface MetaLandingSettings {
  noticeEnabled: boolean;
  headerDesktopEnabled: boolean;
  headerMobileEnabled: boolean;
  headerLogoCenteredMobile: boolean;
  menuEnabled: boolean;
  menuItems: MenuItem[];
  applyButton: {
    desktopEnabled: boolean;
    mobileEnabled: boolean;
    iconEnabled: boolean;
    text: string;
    url: string;
    color: string;
    textColor: string;
  };
  heading: {
    line1: string;
    line2: string;
    line3: string;
  };
  description: string;
  ctaButton: {
    enabled: boolean;
    iconEnabled: boolean;
    text: string;
    url: string;
    color: string;
    textColor: string;
  };
}

const defaultSettings: MetaLandingSettings = {
  noticeEnabled: true,
  headerDesktopEnabled: true,
  headerMobileEnabled: true,
  headerLogoCenteredMobile: false,
  menuEnabled: true,
  menuItems: [],
  applyButton: {
    desktopEnabled: true,
    mobileEnabled: true,
    iconEnabled: true,
    text: 'Apply Now',
    url: '/apply',
    color: '#d93c37',
    textColor: '#ffffff',
  },
  heading: {
    line1: 'Find Out',
    line2: 'Your Homebuying',
    line3: 'Budget Today',
  },
  description: 'Complete this quick pre-application to get a clear picture of your budget and start shopping for homes with confidence.',
  ctaButton: {
    enabled: true,
    iconEnabled: true,
    text: 'Check My Budget',
    url: '/apply',
    color: '#d93c37',
    textColor: '#ffffff',
  },
};

export default function MetaLandingAdminPage() {
  const [settings, setSettings] = useState<MetaLandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/meta-landing', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setSettings({
            noticeEnabled: result.data.noticeEnabled ?? true,
            headerDesktopEnabled: result.data.headerDesktopEnabled ?? true,
            headerMobileEnabled: result.data.headerMobileEnabled ?? true,
            headerLogoCenteredMobile: result.data.headerLogoCenteredMobile ?? false,
            menuEnabled: result.data.menuEnabled ?? true,
            menuItems: result.data.menuItems || [],
            applyButton: { ...defaultSettings.applyButton, ...result.data.applyButton },
            heading: { ...defaultSettings.heading, ...result.data.heading },
            description: result.data.description || defaultSettings.description,
            ctaButton: { ...defaultSettings.ctaButton, ...result.data.ctaButton },
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/settings/meta-landing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function addMenuItem() {
    setSettings(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, { label: '', url: '', openInNewTab: false }],
    }));
  }

  function updateMenuItem(index: number, field: keyof MenuItem, value: string | boolean) {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function removeMenuItem(index: number) {
    setSettings(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter((_, i) => i !== index),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meta Landing Page</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure the /meta landing page content and appearance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/meta"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Preview
          </a>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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

      {/* Page Visibility Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Page Elements</h2>
        <div className="space-y-4">
          {/* Notice Banner Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Legal Notice Banner</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show the legal disclaimer banner at the top of the page</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.noticeEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, noticeEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Header (Logo) - Desktop Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Header (Logo) - Desktop</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show the header with logo on desktop</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.headerDesktopEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, headerDesktopEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Header (Logo) - Mobile Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Header (Logo) - Mobile</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show the header with logo on mobile</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.headerMobileEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, headerMobileEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Center Logo on Mobile Toggle - Only show if mobile header is enabled */}
          {settings.headerMobileEnabled && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Center Logo on Mobile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Center the header logo on mobile screens</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.headerLogoCenteredMobile}
                  onChange={(e) => setSettings(prev => ({ ...prev, headerLogoCenteredMobile: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Menu Settings - Only show if desktop header is enabled */}
      {settings.headerDesktopEnabled && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Menu Settings</h2>
          <div className="space-y-6">
            {/* Enable/Disable Menu */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="menuEnabled"
                checked={settings.menuEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, menuEnabled: e.target.checked }))}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="menuEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show navigation menu on this page
              </label>
            </div>

            {/* Menu Items */}
            {settings.menuEnabled && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white">Menu Items</h3>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                {settings.menuItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No menu items yet. Click &quot;Add Item&quot; to create one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {settings.menuItems.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Item {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeMenuItem(index)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Label</label>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="About"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">URL</label>
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => updateMenuItem(index, 'url', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              placeholder="/about"
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.openInNewTab || false}
                              onChange={(e) => updateMenuItem(index, 'openInNewTab', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Open in new tab</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Button Settings - Show if any header is enabled */}
      {(settings.headerDesktopEnabled || settings.headerMobileEnabled) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Apply Button (Header)</h2>

          {/* Button Visibility Toggles */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show on Desktop</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display the apply button on desktop screens</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.applyButton.desktopEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, applyButton: { ...prev.applyButton, desktopEnabled: e.target.checked } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show on Mobile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display the apply button on mobile screens</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.applyButton.mobileEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, applyButton: { ...prev.applyButton, mobileEnabled: e.target.checked } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {(settings.applyButton.desktopEnabled || settings.applyButton.mobileEnabled) && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show Phone Icon</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Display a phone icon next to the button text</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.applyButton.iconEnabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, applyButton: { ...prev.applyButton, iconEnabled: e.target.checked } }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}
          </div>

          {(settings.applyButton.desktopEnabled || settings.applyButton.mobileEnabled) && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={settings.applyButton.text}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  applyButton: { ...prev.applyButton, text: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Button URL
              </label>
              <input
                type="text"
                value={settings.applyButton.url}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  applyButton: { ...prev.applyButton, url: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.applyButton.color}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    applyButton: { ...prev.applyButton, color: e.target.value }
                  }))}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.applyButton.color}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    applyButton: { ...prev.applyButton, color: e.target.value }
                  }))}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.applyButton.textColor}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    applyButton: { ...prev.applyButton, textColor: e.target.value }
                  }))}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.applyButton.textColor}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    applyButton: { ...prev.applyButton, textColor: e.target.value }
                  }))}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
            <button
              className="px-6 py-2.5 rounded font-semibold transition-colors inline-flex items-center gap-2"
              style={{
                backgroundColor: settings.applyButton.color,
                color: settings.applyButton.textColor,
              }}
            >
              {settings.applyButton.iconEnabled && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
              {settings.applyButton.text}
            </button>
          </div>
          </>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Content Section</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Heading Line 1
            </label>
            <input
              type="text"
              value={settings.heading.line1}
              onChange={(e) => setSettings(prev => ({ ...prev, heading: { ...prev.heading, line1: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Find Out"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Heading Line 2
            </label>
            <input
              type="text"
              value={settings.heading.line2}
              onChange={(e) => setSettings(prev => ({ ...prev, heading: { ...prev.heading, line2: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Your Homebuying"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Heading Line 3
            </label>
            <input
              type="text"
              value={settings.heading.line3}
              onChange={(e) => setSettings(prev => ({ ...prev, heading: { ...prev.heading, line3: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              placeholder="Budget Today"
            />
          </div>
          {/* Heading Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
            <div className="text-2xl font-bold text-[#181F53]">
              <div>{settings.heading.line1}</div>
              <div>{settings.heading.line2}</div>
              <div>{settings.heading.line3}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            />
          </div>
        </div>
      </div>

      {/* CTA Button Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">CTA Button</h2>

        {/* Button Visibility Toggles */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show CTA Button</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Display the main call-to-action button</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.ctaButton.enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, ctaButton: { ...prev.ctaButton, enabled: e.target.checked } }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.ctaButton.enabled && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Show Phone Icon</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Display a phone icon next to the button text</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ctaButton.iconEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, ctaButton: { ...prev.ctaButton, iconEnabled: e.target.checked } }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          )}
        </div>

        {settings.ctaButton.enabled && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Button Text
            </label>
            <input
              type="text"
              value={settings.ctaButton.text}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ctaButton: { ...prev.ctaButton, text: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Button URL
            </label>
            <input
              type="text"
              value={settings.ctaButton.url}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ctaButton: { ...prev.ctaButton, url: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.ctaButton.color}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ctaButton: { ...prev.ctaButton, color: e.target.value }
                }))}
                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.ctaButton.color}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ctaButton: { ...prev.ctaButton, color: e.target.value }
                }))}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.ctaButton.textColor}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ctaButton: { ...prev.ctaButton, textColor: e.target.value }
                }))}
                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={settings.ctaButton.textColor}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  ctaButton: { ...prev.ctaButton, textColor: e.target.value }
                }))}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
        {/* Preview */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
          <button
            className="px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center gap-2"
            style={{
              backgroundColor: settings.ctaButton.color,
              color: settings.ctaButton.textColor,
            }}
          >
            {settings.ctaButton.iconEnabled && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )}
            {settings.ctaButton.text}
          </button>
        </div>
        </>
        )}
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
  );
}
