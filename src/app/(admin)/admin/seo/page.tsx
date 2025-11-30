'use client';

import { useEffect, useState, useRef } from 'react';

interface SeoSettings {
  siteTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  favicon?: {
    id?: number;
    url: string;
    filename: string;
  };
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: {
    id?: number;
    url: string;
    filename: string;
  };
  googleAnalyticsId?: string;
}

export default function SeoPage() {
  const [settings, setSettings] = useState<SeoSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/seo', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setSettings(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch SEO settings:', err);
      setError('Failed to load SEO settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        siteTitle: settings.siteTitle || '',
        metaDescription: settings.metaDescription || '',
        metaKeywords: settings.metaKeywords || '',
        ogTitle: settings.ogTitle || '',
        ogDescription: settings.ogDescription || '',
        googleAnalyticsId: settings.googleAnalyticsId || '',
      };

      if (settings.favicon?.id) {
        payload.faviconId = settings.favicon.id;
      }
      if (settings.ogImage?.id) {
        payload.ogImageId = settings.ogImage.id;
      }

      const res = await fetch('/api/settings/seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('SEO settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchSettings();
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save settings (${res.status})`);
      }
    } catch (err) {
      console.error('Save error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  async function uploadMedia(file: File, type: 'favicon' | 'ogImage' | 'twitterImage') {
    const setUploading = type === 'favicon' ? setUploadingFavicon : setUploadingOgImage;
    setUploading(true);
    setError(null);

    // Set appropriate label based on image type
    const labelMap: Record<string, string> = {
      favicon: 'Favicon',
      ogImage: 'OG Image',
      twitterImage: 'Twitter Image',
    };

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name);
      formData.append('label', labelMap[type]);

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        setSettings(prev => ({
          ...prev,
          [type]: {
            id: data.id,
            url: data.url,
            filename: data.filename,
          },
        }));
        setSuccess(`${type === 'favicon' ? 'Favicon' : 'Open Graph image'} uploaded! Click Save to apply.`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(`Failed to upload ${type === 'favicon' ? 'favicon' : 'Open Graph image'}. Make sure you are logged in.`);
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'favicon' | 'ogImage') {
    const file = e.target.files?.[0];
    if (file) {
      uploadMedia(file, type);
    }
  }

  function removeMedia(type: 'favicon' | 'ogImage') {
    setSettings(prev => ({
      ...prev,
      [type]: undefined,
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your site's search engine optimization and social sharing settings.
          </p>
        </div>
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

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Basic SEO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic SEO</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Site Title
            </label>
            <input
              type="text"
              value={settings.siteTitle || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
              placeholder="American Mortgage | Home Loans Made Simple"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              This appears in browser tabs and search results
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={settings.metaDescription || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, metaDescription: e.target.value }))}
              placeholder="Get the best mortgage rates with American Mortgage. FHA, Conventional, VA, and USDA loans available."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-sm text-gray-500">
              {settings.metaDescription?.length || 0}/160 characters (recommended)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={settings.metaKeywords || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, metaKeywords: e.target.value }))}
              placeholder="mortgage, home loans, FHA, refinance, down payment assistance"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Comma-separated keywords for SEO
            </p>
          </div>
        </div>
      </div>

      {/* Favicon */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Favicon</h2>

        <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-gray-300">
          {settings.favicon?.url ? (
            <>
              <img
                src={settings.favicon.url.startsWith('/') ? settings.favicon.url : `/${settings.favicon.url}`}
                alt="Favicon"
                className="w-16 h-16 mb-4 object-contain"
              />
              <p className="text-sm text-gray-600 mb-2">{settings.favicon.filename}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => faviconInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Replace
                </button>
                <button
                  onClick={() => removeMedia('favicon')}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => faviconInputRef.current?.click()}
              disabled={uploadingFavicon}
              className="flex flex-col items-center text-gray-500 hover:text-gray-700"
            >
              {uploadingFavicon ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              ) : (
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
              <span className="text-sm font-medium">
                {uploadingFavicon ? 'Uploading...' : 'Click to upload favicon'}
              </span>
              <span className="text-xs text-gray-400 mt-1">Supports .ico, .png (32x32 or 64x64 recommended)</span>
            </button>
          )}
        </div>
        <input
          ref={faviconInputRef}
          type="file"
          accept=".ico,.png,image/x-icon,image/png"
          className="hidden"
          onChange={(e) => handleFileChange(e, 'favicon')}
        />
      </div>

      {/* Open Graph */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Open Graph (Social Sharing)</h2>
        <p className="text-sm text-gray-500 mb-6">
          These settings control how your site appears when shared on Facebook, LinkedIn, iMessage, Slack, and other platforms.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Title
            </label>
            <input
              type="text"
              value={settings.ogTitle || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ogTitle: e.target.value }))}
              placeholder="American Mortgage - Home Loans Made Simple"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Description
            </label>
            <textarea
              value={settings.ogDescription || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, ogDescription: e.target.value }))}
              placeholder="Get pre-approved for your dream home in minutes. Competitive rates, expert guidance."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Image
            </label>
            <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300">
              {settings.ogImage?.url ? (
                <>
                  <img
                    src={settings.ogImage.url.startsWith('/') ? settings.ogImage.url : `/${settings.ogImage.url}`}
                    alt="Open Graph"
                    className="max-h-40 w-auto mb-4 rounded"
                  />
                  <p className="text-sm text-gray-600 mb-2">{settings.ogImage.filename}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => ogImageInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => removeMedia('ogImage')}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => ogImageInputRef.current?.click()}
                  disabled={uploadingOgImage}
                  className="flex flex-col items-center text-gray-500 hover:text-gray-700"
                >
                  {uploadingOgImage ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {uploadingOgImage ? 'Uploading...' : 'Click to upload Open Graph image'}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">Recommended: 1200x630 pixels</span>
                </button>
              )}
            </div>
            <input
              ref={ogImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'ogImage')}
            />
          </div>
        </div>
      </div>

      {/* Google Analytics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Google Analytics</h2>
        <p className="text-sm text-gray-500 mb-6">
          Add your Google Analytics 4 measurement ID to track website traffic.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Analytics ID
          </label>
          <input
            type="text"
            value={settings.googleAnalyticsId || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
            placeholder="G-XXXXXXXXXX"
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Find this in your Google Analytics admin under Data Streams
          </p>
        </div>
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
