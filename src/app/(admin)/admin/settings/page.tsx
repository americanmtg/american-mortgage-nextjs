'use client';

import { useEffect, useState, useRef } from 'react';

interface SiteSettings {
  phone?: string;
  email?: string;
  address?: string;
  legalBanner?: string;
  legalBannerMobile?: string;
  legalBannerShowDesktop?: boolean;
  legalBannerShowMobile?: boolean;
  companyName?: string;
  logo?: {
    id?: number;
    url: string;
    filename: string;
  };
  logoWhite?: {
    id?: number;
    url: string;
    filename: string;
  };
  logoHeight?: number;
  logoWhiteHeight?: number;
  logoHeightMobile?: number;
  logoWhiteHeightMobile?: number;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLogoWhite, setUploadingLogoWhite] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoWhiteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/site', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setSettings(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare the payload using new API format
      const payload: Record<string, unknown> = {
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        legalBanner: settings.legalBanner || '',
        legalBannerMobile: settings.legalBannerMobile || '',
        legalBannerShowDesktop: settings.legalBannerShowDesktop ?? true,
        legalBannerShowMobile: settings.legalBannerShowMobile ?? true,
        companyName: settings.companyName || '',
        logoHeight: settings.logoHeight || 40,
        logoWhiteHeight: settings.logoWhiteHeight || 60,
        logoHeightMobile: settings.logoHeightMobile || 30,
        logoWhiteHeightMobile: settings.logoWhiteHeightMobile || 30,
        socialLinks: settings.socialLinks || {},
      };

      // Include logo IDs for the new API
      if (settings.logo?.id) {
        payload.logoId = settings.logo.id;
      }
      if (settings.logoWhite?.id) {
        payload.logoWhiteId = settings.logoWhite.id;
      }

      const res = await fetch('/api/settings/site', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
        fetchSettings(); // Refresh to get updated data
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

  async function uploadLogo(file: File, type: 'logo' | 'logoWhite') {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingLogoWhite;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name);

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
        setSuccess(`${type === 'logo' ? 'Logo' : 'White logo'} uploaded! Click Save to apply.`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError(`Failed to upload ${type === 'logo' ? 'logo' : 'white logo'}. Make sure you are logged in.`);
    } finally {
      setUploading(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'logoWhite') {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo(file, type);
    }
  }

  function removeLogo(type: 'logo' | 'logoWhite') {
    setSettings(prev => ({
      ...prev,
      [type]: undefined,
    }));
  }

  function updateSocialLink(platform: string, value: string) {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Site Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your site configuration and branding.
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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}

      {/* Logo Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Branding</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Site Logo
            </label>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-gray-300 dark:border-gray-600">
              {settings.logo?.url ? (
                <>
                  <img
                    src={settings.logo.url.startsWith('/') ? settings.logo.url : `/${settings.logo.url}`}
                    alt="Site Logo"
                    className="max-h-20 w-auto mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => removeLogo('logo')}
                      className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {uploadingLogo ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoChange(e, 'logo')}
            />
          </div>

          {/* White Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              White Logo (Footer)
            </label>
            <div className="bg-gray-800 dark:bg-gray-950 rounded-lg p-6 flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-gray-600">
              {settings.logoWhite?.url ? (
                <>
                  <img
                    src={settings.logoWhite.url.startsWith('/') ? settings.logoWhite.url : `/${settings.logoWhite.url}`}
                    alt="White Logo"
                    className="max-h-20 w-auto mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoWhiteInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-gray-700 text-gray-200 rounded border border-gray-600 hover:bg-gray-600"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => removeLogo('logoWhite')}
                      className="px-3 py-1.5 text-sm bg-red-900/30 text-red-400 rounded border border-red-800 hover:bg-red-900/50"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => logoWhiteInputRef.current?.click()}
                  disabled={uploadingLogoWhite}
                  className="flex flex-col items-center text-gray-400 hover:text-gray-200"
                >
                  {uploadingLogoWhite ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-2"></div>
                  ) : (
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {uploadingLogoWhite ? 'Uploading...' : 'Click to upload white logo'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={logoWhiteInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoChange(e, 'logoWhite')}
            />
          </div>
        </div>

        {/* Logo Heights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Header Logo Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Header Logo Height
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.logoHeight ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings(prev => ({ ...prev, logoHeight: val === '' ? undefined : parseInt(val) }));
                }}
                onBlur={(e) => {
                  if (!e.target.value || parseInt(e.target.value) < 20) {
                    setSettings(prev => ({ ...prev, logoHeight: 40 }));
                  }
                }}
                placeholder="40"
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                min={20}
                max={100}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Logo size in the site header/navigation (20-100px)
            </p>
          </div>

          {/* Footer Logo Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Footer Logo Height
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.logoWhiteHeight ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSettings(prev => ({ ...prev, logoWhiteHeight: val === '' ? undefined : parseInt(val) }));
                }}
                onBlur={(e) => {
                  if (!e.target.value || parseInt(e.target.value) < 20) {
                    setSettings(prev => ({ ...prev, logoWhiteHeight: 60 }));
                  }
                }}
                placeholder="60"
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                min={20}
                max={150}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Logo size in the site footer (20-150px)
            </p>
          </div>
        </div>

        {/* Mobile Logo Heights */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Mobile Logo Sizes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Header Logo Height (Mobile) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Header Logo Height (Mobile)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.logoHeightMobile ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings(prev => ({ ...prev, logoHeightMobile: val === '' ? undefined : parseInt(val) }));
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value) < 15) {
                      setSettings(prev => ({ ...prev, logoHeightMobile: 30 }));
                    }
                  }}
                  placeholder="30"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  min={15}
                  max={60}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Logo size on mobile header (15-60px)
              </p>
            </div>

            {/* Footer Logo Height (Mobile) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Footer Logo Height (Mobile)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.logoWhiteHeightMobile ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings(prev => ({ ...prev, logoWhiteHeightMobile: val === '' ? undefined : parseInt(val) }));
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value) < 15) {
                      setSettings(prev => ({ ...prev, logoWhiteHeightMobile: 30 }));
                    }
                  }}
                  placeholder="30"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  min={15}
                  max={80}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Logo size on mobile footer (15-80px)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={settings.companyName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="American Mortgage"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={settings.phone || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="1-800-123-4567"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="hello@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={settings.address || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="123 Main St, City, State 12345"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
            />
          </div>
        </div>
      </div>

      {/* Legal Banner */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Legal Banner</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This text appears at the top of your website. You can set different messages for desktop and mobile.
        </p>

        {/* Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-6 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.legalBannerShowDesktop !== false}
              onChange={(e) => setSettings(prev => ({ ...prev, legalBannerShowDesktop: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show on Desktop</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.legalBannerShowMobile !== false}
              onChange={(e) => setSettings(prev => ({ ...prev, legalBannerShowMobile: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show on Mobile</span>
          </label>
        </div>

        {/* Desktop Banner */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Desktop Message
          </label>
          <textarea
            value={settings.legalBanner || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, legalBanner: e.target.value }))}
            placeholder="American Mortgage services are not available in NY, NV, NJ, UT, VT."
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
          />
        </div>

        {/* Mobile Banner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mobile Message <span className="text-gray-400 font-normal">(leave empty to use desktop message)</span>
          </label>
          <textarea
            value={settings.legalBannerMobile || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, legalBannerMobile: e.target.value }))}
            placeholder="Same as desktop if left empty"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Social Media Links</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Facebook
            </label>
            <input
              type="url"
              value={settings.socialLinks?.facebook || ''}
              onChange={(e) => updateSocialLink('facebook', e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Twitter / X
            </label>
            <input
              type="url"
              value={settings.socialLinks?.twitter || ''}
              onChange={(e) => updateSocialLink('twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Instagram
            </label>
            <input
              type="url"
              value={settings.socialLinks?.instagram || ''}
              onChange={(e) => updateSocialLink('instagram', e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              LinkedIn
            </label>
            <input
              type="url"
              value={settings.socialLinks?.linkedin || ''}
              onChange={(e) => updateSocialLink('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              YouTube
            </label>
            <input
              type="url"
              value={settings.socialLinks?.youtube || ''}
              onChange={(e) => updateSocialLink('youtube', e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
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
