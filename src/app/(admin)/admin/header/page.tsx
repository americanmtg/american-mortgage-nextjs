'use client';

import { useEffect, useState, useRef } from 'react';

interface HeaderSettings {
  backgroundType?: 'solid' | 'gradient' | 'pattern' | 'image' | 'video';
  backgroundColor?: string;
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientDirection?: string;
  patternType?: string;
  patternColor?: string;
  patternBackgroundColor?: string;
  patternImage?: {
    id?: number;
    url: string;
    filename: string;
  };
  backgroundImage?: {
    id?: number;
    url: string;
    filename: string;
  };
  backgroundImageOverlay?: string;
  backgroundVideo?: {
    id?: number;
    url: string;
    filename: string;
  };
  backgroundVideoUrl?: string;
  backgroundVideoOverlay?: string;
  headerButton?: {
    text?: string;
    url?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export default function HeaderSettingsPage() {
  const [settings, setSettings] = useState<HeaderSettings>({
    backgroundType: 'solid',
    backgroundColor: '#ffffff',
    headerButton: {
      text: 'Apply',
      url: '/apply',
      backgroundColor: '#d93c37',
      textColor: '#ffffff',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPattern, setUploadingPattern] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const patternInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/header', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        if (data) {
          setSettings({
            backgroundType: data.backgroundType || 'solid',
            backgroundColor: data.backgroundColor || '#ffffff',
            gradientStartColor: data.gradientStartColor || '#ffffff',
            gradientEndColor: data.gradientEndColor || '#f0f0f0',
            gradientDirection: data.gradientDirection || 'to-right',
            patternType: data.patternType || 'dots',
            patternColor: data.patternColor || '#e5e5e5',
            patternBackgroundColor: data.patternBackgroundColor || '#ffffff',
            patternImage: data.patternImage,
            backgroundImage: data.backgroundImage,
            backgroundImageOverlay: data.backgroundImageOverlay || 'rgba(255,255,255,0.9)',
            backgroundVideo: data.backgroundVideo,
            backgroundVideoUrl: data.backgroundVideoUrl || '',
            backgroundVideoOverlay: data.backgroundVideoOverlay || 'rgba(255,255,255,0.9)',
            headerButton: {
              text: data.headerButtonText || 'Apply',
              url: data.headerButtonUrl || '/apply',
              backgroundColor: data.headerButtonBackgroundColor || '#d93c37',
              textColor: data.headerButtonTextColor || '#ffffff',
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch header settings:', err);
      setError('Failed to load header settings');
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
        backgroundType: settings.backgroundType,
        backgroundColor: settings.backgroundColor,
        gradientStartColor: settings.gradientStartColor,
        gradientEndColor: settings.gradientEndColor,
        gradientDirection: settings.gradientDirection,
        patternType: settings.patternType,
        patternColor: settings.patternColor,
        patternBackgroundColor: settings.patternBackgroundColor,
        backgroundImageOverlay: settings.backgroundImageOverlay,
        backgroundVideoUrl: settings.backgroundVideoUrl,
        backgroundVideoOverlay: settings.backgroundVideoOverlay,
        headerButtonText: settings.headerButton?.text,
        headerButtonUrl: settings.headerButton?.url,
        headerButtonBackgroundColor: settings.headerButton?.backgroundColor,
        headerButtonTextColor: settings.headerButton?.textColor,
      };

      if (settings.patternImage?.id) {
        payload.patternImageId = settings.patternImage.id;
      }
      if (settings.backgroundImage?.id) {
        payload.backgroundImageId = settings.backgroundImage.id;
      }
      if (settings.backgroundVideo?.id) {
        payload.backgroundVideoId = settings.backgroundVideo.id;
      }

      const res = await fetch('/api/settings/header', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess('Header settings saved successfully!');
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

  async function uploadMedia(file: File, type: 'backgroundImage' | 'backgroundVideo' | 'patternImage') {
    const setUploading = type === 'backgroundImage' ? setUploadingImage : type === 'backgroundVideo' ? setUploadingVideo : setUploadingPattern;
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
        setSuccess('File uploaded! Click Save to apply.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      setError('Failed to upload file. Make sure you are logged in.');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: 'backgroundImage' | 'backgroundVideo' | 'patternImage') {
    const file = e.target.files?.[0];
    if (file) {
      uploadMedia(file, type);
    }
  }

  function removeMedia(type: 'backgroundImage' | 'backgroundVideo' | 'patternImage') {
    setSettings(prev => ({
      ...prev,
      [type]: undefined,
    }));
  }

  function updateButtonSetting(key: string, value: string) {
    setSettings(prev => ({
      ...prev,
      headerButton: {
        ...prev.headerButton,
        [key]: value,
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
          <h1 className="text-2xl font-bold text-gray-900">Header Settings</h1>
          <p className="text-gray-600 mt-1">
            Customize your site header background and button.
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

      {/* Background Type Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Background Type</h2>

        <div className="grid grid-cols-5 gap-3">
          {[
            { value: 'solid', label: 'Solid Color' },
            { value: 'gradient', label: 'Gradient' },
            { value: 'pattern', label: 'Pattern' },
            { value: 'image', label: 'Image' },
            { value: 'video', label: 'Video' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSettings(prev => ({ ...prev, backgroundType: option.value as HeaderSettings['backgroundType'] }))}
              className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                settings.backgroundType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color Settings */}
      {settings.backgroundType === 'solid' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Solid Color</h2>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={settings.backgroundColor || '#ffffff'}
              onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="w-16 h-16 rounded-lg border border-gray-300 cursor-pointer"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <input
                type="text"
                value={settings.backgroundColor || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                placeholder="#ffffff"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Settings */}
      {settings.backgroundType === 'gradient' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Gradient Settings</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.gradientStartColor || '#ffffff'}
                  onChange={(e) => setSettings(prev => ({ ...prev, gradientStartColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Color</label>
                  <input
                    type="text"
                    value={settings.gradientStartColor || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, gradientStartColor: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.gradientEndColor || '#f0f0f0'}
                  onChange={(e) => setSettings(prev => ({ ...prev, gradientEndColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Color</label>
                  <input
                    type="text"
                    value={settings.gradientEndColor || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, gradientEndColor: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
              <select
                value={settings.gradientDirection || 'to-right'}
                onChange={(e) => setSettings(prev => ({ ...prev, gradientDirection: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="to-right">Left to Right</option>
                <option value="to-left">Right to Left</option>
                <option value="to-bottom">Top to Bottom</option>
                <option value="to-top">Bottom to Top</option>
                <option value="to-br">Diagonal (Top-Left to Bottom-Right)</option>
                <option value="to-bl">Diagonal (Top-Right to Bottom-Left)</option>
              </select>
            </div>
            {/* Preview */}
            <div
              className="h-16 rounded-lg border border-gray-300"
              style={{
                background: `linear-gradient(${settings.gradientDirection?.replace('to-', 'to ').replace('br', 'bottom right').replace('bl', 'bottom left')}, ${settings.gradientStartColor}, ${settings.gradientEndColor})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Pattern Settings */}
      {settings.backgroundType === 'pattern' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pattern Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pattern Type</label>
              <select
                value={settings.patternType || 'dots'}
                onChange={(e) => setSettings(prev => ({ ...prev, patternType: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dots">Dots</option>
                <option value="lines">Lines</option>
                <option value="grid">Grid</option>
                <option value="diagonal">Diagonal</option>
                <option value="custom">Custom Image</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.patternColor || '#e5e5e5'}
                  onChange={(e) => setSettings(prev => ({ ...prev, patternColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pattern Color</label>
                  <input
                    type="text"
                    value={settings.patternColor || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, patternColor: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.patternBackgroundColor || '#ffffff'}
                  onChange={(e) => setSettings(prev => ({ ...prev, patternBackgroundColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <input
                    type="text"
                    value={settings.patternBackgroundColor || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, patternBackgroundColor: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {settings.patternType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Pattern Image</label>
                <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[100px] border-2 border-dashed border-gray-300">
                  {settings.patternImage?.url ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={settings.patternImage.url.startsWith('/') ? settings.patternImage.url : `/${settings.patternImage.url}`}
                        alt="Pattern"
                        className="h-16 w-auto"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => patternInputRef.current?.click()}
                          className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => removeMedia('patternImage')}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => patternInputRef.current?.click()}
                      disabled={uploadingPattern}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {uploadingPattern ? 'Uploading...' : 'Click to upload pattern image'}
                    </button>
                  )}
                </div>
                <input
                  ref={patternInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, 'patternImage')}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Settings */}
      {settings.backgroundType === 'image' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Background Image</h2>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300">
              {settings.backgroundImage?.url ? (
                <>
                  <img
                    src={settings.backgroundImage.url.startsWith('/') ? settings.backgroundImage.url : `/${settings.backgroundImage.url}`}
                    alt="Background"
                    className="max-h-40 w-auto mb-4 rounded"
                  />
                  <p className="text-sm text-gray-600 mb-2">{settings.backgroundImage.filename}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => removeMedia('backgroundImage')}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex flex-col items-center text-gray-500 hover:text-gray-700"
                >
                  {uploadingImage ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {uploadingImage ? 'Uploading...' : 'Click to upload background image'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'backgroundImage')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Color</label>
              <input
                type="text"
                value={settings.backgroundImageOverlay || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundImageOverlay: e.target.value }))}
                placeholder="rgba(255,255,255,0.9)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Semi-transparent overlay for text readability (e.g., rgba(255,255,255,0.9))
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Video Settings */}
      {settings.backgroundType === 'video' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Background Video</h2>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300">
              {settings.backgroundVideo?.url ? (
                <>
                  <video
                    src={settings.backgroundVideo.url.startsWith('/') ? settings.backgroundVideo.url : `/${settings.backgroundVideo.url}`}
                    className="max-h-40 w-auto mb-4 rounded"
                    controls
                    muted
                  />
                  <p className="text-sm text-gray-600 mb-2">{settings.backgroundVideo.filename}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => removeMedia('backgroundVideo')}
                      className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="flex flex-col items-center text-gray-500 hover:text-gray-700"
                >
                  {uploadingVideo ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  ) : (
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {uploadingVideo ? 'Uploading...' : 'Click to upload video'}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileChange(e, 'backgroundVideo')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or Enter Video URL</label>
              <input
                type="text"
                value={settings.backgroundVideoUrl || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundVideoUrl: e.target.value }))}
                placeholder="https://example.com/video.mp4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overlay Color</label>
              <input
                type="text"
                value={settings.backgroundVideoOverlay || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, backgroundVideoOverlay: e.target.value }))}
                placeholder="rgba(255,255,255,0.9)"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Header Button */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Header Button</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                value={settings.headerButton?.text || ''}
                onChange={(e) => updateButtonSetting('text', e.target.value)}
                placeholder="Apply"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button URL</label>
              <input
                type="text"
                value={settings.headerButton?.url || ''}
                onChange={(e) => updateButtonSetting('url', e.target.value)}
                placeholder="/apply"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.headerButton?.backgroundColor || '#d93c37'}
                onChange={(e) => updateButtonSetting('backgroundColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input
                  type="text"
                  value={settings.headerButton?.backgroundColor || ''}
                  onChange={(e) => updateButtonSetting('backgroundColor', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.headerButton?.textColor || '#ffffff'}
                onChange={(e) => updateButtonSetting('textColor', e.target.value)}
                className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                <input
                  type="text"
                  value={settings.headerButton?.textColor || ''}
                  onChange={(e) => updateButtonSetting('textColor', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="inline-block">
              <span
                className="px-6 py-2.5 rounded-lg font-semibold"
                style={{
                  backgroundColor: settings.headerButton?.backgroundColor || '#d93c37',
                  color: settings.headerButton?.textColor || '#ffffff',
                }}
              >
                {settings.headerButton?.text || 'Apply'}
              </span>
            </div>
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
