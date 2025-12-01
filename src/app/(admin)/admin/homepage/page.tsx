'use client';

import { useEffect, useState } from 'react';

interface HomepageSettings {
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    buttonText: string;
    buttonUrl: string;
    reassuranceTime: string;
    reassuranceText: string;
    ratingPercent: string;
    ratingText: string;
  };
  featuredLoans: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
  };
  dpa: {
    enabled: boolean;
    headline: string;
    feature1: string;
    feature2: string;
    feature3: string;
    buttonText: string;
    buttonUrl: string;
    reassuranceText: string;
  };
  tools: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    cards: {
      title: string;
      description: string;
      icon: string;
      url: string;
    }[];
  };
  moreLoans: {
    enabled: boolean;
    text: string;
    linkText: string;
    linkUrl: string;
  };
  articles: {
    title: string;
    subtitle: string;
  };
}

const defaultSettings: HomepageSettings = {
  hero: {
    eyebrow: 'Trusted Nationwide',
    headlineLine1: 'Get home with the',
    headlineLine2: 'first name in financing',
    buttonText: 'Get Started Now',
    buttonUrl: '/apply',
    reassuranceTime: '3 min',
    reassuranceText: 'No impact to credit',
    ratingPercent: '98%',
    ratingText: 'would recommend',
  },
  featuredLoans: {
    eyebrow: 'Featured Loans',
    headlineLine1: 'From first home to refinance,',
    headlineLine2: "we're here for you.",
  },
  dpa: {
    enabled: true,
    headline: 'Make homebuying more affordable with down payment assistance.',
    feature1: 'Cover the downpayment, closing costs, or both',
    feature2: 'Forgivable and long-term repayment plans',
    feature3: '0% down options available',
    buttonText: 'Check Eligibility',
    buttonUrl: '/apply',
    reassuranceText: 'No impact to credit',
  },
  tools: {
    eyebrow: 'Tools & Calculators',
    headlineLine1: 'Get an estimate instantly with our',
    headlineLine2: 'online mortgage tools',
    cards: [
      { title: 'Mortgage Calculator', description: 'Estimate your monthly payment', icon: '🏠', url: '/calculator' },
      { title: 'Affordability Calculator', description: 'See how much home you can afford', icon: '💰', url: '/calculator' },
      { title: 'Refinance Calculator', description: 'Calculate your potential savings', icon: '📊', url: '/calculator' },
    ],
  },
  moreLoans: {
    enabled: true,
    text: 'Not finding the right fit? We have',
    linkText: 'more loan options',
    linkUrl: '/loans',
  },
  articles: {
    title: 'Latest Articles',
    subtitle: 'Tips and guides for homebuyers',
  },
};

export default function HomepagePage() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/homepage', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setSettings({
            hero: { ...defaultSettings.hero, ...result.data.hero },
            featuredLoans: { ...defaultSettings.featuredLoans, ...result.data.featuredLoans },
            dpa: { ...defaultSettings.dpa, ...result.data.dpa },
            tools: {
              ...defaultSettings.tools,
              ...result.data.tools,
              cards: result.data.tools?.cards?.map((card: any, i: number) => ({
                ...defaultSettings.tools.cards[i],
                ...card,
              })) || defaultSettings.tools.cards,
            },
            moreLoans: { ...defaultSettings.moreLoans, ...result.data.moreLoans },
            articles: { ...defaultSettings.articles, ...result.data.articles },
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
      const res = await fetch('/api/settings/homepage', {
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

  function updateHero(field: keyof HomepageSettings['hero'], value: string) {
    setSettings(prev => ({ ...prev, hero: { ...prev.hero, [field]: value } }));
  }

  function updateFeaturedLoans(field: keyof HomepageSettings['featuredLoans'], value: string) {
    setSettings(prev => ({ ...prev, featuredLoans: { ...prev.featuredLoans, [field]: value } }));
  }

  function updateDpa(field: keyof HomepageSettings['dpa'], value: string | boolean) {
    setSettings(prev => ({ ...prev, dpa: { ...prev.dpa, [field]: value } }));
  }

  function updateTools(field: keyof Omit<HomepageSettings['tools'], 'cards'>, value: string) {
    setSettings(prev => ({ ...prev, tools: { ...prev.tools, [field]: value } }));
  }

  function updateToolCard(index: number, field: string, value: string) {
    setSettings(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        cards: prev.tools.cards.map((card, i) => i === index ? { ...card, [field]: value } : card),
      },
    }));
  }

  function addToolCard() {
    setSettings(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        cards: [...prev.tools.cards, { title: '', description: '', icon: '', url: '' }],
      },
    }));
  }

  function removeToolCard(index: number) {
    setSettings(prev => ({
      ...prev,
      tools: {
        ...prev.tools,
        cards: prev.tools.cards.filter((_, i) => i !== index),
      },
    }));
  }

  function updateMoreLoans(field: keyof HomepageSettings['moreLoans'], value: string | boolean) {
    setSettings(prev => ({ ...prev, moreLoans: { ...prev.moreLoans, [field]: value } }));
  }

  function updateArticles(field: keyof HomepageSettings['articles'], value: string) {
    setSettings(prev => ({ ...prev, articles: { ...prev.articles, [field]: value } }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sections = [
    { id: 'hero', label: 'Hero Section' },
    { id: 'featuredLoans', label: 'Featured Loans' },
    { id: 'dpa', label: 'Down Payment Assistance' },
    { id: 'tools', label: 'Tools & Calculators' },
    { id: 'moreLoans', label: 'More Loan Options' },
    { id: 'articles', label: 'Latest Articles' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homepage Content</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage text and settings for the homepage sections.
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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Hero Section */}
      {activeSection === 'hero' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Hero Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Eyebrow Text
              </label>
              <input
                type="text"
                value={settings.hero.eyebrow}
                onChange={(e) => updateHero('eyebrow', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={settings.hero.headlineLine1}
                  onChange={(e) => updateHero('headlineLine1', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headline Line 2 <span className="text-gray-400">(italic)</span>
                </label>
                <input
                  type="text"
                  value={settings.hero.headlineLine2}
                  onChange={(e) => updateHero('headlineLine2', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={settings.hero.buttonText}
                  onChange={(e) => updateHero('buttonText', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button URL
                </label>
                <input
                  type="text"
                  value={settings.hero.buttonUrl}
                  onChange={(e) => updateHero('buttonUrl', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reassurance Time
                </label>
                <input
                  type="text"
                  value={settings.hero.reassuranceTime}
                  onChange={(e) => updateHero('reassuranceTime', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reassurance Text
                </label>
                <input
                  type="text"
                  value={settings.hero.reassuranceText}
                  onChange={(e) => updateHero('reassuranceText', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating Percent
                </label>
                <input
                  type="text"
                  value={settings.hero.ratingPercent}
                  onChange={(e) => updateHero('ratingPercent', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating Text
                </label>
                <input
                  type="text"
                  value={settings.hero.ratingText}
                  onChange={(e) => updateHero('ratingText', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Featured Loans Section */}
      {activeSection === 'featuredLoans' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Featured Loans Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Eyebrow Text
              </label>
              <input
                type="text"
                value={settings.featuredLoans.eyebrow}
                onChange={(e) => updateFeaturedLoans('eyebrow', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headline Line 1
              </label>
              <input
                type="text"
                value={settings.featuredLoans.headlineLine1}
                onChange={(e) => updateFeaturedLoans('headlineLine1', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headline Line 2 <span className="text-gray-400">(highlighted color)</span>
              </label>
              <input
                type="text"
                value={settings.featuredLoans.headlineLine2}
                onChange={(e) => updateFeaturedLoans('headlineLine2', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: The actual loan cards are managed in the <a href="/admin/loans" className="text-blue-600 hover:underline">Featured Loans</a> section.
            </p>
          </div>
        </div>
      )}

      {/* Down Payment Assistance Card */}
      {activeSection === 'dpa' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Down Payment Assistance Card</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dpa.enabled}
                onChange={(e) => updateDpa('enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show this card</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headline
              </label>
              <textarea
                value={settings.dpa.headline}
                onChange={(e) => updateDpa('headline', e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feature 1
              </label>
              <input
                type="text"
                value={settings.dpa.feature1}
                onChange={(e) => updateDpa('feature1', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feature 2
              </label>
              <input
                type="text"
                value={settings.dpa.feature2}
                onChange={(e) => updateDpa('feature2', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feature 3
              </label>
              <input
                type="text"
                value={settings.dpa.feature3}
                onChange={(e) => updateDpa('feature3', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={settings.dpa.buttonText}
                  onChange={(e) => updateDpa('buttonText', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button URL
                </label>
                <input
                  type="text"
                  value={settings.dpa.buttonUrl}
                  onChange={(e) => updateDpa('buttonUrl', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reassurance Text
              </label>
              <input
                type="text"
                value={settings.dpa.reassuranceText}
                onChange={(e) => updateDpa('reassuranceText', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tools & Calculators Section */}
      {activeSection === 'tools' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Tools & Calculators Section</h2>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eyebrow Text
                </label>
                <input
                  type="text"
                  value={settings.tools.eyebrow}
                  onChange={(e) => updateTools('eyebrow', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={settings.tools.headlineLine1}
                  onChange={(e) => updateTools('headlineLine1', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headline Line 2 <span className="text-gray-400">(highlighted color)</span>
                </label>
                <input
                  type="text"
                  value={settings.tools.headlineLine2}
                  onChange={(e) => updateTools('headlineLine2', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">Tool Cards</h3>
                <button
                  type="button"
                  onClick={addToolCard}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Card
                </button>
              </div>
              <div className="space-y-6">
                {settings.tools.cards.map((card, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg relative">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Card {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeToolCard(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove card"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Title</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateToolCard(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Description</label>
                        <input
                          type="text"
                          value={card.description}
                          onChange={(e) => updateToolCard(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Icon (emoji)</label>
                        <input
                          type="text"
                          value={card.icon}
                          onChange={(e) => updateToolCard(index, 'icon', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">URL</label>
                        <input
                          type="text"
                          value={card.url}
                          onChange={(e) => updateToolCard(index, 'url', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {settings.tools.cards.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No tool cards yet. Click &quot;Add Card&quot; to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* More Loan Options Card */}
      {activeSection === 'moreLoans' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">More Loan Options Card</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.moreLoans.enabled}
                onChange={(e) => updateMoreLoans('enabled', e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show this card</span>
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text
              </label>
              <input
                type="text"
                value={settings.moreLoans.text}
                onChange={(e) => updateMoreLoans('text', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={settings.moreLoans.linkText}
                  onChange={(e) => updateMoreLoans('linkText', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link URL
                </label>
                <input
                  type="text"
                  value={settings.moreLoans.linkUrl}
                  onChange={(e) => updateMoreLoans('linkUrl', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Articles Section */}
      {activeSection === 'articles' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Latest Articles Section</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={settings.articles.title}
                onChange={(e) => updateArticles('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={settings.articles.subtitle}
                onChange={(e) => updateArticles('subtitle', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: The actual articles are managed in the <a href="/admin/blog" className="text-blue-600 hover:underline">Blog</a> section.
            </p>
          </div>
        </div>
      )}

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
