'use client';

import { useEffect, useState } from 'react';

interface WhyChooseUsItem {
  title: string;
  description: string;
  icon: string;
}

interface WhyChooseUsSection {
  id: string;
  title: string;
  subtitle: string;
  items: WhyChooseUsItem[];
}

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
    widgetType: 'ratings' | 'badge';
    widgetEnabled: boolean;
    photo1Url: string;
    photo2Url: string;
    photo3Url: string;
    badgeText: string;
    badgeSubtext: string;
    mobileGradientEnabled: boolean;
  };
  featuredLoans: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
  };
  whyChooseUs: {
    eyebrow: string;
    headline: string;
    highlightedText: string;
    description: string;
    sections: WhyChooseUsSection[];
    mission: string;
    vision: string;
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
    backgroundStyle: 'blue' | 'grey';
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
    style: 'red' | 'blue' | 'grey';
  };
  articles: {
    title: string;
    subtitle: string;
  };
  directoryBanner: {
    enabled: boolean;
    text: string;
    linkText: string;
    linkUrl: string;
  };
  process: {
    enabled: boolean;
    eyebrow: string;
    headline: string;
    subheadline: string;
    steps: { title: string; description: string }[];
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
    widgetType: 'badge',
    widgetEnabled: true,
    photo1Url: '',
    photo2Url: '',
    photo3Url: '',
    badgeText: 'Same-Day Pre-Approvals',
    badgeSubtext: 'Fast & hassle-free',
    mobileGradientEnabled: true,
  },
  featuredLoans: {
    eyebrow: 'Featured Loans',
    headlineLine1: 'From first home to refinance,',
    headlineLine2: "we're here for you.",
  },
  whyChooseUs: {
    eyebrow: 'Why Choose Us',
    headline: 'The',
    highlightedText: 'American Mortgage',
    description: 'Working with us means you get something retail lenders cannot offer: a personal advocate with access to dozens of loan programs and the best wholesale lenders in the country.',
    sections: [
      {
        id: 'broker',
        title: 'The Broker Advantage',
        subtitle: 'Why working with a broker works better for you',
        items: [
          { title: 'More options, not one bank', description: 'Retail lenders are limited to their own products. As a broker, we shop across many lenders so you get the loan that truly fits your goals.', icon: 'options' },
          { title: 'Better pricing', description: 'We work with wholesale lenders that compete for your business every day. That usually means better rates and lower costs compared to a retail branch.', icon: 'pricing' },
          { title: 'Faster answers and faster closings', description: 'We use streamlined systems from top lenders, which means rapid approvals, same-day turn times in many cases, and a smoother experience from start to finish.', icon: 'speed' },
          { title: 'Personal guidance from a local expert', description: 'You work directly with a loan expert who knows Arkansas, knows your market, and has the resources to give you fast support whenever you need it.', icon: 'local' },
          { title: 'Advice based on you, not a sales quota', description: 'Our only job is to help you make the best financial decision for your situation. We focus on your long-term success, not corporate sales targets.', icon: 'advice' },
        ],
      },
      {
        id: 'apart',
        title: 'What Sets Us Apart',
        subtitle: 'Our commitment to your success',
        items: [
          { title: 'Relationship-driven, never transactional', description: 'Your loan is not a one-time file. We stay connected, guide you through future decisions, and help you build a long-term financial plan.', icon: 'relationship' },
          { title: 'Clear answers and straightforward guidance', description: 'We explain your options, give real recommendations, and help you understand what is best for your goals.', icon: 'clarity' },
          { title: 'Local presence with national resources', description: 'Based in Arkansas but connected to the largest wholesale lenders in the country. Local access with national strength.', icon: 'network' },
          { title: 'Responsive, world-class support', description: 'Fast communication, quick updates, and a dedicated team that prioritizes your needs. No waiting days for answers.', icon: 'support' },
          { title: 'Streamlined pre-approval process', description: 'Modern technology that eliminates delays and delivers a smooth, simple experience from application to closing.', icon: 'smart' },
        ],
      },
    ],
    mission: 'To deliver a mortgage process that is fast, simple, and completely centered around your goals. We combine local care with national-level resources so every Arkansas buyer gets the guidance they deserve.',
    vision: 'To become the most trusted mortgage partner in Arkansas by building long-term relationships, providing real financial clarity, and giving every homeowner the confidence to move forward with the best loan for their future.',
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
    backgroundStyle: 'blue',
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
    style: 'red',
  },
  articles: {
    title: 'Latest Articles',
    subtitle: 'Tips and guides for homebuyers',
  },
  directoryBanner: {
    enabled: true,
    text: 'Need a trusted real estate professional?',
    linkText: 'Browse our directory',
    linkUrl: '/directory',
  },
  process: {
    enabled: true,
    eyebrow: 'How It Works',
    headline: 'Your Path to Homeownership',
    subheadline: 'We keep you informed at every step. No surprises, no confusion, just a clear path from pre-approval to closing day.',
    steps: [
      { title: 'Get Pre-Approved', description: 'Know your budget and shop with confidence. A strong pre-approval makes your offer stand out.' },
      { title: 'Find Your Home', description: 'Once you are under contract, we order the appraisal and start building your loan file.' },
      { title: 'Loan Processing', description: 'We handle the paperwork, verify your documents, and guide your file through underwriting.' },
      { title: 'Close and Get Keys', description: 'Sign your final documents and walk away with the keys to your new home.' },
    ],
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
            whyChooseUs: {
              ...defaultSettings.whyChooseUs,
              ...result.data.whyChooseUs,
              sections: result.data.whyChooseUs?.sections?.map((section: any, i: number) => ({
                ...defaultSettings.whyChooseUs.sections[i],
                ...section,
                items: section.items || defaultSettings.whyChooseUs.sections[i]?.items || [],
              })) || defaultSettings.whyChooseUs.sections,
            },
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
            directoryBanner: { ...defaultSettings.directoryBanner, ...result.data.directoryBanner },
            process: {
              ...defaultSettings.process,
              ...result.data.process,
              steps: result.data.process?.steps || defaultSettings.process.steps,
            },
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

  function updateWhyChooseUs(field: keyof Omit<HomepageSettings['whyChooseUs'], 'sections'>, value: string) {
    setSettings(prev => ({ ...prev, whyChooseUs: { ...prev.whyChooseUs, [field]: value } }));
  }

  function updateWhyChooseUsSection(sectionIndex: number, field: 'title' | 'subtitle', value: string) {
    setSettings(prev => ({
      ...prev,
      whyChooseUs: {
        ...prev.whyChooseUs,
        sections: prev.whyChooseUs.sections.map((section, i) =>
          i === sectionIndex ? { ...section, [field]: value } : section
        ),
      },
    }));
  }

  function updateWhyChooseUsItem(sectionIndex: number, itemIndex: number, field: 'title' | 'description' | 'icon', value: string) {
    setSettings(prev => ({
      ...prev,
      whyChooseUs: {
        ...prev.whyChooseUs,
        sections: prev.whyChooseUs.sections.map((section, si) =>
          si === sectionIndex
            ? {
                ...section,
                items: section.items.map((item, ii) =>
                  ii === itemIndex ? { ...item, [field]: value } : item
                ),
              }
            : section
        ),
      },
    }));
  }

  function addWhyChooseUsItem(sectionIndex: number) {
    setSettings(prev => ({
      ...prev,
      whyChooseUs: {
        ...prev.whyChooseUs,
        sections: prev.whyChooseUs.sections.map((section, i) =>
          i === sectionIndex
            ? { ...section, items: [...section.items, { title: '', description: '', icon: 'options' }] }
            : section
        ),
      },
    }));
  }

  function removeWhyChooseUsItem(sectionIndex: number, itemIndex: number) {
    setSettings(prev => ({
      ...prev,
      whyChooseUs: {
        ...prev.whyChooseUs,
        sections: prev.whyChooseUs.sections.map((section, si) =>
          si === sectionIndex
            ? { ...section, items: section.items.filter((_, ii) => ii !== itemIndex) }
            : section
        ),
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

  const sections = [
    { id: 'hero', label: 'Hero Section' },
    { id: 'whyChooseUs', label: 'Why Choose Us' },
    { id: 'process', label: 'How It Works' },
    { id: 'featuredLoans', label: 'Featured Loans' },
    { id: 'directoryBanner', label: 'Directory Banner' },
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
          <div className="space-y-6">
            {/* Widget Settings */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Hero Widget (above eyebrow)</h3>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="widgetEnabled"
                  checked={settings.hero.widgetEnabled}
                  onChange={(e) => updateHero('widgetEnabled', e.target.checked as any)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="widgetEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show widget
                </label>
              </div>

              {settings.hero.widgetEnabled && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Widget Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="widgetType"
                          value="badge"
                          checked={settings.hero.widgetType === 'badge'}
                          onChange={() => updateHero('widgetType', 'badge' as any)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Badge (gold checkmark)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="widgetType"
                          value="ratings"
                          checked={settings.hero.widgetType === 'ratings'}
                          onChange={() => updateHero('widgetType', 'ratings' as any)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Ratings (photos + stars)</span>
                      </label>
                    </div>
                  </div>

                  {/* Badge Widget Settings */}
                  {settings.hero.widgetType === 'badge' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Badge Text
                        </label>
                        <input
                          type="text"
                          value={settings.hero.badgeText}
                          onChange={(e) => updateHero('badgeText', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          placeholder="Same-Day Pre-Approvals"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Badge Subtext
                        </label>
                        <input
                          type="text"
                          value={settings.hero.badgeSubtext}
                          onChange={(e) => updateHero('badgeSubtext', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          placeholder="Fast & hassle-free"
                        />
                      </div>
                    </div>
                  )}

                  {/* Ratings Widget Settings */}
                  {settings.hero.widgetType === 'ratings' && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Photo 1 URL
                          </label>
                          <input
                            type="text"
                            value={settings.hero.photo1Url}
                            onChange={(e) => updateHero('photo1Url', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            placeholder="/cms-media/photo1.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Photo 2 URL
                          </label>
                          <input
                            type="text"
                            value={settings.hero.photo2Url}
                            onChange={(e) => updateHero('photo2Url', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            placeholder="/cms-media/photo2.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Photo 3 URL
                          </label>
                          <input
                            type="text"
                            value={settings.hero.photo3Url}
                            onChange={(e) => updateHero('photo3Url', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            placeholder="/cms-media/photo3.jpg"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Upload photos via Media, then paste the URLs here</p>
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
                            placeholder="98%"
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
                            placeholder="would recommend"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Rest of Hero Settings */}
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

            {/* Mobile Gradient Toggle */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Mobile Settings</h3>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="mobileGradientEnabled"
                  checked={settings.hero.mobileGradientEnabled}
                  onChange={(e) => updateHero('mobileGradientEnabled', e.target.checked as any)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="mobileGradientEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable gradient background on mobile
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                When enabled, the hero section shows a navy gradient on mobile. When disabled, it shows a solid navy background.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Why Choose Us Section */}
      {activeSection === 'whyChooseUs' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Why Choose Us Section</h2>
          <div className="space-y-6">
            {/* Header Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eyebrow Text
                </label>
                <input
                  type="text"
                  value={settings.whyChooseUs.eyebrow}
                  onChange={(e) => updateWhyChooseUs('eyebrow', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Why Choose Us"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Headline (before highlighted)
                  </label>
                  <input
                    type="text"
                    value={settings.whyChooseUs.headline}
                    onChange={(e) => updateWhyChooseUs('headline', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="The"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Highlighted Text
                  </label>
                  <input
                    type="text"
                    value={settings.whyChooseUs.highlightedText}
                    onChange={(e) => updateWhyChooseUs('highlightedText', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    placeholder="American Mortgage"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.whyChooseUs.description}
                  onChange={(e) => updateWhyChooseUs('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                  placeholder="Working with us means..."
                />
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Accordion Sections</h3>
              {settings.whyChooseUs.sections.map((section, sectionIndex) => (
                <div key={section.id} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateWhyChooseUsSection(sectionIndex, 'title', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Section Subtitle
                      </label>
                      <input
                        type="text"
                        value={section.subtitle}
                        onChange={(e) => updateWhyChooseUsSection(sectionIndex, 'subtitle', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</h4>
                      <button
                        type="button"
                        onClick={() => addWhyChooseUsItem(sectionIndex)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                      </button>
                    </div>
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Item {itemIndex + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeWhyChooseUsItem(sectionIndex, itemIndex)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Title</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateWhyChooseUsItem(sectionIndex, itemIndex, 'title', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateWhyChooseUsItem(sectionIndex, itemIndex, 'description', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Icon (options, pricing, speed, local, advice, relationship, clarity, network, support, smart)</label>
                          <select
                            value={item.icon}
                            onChange={(e) => updateWhyChooseUsItem(sectionIndex, itemIndex, 'icon', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:text-white"
                          >
                            <option value="options">Options (Grid)</option>
                            <option value="pricing">Pricing (Dollar)</option>
                            <option value="speed">Speed (Lightning)</option>
                            <option value="local">Local (Map Pin)</option>
                            <option value="advice">Advice (Shield)</option>
                            <option value="relationship">Relationship (Heart)</option>
                            <option value="clarity">Clarity (Lightbulb)</option>
                            <option value="network">Network (Globe)</option>
                            <option value="support">Support (Chat)</option>
                            <option value="smart">Smart (Sparkles)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Mission & Vision */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Mission & Vision</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Our Mission
                  </label>
                  <textarea
                    value={settings.whyChooseUs.mission}
                    onChange={(e) => updateWhyChooseUs('mission', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Our Vision
                  </label>
                  <textarea
                    value={settings.whyChooseUs.vision}
                    onChange={(e) => updateWhyChooseUs('vision', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Style
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all ${settings.dpa.backgroundStyle === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="dpaBackgroundStyle"
                    value="blue"
                    checked={settings.dpa.backgroundStyle === 'blue'}
                    onChange={(e) => updateDpa('backgroundStyle', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#181F53]" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Navy Blue</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Classic navy with gold accents</div>
                    </div>
                  </div>
                </label>
                <label className={`flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all ${settings.dpa.backgroundStyle === 'grey' ? 'border-gray-500 bg-gray-100 dark:bg-gray-700/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="dpaBackgroundStyle"
                    value="grey"
                    checked={settings.dpa.backgroundStyle === 'grey'}
                    onChange={(e) => updateDpa('backgroundStyle', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#f3f4f6] to-[#e5e7eb] border border-gray-300" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Light Grey</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Modern light with navy accents</div>
                    </div>
                  </div>
                </label>
              </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner Style
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all ${settings.moreLoans.style === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="moreLoansStyle"
                    value="red"
                    checked={settings.moreLoans.style === 'red'}
                    onChange={(e) => updateMoreLoans('style', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#d93c37] to-[#b52d29]" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Red Gradient</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Bold red with white icon</div>
                    </div>
                  </div>
                </label>
                <label className={`flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all ${settings.moreLoans.style === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="moreLoansStyle"
                    value="blue"
                    checked={settings.moreLoans.style === 'blue'}
                    onChange={(e) => updateMoreLoans('style', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#181F53] to-[#2a3a7d]" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Blue Gradient</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Navy blue with gold icon</div>
                    </div>
                  </div>
                </label>
                <label className={`flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all ${settings.moreLoans.style === 'grey' ? 'border-gray-500 bg-gray-100 dark:bg-gray-700/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="moreLoansStyle"
                    value="grey"
                    checked={settings.moreLoans.style === 'grey'}
                    onChange={(e) => updateMoreLoans('style', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] border border-gray-300" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Grey/White</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Modern light with navy icon</div>
                    </div>
                  </div>
                </label>
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

      {/* Directory Banner Section */}
      {activeSection === 'directoryBanner' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Directory Banner</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This gold banner appears below the featured loans section, promoting the professional directory.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="directoryBannerEnabled"
                checked={settings.directoryBanner.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  directoryBanner: { ...prev.directoryBanner, enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="directoryBannerEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Directory Banner
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Banner Text
              </label>
              <input
                type="text"
                value={settings.directoryBanner.text}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  directoryBanner: { ...prev.directoryBanner, text: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Need a trusted real estate professional?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link Text
              </label>
              <input
                type="text"
                value={settings.directoryBanner.linkText}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  directoryBanner: { ...prev.directoryBanner, linkText: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Browse our directory"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link URL
              </label>
              <input
                type="text"
                value={settings.directoryBanner.linkUrl}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  directoryBanner: { ...prev.directoryBanner, linkUrl: e.target.value }
                }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="/directory"
              />
            </div>
          </div>
        </div>
      )}

      {/* How It Works / Process Section */}
      {activeSection === 'process' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">How It Works Section</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This section shows a 4-step timeline of the mortgage process.
          </p>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="processEnabled"
                checked={settings.process.enabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  process: { ...prev.process, enabled: e.target.checked }
                }))}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="processEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show How It Works Section
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eyebrow Text
                </label>
                <input
                  type="text"
                  value={settings.process.eyebrow}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    process: { ...prev.process, eyebrow: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="How It Works"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  value={settings.process.headline}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    process: { ...prev.process, headline: e.target.value }
                  }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Your Path to Homeownership"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subheadline
              </label>
              <textarea
                value={settings.process.subheadline}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  process: { ...prev.process, subheadline: e.target.value }
                }))}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="We keep you informed at every step..."
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Process Steps</h3>
              <div className="space-y-4">
                {settings.process.steps.map((step, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 3 ? 'bg-red-500' : 'bg-[#181F53]'}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Step {index + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => {
                            const newSteps = [...settings.process.steps];
                            newSteps[index] = { ...newSteps[index], title: e.target.value };
                            setSettings(prev => ({
                              ...prev,
                              process: { ...prev.process, steps: newSteps }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => {
                            const newSteps = [...settings.process.steps];
                            newSteps[index] = { ...newSteps[index], description: e.target.value };
                            setSettings(prev => ({
                              ...prev,
                              process: { ...prev.process, steps: newSteps }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
