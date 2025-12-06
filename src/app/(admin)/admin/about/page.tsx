'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface ApproachItem {
  title: string;
  description: string;
  icon: string;
}

interface AboutSettings {
  heroTitle: string;
  heroSubtitle: string;
  missionTitle: string;
  missionContent: string;
  whatWeDoTitle: string;
  whatWeDoContent: string;
  whatWeDoItems: string[];
  approachTitle: string;
  approachItems: ApproachItem[];
  contactTitle: string;
  contactName: string;
  contactNmls: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactImage: string;
  ctaText: string;
  ctaUrl: string;
}

const DEFAULT_SETTINGS: AboutSettings = {
  heroTitle: 'About American Mortgage',
  heroSubtitle: 'Your trusted Arkansas mortgage broker — dedicated to making homeownership accessible for everyone.',
  missionTitle: 'Our Mission',
  missionContent: 'American Mortgage was founded with a clear purpose: to simplify the home buying process and make it accessible to everyone. We combine industry expertise with personalized service to guide you toward the right loan for your situation.',
  whatWeDoTitle: 'What We Do',
  whatWeDoContent: 'We offer a full range of mortgage products including FHA, VA, USDA, and Conventional loans. Our team specializes in helping first-time homebuyers, veterans, and families across Arkansas find financing solutions that fit their needs.',
  whatWeDoItems: ['Purchase and refinance loans', 'Down payment assistance programs', 'Fast pre-approvals', 'Competitive rates and terms'],
  approachTitle: 'Our Approach',
  approachItems: [
    { title: 'Transparent', description: 'Clear communication and no hidden fees. We explain every step of the process.', icon: 'eye' },
    { title: 'Responsive', description: 'We return calls and emails promptly. Your questions deserve quick answers.', icon: 'lightning' },
    { title: 'Efficient', description: 'Streamlined processes to get you from application to closing without delays.', icon: 'clock' },
  ],
  contactTitle: 'Contact Us',
  contactName: 'American Mortgage',
  contactNmls: '#2676687',
  contactPhone: '(870) 926-4052',
  contactEmail: 'hello@americanmtg.com',
  contactAddress: '122 CR 7185, Jonesboro, AR 72405',
  contactImage: '/cms-media/png-01.png',
  ctaText: 'Start Your Application',
  ctaUrl: '/apply',
};

export default function AboutAdminPage() {
  const [settings, setSettings] = useState<AboutSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', 'Contact section image');

      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        setSettings(prev => ({
          ...prev,
          contactImage: result.data.url,
        }));
        setMessage({ type: 'success', text: 'Image uploaded! Click Save to apply.' });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/about');
      const json = await res.json();
      if (json.success && json.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...json.data,
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateWhatWeDoItem = (index: number, value: string) => {
    const newItems = [...settings.whatWeDoItems];
    newItems[index] = value;
    setSettings({ ...settings, whatWeDoItems: newItems });
  };

  const addWhatWeDoItem = () => {
    setSettings({
      ...settings,
      whatWeDoItems: [...settings.whatWeDoItems, ''],
    });
  };

  const removeWhatWeDoItem = (index: number) => {
    const newItems = settings.whatWeDoItems.filter((_, i) => i !== index);
    setSettings({ ...settings, whatWeDoItems: newItems });
  };

  const updateApproachItem = (index: number, field: keyof ApproachItem, value: string) => {
    const newItems = [...settings.approachItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSettings({ ...settings, approachItems: newItems });
  };

  const addApproachItem = () => {
    setSettings({
      ...settings,
      approachItems: [...settings.approachItems, { title: '', description: '', icon: 'star' }],
    });
  };

  const removeApproachItem = (index: number) => {
    const newItems = settings.approachItems.filter((_, i) => i !== index);
    setSettings({ ...settings, approachItems: newItems });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Page</h1>
          <p className="text-sm text-gray-500 mt-1">Customize the /about page content</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/about"
            target="_blank"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            View Page
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#181F53] text-white rounded-lg hover:bg-[#0f1337] transition-colors disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={settings.heroTitle}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <textarea
                value={settings.heroSubtitle}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mission Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={settings.missionTitle}
                onChange={(e) => setSettings({ ...settings, missionTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={settings.missionContent}
                onChange={(e) => setSettings({ ...settings, missionContent: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What We Do Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={settings.whatWeDoTitle}
                onChange={(e) => setSettings({ ...settings, whatWeDoTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={settings.whatWeDoContent}
                onChange={(e) => setSettings({ ...settings, whatWeDoContent: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bullet Points</label>
              <div className="space-y-2">
                {settings.whatWeDoItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateWhatWeDoItem(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
                      placeholder="Enter bullet point"
                    />
                    <button
                      onClick={() => removeWhatWeDoItem(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addWhatWeDoItem}
                className="mt-2 px-3 py-2 text-sm text-[#181F53] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Bullet Point
              </button>
            </div>
          </div>
        </div>

        {/* Our Approach Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Our Approach Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={settings.approachTitle}
                onChange={(e) => setSettings({ ...settings, approachTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approach Items</label>
              <div className="space-y-4">
                {settings.approachItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-600">Item {index + 1}</span>
                      <button
                        onClick={() => removeApproachItem(index)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Title</label>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateApproachItem(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none text-sm"
                          placeholder="e.g., Transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Icon</label>
                        <select
                          value={item.icon}
                          onChange={(e) => updateApproachItem(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none text-sm"
                        >
                          <option value="eye">Eye (Transparent)</option>
                          <option value="lightning">Lightning (Fast)</option>
                          <option value="clock">Clock (Efficient)</option>
                          <option value="shield">Shield (Secure)</option>
                          <option value="star">Star (Quality)</option>
                          <option value="heart">Heart (Care)</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateApproachItem(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none text-sm"
                        placeholder="Describe this approach..."
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addApproachItem}
                className="mt-2 px-3 py-2 text-sm text-[#181F53] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Approach Item
              </button>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
              <input
                type="text"
                value={settings.contactTitle}
                onChange={(e) => setSettings({ ...settings, contactTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={settings.contactName}
                  onChange={(e) => setSettings({ ...settings, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NMLS#</label>
                <input
                  type="text"
                  value={settings.contactNmls}
                  onChange={(e) => setSettings({ ...settings, contactNmls: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={settings.contactAddress}
                onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            {/* Contact Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Image/Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#181F53] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {settings.contactImage ? (
                    <img
                      src={settings.contactImage}
                      alt="Contact"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: Square image, will be shown in a circle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Call to Action Button</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={settings.ctaText}
                onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button URL</label>
              <input
                type="text"
                value={settings.ctaUrl}
                onChange={(e) => setSettings({ ...settings, ctaUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#181F53] focus:border-[#181F53] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#181F53] text-white rounded-lg hover:bg-[#0f1337] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
