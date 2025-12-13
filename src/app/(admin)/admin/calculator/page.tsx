'use client';

import { useEffect, useState } from 'react';

interface LoanType {
  name: string;
  label: string;
  minDownPayment: number;
  maxLoanAmount: number; // 0 means no limit
  enabled: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  enabled: boolean;
}

interface CalculatorSettings {
  loanTypes: LoanType[];
  propertyInsuranceRate: number;
  propertyTaxRate: number;
  homesteadTaxCredit: number;
  minPurchasePrice: number;
  maxPurchasePrice: number;
  sliderMaxPurchasePrice: number;
  defaultPurchasePrice: number;
  minInterestRate: number;
  maxInterestRate: number;
  defaultInterestRate: number;
  ctaTitle: string;
  ctaText: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  ctaButtonColor: string;
  ctaButtonTextColor: string;
  pageTitle: string;
  sliderThumbSize: number;
  sliderTrackHeight: number;
  sliderColor: string;
  // MIP/PMI rates
  fhaMipRateHigh: number;
  fhaMipRateLow: number;
  fhaMipLtvThreshold: number;
  conventionalPmiRate: number;
  pmiLtvCutoff: number;
  // Labels
  resultsTitle: string;
  resultsSubtext: string;
  piLabel: string;
  piSubtext: string;
  insuranceLabel: string;
  insuranceSubtext: string;
  taxesLabel: string;
  taxesSubtext: string;
  mipLabel: string;
  mipSubtext: string;
  pmiLabel: string;
  pmiSubtext: string;
  // Disclaimer
  disclaimerText: string;
  disclaimerCollapsible: boolean;
  // CTA settings
  ctaTextEnabled: boolean;
  // Quote settings
  quotePhoneRequired: boolean;
  quoteEmailRequired: boolean;
  // Download Quote Button
  downloadQuoteButtonText: string;
  downloadQuoteButtonColor: string;
  downloadQuoteButtonFullWidth: boolean;
  quoteFormButtonColor: string;
  faqItems: FAQItem[];
}

const defaultSettings: CalculatorSettings = {
  loanTypes: [
    { name: 'FHA', label: 'FHA', minDownPayment: 3.5, maxLoanAmount: 524225, enabled: true },
    { name: 'Conventional', label: 'Conventional', minDownPayment: 3, maxLoanAmount: 806500, enabled: true },
    { name: 'USDA', label: 'USDA', minDownPayment: 0, maxLoanAmount: 0, enabled: true }, // 0 = no limit
    { name: 'VA', label: 'VA', minDownPayment: 0, maxLoanAmount: 0, enabled: true }, // 0 = no limit
    { name: 'Non-QM', label: 'Non-QM / Investor', minDownPayment: 10, maxLoanAmount: 0, enabled: true }, // 0 = no limit (jumbo)
  ],
  propertyInsuranceRate: 0.5,
  propertyTaxRate: 1.0,
  homesteadTaxCredit: 600,
  minPurchasePrice: 50000,
  maxPurchasePrice: 5000000,
  sliderMaxPurchasePrice: 1000000,
  defaultPurchasePrice: 300000,
  minInterestRate: 3.0,
  maxInterestRate: 10.0,
  defaultInterestRate: 6.5,
  ctaTitle: 'Take the First Step Towards Your New Home',
  ctaText: 'With our simple home loan calculator, you can estimate your monthly payments and start your journey towards owning a new home.',
  ctaButtonText: 'Get Pre-Approved Now',
  ctaButtonUrl: '/apply',
  ctaButtonColor: '#181F53',
  ctaButtonTextColor: '#ffffff',
  pageTitle: 'Home Loan Calculator',
  sliderThumbSize: 60,
  sliderTrackHeight: 20,
  sliderColor: '#181F53',
  // MIP/PMI rates
  fhaMipRateHigh: 0.55,
  fhaMipRateLow: 0.50,
  fhaMipLtvThreshold: 95.0,
  conventionalPmiRate: 0.75,
  pmiLtvCutoff: 80.0,
  // Labels
  resultsTitle: 'Estimated Monthly Payment',
  resultsSubtext: 'Principal, interest, taxes, and insurance based on your inputs.',
  piLabel: 'Principal & Interest',
  piSubtext: 'Based on {rate}% interest rate',
  insuranceLabel: 'Property Insurance',
  insuranceSubtext: 'Estimated monthly insurance ({rate}% annually)',
  taxesLabel: 'Property Taxes',
  taxesSubtext: 'Estimated monthly taxes ({rate}% annually)',
  mipLabel: 'FHA Mortgage Insurance (MIP)',
  mipSubtext: 'Required for FHA loans ({rate}% annually)',
  pmiLabel: 'Private Mortgage Insurance (PMI)',
  pmiSubtext: 'Required until 20% equity ({rate}% annually)',
  // Disclaimer
  disclaimerText: 'This calculator provides estimates for informational purposes only and does not constitute a loan offer or commitment to lend. Actual rates, payments, and terms may vary based on your credit profile, property location, loan program, and other factors. Property taxes and insurance amounts are estimates based on average rates and may differ from actual costs. Mortgage insurance (MIP/PMI) calculations are approximations. Contact us for a personalized quote and accurate figures. All loans subject to credit approval.',
  disclaimerCollapsible: true,
  // CTA settings
  ctaTextEnabled: true,
  // Quote settings
  quotePhoneRequired: true,
  quoteEmailRequired: true,
  // Download Quote Button
  downloadQuoteButtonText: 'Download Quote',
  downloadQuoteButtonColor: '#DC2626',
  downloadQuoteButtonFullWidth: true,
  quoteFormButtonColor: '#181F53',
  faqItems: [
    {
      id: '1',
      question: 'What is the FHA loan limit for 2025?',
      answer: 'The 2025 FHA loan limit for single-family homes is $524,225 in most areas. This is the maximum loan amount you can borrow with an FHA loan. Higher limits apply in high-cost areas.',
      enabled: true,
    },
    {
      id: '2',
      question: 'What is MIP (Mortgage Insurance Premium)?',
      answer: 'MIP is mortgage insurance required on all FHA loans. It includes an upfront premium of 1.75% of the loan amount (usually rolled into the loan) and an annual premium of 0.55% paid monthly. If your down payment is less than 10%, MIP lasts the life of the loan. With 10% or more down, MIP can be removed after 11 years.',
      enabled: true,
    },
    {
      id: '3',
      question: 'What is PMI (Private Mortgage Insurance)?',
      answer: 'PMI is insurance required on conventional loans when your down payment is less than 20%. Unlike FHA MIP, PMI can be canceled once you reach 20% equity in your home, and it automatically cancels at 22% equity. PMI rates typically range from 0.5% to 1% of the loan amount annually.',
      enabled: true,
    },
    {
      id: '4',
      question: 'What is the difference between MIP and PMI?',
      answer: 'MIP is for FHA loans and typically lasts the life of the loan (unless you put 10%+ down). PMI is for conventional loans and can be removed once you have 20% equity. PMI rates vary based on credit score and down payment, while MIP rates are standardized by the FHA.',
      enabled: true,
    },
    {
      id: '5',
      question: 'What is the minimum down payment for each loan type?',
      answer: 'FHA loans require 3.5% down with a credit score of 580+. Conventional loans can go as low as 3% down. VA and USDA loans offer 0% down payment options for eligible borrowers. Non-QM/Jumbo loans typically require 10-20% down.',
      enabled: true,
    },
    {
      id: '6',
      question: 'What is a conventional loan?',
      answer: 'A conventional loan is a mortgage not backed by a government agency. The 2025 conforming loan limit is $806,500 for most areas. Conventional loans typically require higher credit scores but offer more flexibility and the ability to remove PMI once you reach 20% equity.',
      enabled: true,
    },
    {
      id: '7',
      question: 'What is a jumbo loan?',
      answer: 'A jumbo loan exceeds the conforming loan limit ($806,500 in 2025 for most areas). These loans typically require larger down payments (10-20%), higher credit scores, and may have slightly higher interest rates. They\'re used for luxury properties or homes in high-cost markets.',
      enabled: true,
    },
    {
      id: '8',
      question: 'How is my monthly mortgage payment calculated?',
      answer: 'Your monthly payment includes Principal & Interest (P&I), property taxes, homeowners insurance, and mortgage insurance (if applicable). P&I is calculated using your loan amount, interest rate, and loan term. This calculator estimates all components to give you a total monthly payment.',
      enabled: true,
    },
    {
      id: '9',
      question: 'Can I remove mortgage insurance from my loan?',
      answer: 'For conventional loans, PMI automatically cancels at 22% equity or can be requested at 20% equity. For FHA loans, the only way to remove MIP (if you put less than 10% down) is to refinance into a conventional loan once you have sufficient equity. VA loans don\'t have monthly mortgage insurance.',
      enabled: true,
    },
    {
      id: '10',
      question: 'What credit score do I need for a mortgage?',
      answer: 'FHA loans require a minimum 580 credit score for 3.5% down (500-579 requires 10% down). Conventional loans typically need 620+, with better rates for 740+. VA loans generally require 620+. Higher credit scores qualify you for better interest rates across all loan types.',
      enabled: true,
    },
  ],
};

type SectionType = 'loanTypes' | 'formulas' | 'mipPmi' | 'ranges' | 'styling' | 'labels' | 'cta' | 'quoteSettings' | 'faq' | 'disclaimer';

export default function CalculatorAdminPage() {
  const [settings, setSettings] = useState<CalculatorSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('loanTypes');

  // New loan type form
  const [newLoanName, setNewLoanName] = useState('');
  const [newLoanLabel, setNewLoanLabel] = useState('');
  const [newLoanMinDown, setNewLoanMinDown] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/calculator', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          // Merge saved loan types with defaults to include new fields like maxLoanAmount
          const savedLoanTypes = result.data.loanTypes || [];
          const mergedLoanTypes = defaultSettings.loanTypes.map(defaultLt => {
            const savedLt = savedLoanTypes.find((s: LoanType) => s.name === defaultLt.name);
            if (savedLt) {
              return { ...defaultLt, ...savedLt };
            }
            return defaultLt;
          });
          // Add any custom loan types from saved settings that aren't in defaults
          savedLoanTypes.forEach((savedLt: LoanType) => {
            if (!defaultSettings.loanTypes.find(d => d.name === savedLt.name)) {
              mergedLoanTypes.push({ ...savedLt, maxLoanAmount: savedLt.maxLoanAmount || 0 });
            }
          });

          setSettings({
            ...defaultSettings,
            ...result.data,
            loanTypes: mergedLoanTypes,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/settings/calculator', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleAddLoanType() {
    if (!newLoanName.trim() || !newLoanLabel.trim()) {
      setError('Please fill in loan name and label');
      return;
    }

    const minDown = parseFloat(newLoanMinDown) || 0;

    setSettings(prev => ({
      ...prev,
      loanTypes: [
        ...prev.loanTypes,
        {
          name: newLoanName.trim(),
          label: newLoanLabel.trim(),
          minDownPayment: minDown,
          maxLoanAmount: 0,
          enabled: true,
        },
      ],
    }));

    setNewLoanName('');
    setNewLoanLabel('');
    setNewLoanMinDown('');
    setError(null);
  }

  function handleRemoveLoanType(index: number) {
    setSettings(prev => ({
      ...prev,
      loanTypes: prev.loanTypes.filter((_, i) => i !== index),
    }));
  }

  function handleUpdateLoanType(index: number, field: keyof LoanType, value: string | number | boolean) {
    setSettings(prev => ({
      ...prev,
      loanTypes: prev.loanTypes.map((lt, i) =>
        i === index ? { ...lt, [field]: value } : lt
      ),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sections = [
    { id: 'loanTypes', label: 'Loan Types' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'mipPmi', label: 'MIP/PMI' },
    { id: 'ranges', label: 'Ranges' },
    { id: 'styling', label: 'Styling' },
    { id: 'labels', label: 'Labels' },
    { id: 'cta', label: 'CTA' },
    { id: 'quoteSettings', label: 'Quote Form' },
    { id: 'faq', label: 'FAQ' },
    { id: 'disclaimer', label: 'Disclaimer' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculator Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure loan types, MIP/PMI, formulas, and labels
          </p>
        </div>
        <a
          href="/calculator"
          target="_blank"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View Calculator &rarr;
        </a>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as SectionType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Loan Types Section */}
      {activeSection === 'loanTypes' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Types</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Manage the loan types available in the calculator dropdown.
          </p>

          <div className="space-y-3 mb-6">
            {settings.loanTypes.map((loanType, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <input
                  type="checkbox"
                  checked={loanType.enabled}
                  onChange={(e) => handleUpdateLoanType(index, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={loanType.name}
                      onChange={(e) => handleUpdateLoanType(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Label</label>
                    <input
                      type="text"
                      value={loanType.label}
                      onChange={(e) => handleUpdateLoanType(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min Down %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={loanType.minDownPayment}
                      onChange={(e) => handleUpdateLoanType(index, 'minDownPayment', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Loan $ (0=none)</label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={loanType.maxLoanAmount || 0}
                      onChange={(e) => handleUpdateLoanType(index, 'maxLoanAmount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveLoanType(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Add New Loan Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                value={newLoanName}
                onChange={(e) => setNewLoanName(e.target.value)}
                placeholder="Name (e.g., Jumbo)"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                value={newLoanLabel}
                onChange={(e) => setNewLoanLabel(e.target.value)}
                placeholder="Label (e.g., Jumbo Loan)"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                value={newLoanMinDown}
                onChange={(e) => setNewLoanMinDown(e.target.value)}
                placeholder="Min Down % (e.g., 20)"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAddLoanType}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulas Section */}
      {activeSection === 'formulas' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Formula Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Annual percentages of purchase price, divided by 12 for monthly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Insurance Rate (% per year)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.propertyInsuranceRate}
                onChange={(e) => setSettings(prev => ({ ...prev, propertyInsuranceRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                $300k × {settings.propertyInsuranceRate}% ÷ 12 = ${((300000 * settings.propertyInsuranceRate / 100) / 12).toFixed(2)}/mo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Tax Rate (% per year)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.propertyTaxRate}
                onChange={(e) => setSettings(prev => ({ ...prev, propertyTaxRate: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                $300k × {settings.propertyTaxRate}% ÷ 12 = ${((300000 * settings.propertyTaxRate / 100) / 12).toFixed(2)}/mo
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Arkansas Homestead Tax Credit</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Arkansas provides a statewide homestead property tax credit for owner-occupied primary residences.
              This amount is deducted from the annual property taxes before calculating the monthly amount.
            </p>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Annual Homestead Tax Credit ($)
              </label>
              <input
                type="number"
                step="1"
                value={settings.homesteadTaxCredit}
                onChange={(e) => setSettings(prev => ({ ...prev, homesteadTaxCredit: parseFloat(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                With credit: ($300k × {settings.propertyTaxRate}% - ${settings.homesteadTaxCredit}) ÷ 12 = ${(((300000 * settings.propertyTaxRate / 100) - settings.homesteadTaxCredit) / 12).toFixed(2)}/mo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MIP/PMI Section */}
      {activeSection === 'mipPmi' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Mortgage Insurance Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Configure FHA MIP and Conventional PMI rates.
          </p>

          {/* FHA MIP */}
          <div className="mb-8">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">FHA Mortgage Insurance Premium (MIP)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MIP Rate - High LTV (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.fhaMipRateHigh}
                  onChange={(e) => setSettings(prev => ({ ...prev, fhaMipRateHigh: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">When LTV &gt; threshold</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MIP Rate - Low LTV (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.fhaMipRateLow}
                  onChange={(e) => setSettings(prev => ({ ...prev, fhaMipRateLow: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">When LTV ≤ threshold</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LTV Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.fhaMipLtvThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, fhaMipLtvThreshold: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 95%</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>FHA MIP applies to all FHA loans.</strong> Rate is {settings.fhaMipRateHigh}% when LTV &gt; {settings.fhaMipLtvThreshold}%,
                otherwise {settings.fhaMipRateLow}%.
              </p>
            </div>
          </div>

          {/* Conventional PMI */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Conventional Private Mortgage Insurance (PMI)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PMI Rate (% per year)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.conventionalPmiRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, conventionalPmiRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Typical range: 0.5% - 1.5%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PMI Required When LTV Above (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.pmiLtvCutoff}
                  onChange={(e) => setSettings(prev => ({ ...prev, pmiLtvCutoff: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Standard: 80% (20% down = no PMI)</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">
                <strong>PMI applies to Conventional loans only</strong> when down payment is less than {100 - settings.pmiLtvCutoff}%
                (LTV &gt; {settings.pmiLtvCutoff}%).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ranges Section */}
      {activeSection === 'ranges' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Range Settings</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Purchase Price</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Minimum ($)</label>
                  <input
                    type="number"
                    value={settings.minPurchasePrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, minPurchasePrice: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Max (typed input)</label>
                  <input
                    type="number"
                    value={settings.maxPurchasePrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxPurchasePrice: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Max (slider)</label>
                  <input
                    type="number"
                    value={settings.sliderMaxPurchasePrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, sliderMaxPurchasePrice: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Default ($)</label>
                  <input
                    type="number"
                    value={settings.defaultPurchasePrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultPurchasePrice: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Interest Rate</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Minimum (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.minInterestRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, minInterestRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Maximum (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.maxInterestRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxInterestRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Default (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.defaultInterestRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultInterestRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styling Section */}
      {activeSection === 'styling' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slider Styling</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slider Circle Size: {settings.sliderThumbSize}px
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={settings.sliderThumbSize}
                onChange={(e) => setSettings(prev => ({ ...prev, sliderThumbSize: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Track Height: {settings.sliderTrackHeight}px
              </label>
              <input
                type="range"
                min="8"
                max="40"
                value={settings.sliderTrackHeight}
                onChange={(e) => setSettings(prev => ({ ...prev, sliderTrackHeight: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slider Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.sliderColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, sliderColor: e.target.value }))}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.sliderColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, sliderColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  placeholder="#181F53"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <div className="relative py-4">
                <div
                  className="w-full rounded-full"
                  style={{
                    height: `${settings.sliderTrackHeight}px`,
                    background: `linear-gradient(to right, ${settings.sliderColor} 50%, #E5E5E5 50%)`,
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white flex items-center justify-center"
                  style={{
                    width: `${settings.sliderThumbSize}px`,
                    height: `${settings.sliderThumbSize}px`,
                    border: `2px solid ${settings.sliderColor}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-1 bg-gray-300 rounded" style={{ height: `${settings.sliderThumbSize * 0.4}px` }} />
                    <div className="w-1 bg-gray-300 rounded" style={{ height: `${settings.sliderThumbSize * 0.4}px` }} />
                    <div className="w-1 bg-gray-300 rounded" style={{ height: `${settings.sliderThumbSize * 0.4}px` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labels Section */}
      {activeSection === 'labels' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results Labels</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Customize the text displayed in the calculator results. Use {'{rate}'} as a placeholder for dynamic values.
          </p>

          <div className="space-y-6">
            {/* Results Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Results Title</label>
                <input
                  type="text"
                  value={settings.resultsTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, resultsTitle: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Results Subtext</label>
                <input
                  type="text"
                  value={settings.resultsSubtext}
                  onChange={(e) => setSettings(prev => ({ ...prev, resultsSubtext: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* P&I */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Principal & Interest</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={settings.piLabel}
                    onChange={(e) => setSettings(prev => ({ ...prev, piLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subtext (use {'{rate}'} for interest rate)</label>
                  <input
                    type="text"
                    value={settings.piSubtext}
                    onChange={(e) => setSettings(prev => ({ ...prev, piSubtext: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Insurance */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Property Insurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={settings.insuranceLabel}
                    onChange={(e) => setSettings(prev => ({ ...prev, insuranceLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subtext</label>
                  <input
                    type="text"
                    value={settings.insuranceSubtext}
                    onChange={(e) => setSettings(prev => ({ ...prev, insuranceSubtext: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Taxes */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Property Taxes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={settings.taxesLabel}
                    onChange={(e) => setSettings(prev => ({ ...prev, taxesLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subtext</label>
                  <input
                    type="text"
                    value={settings.taxesSubtext}
                    onChange={(e) => setSettings(prev => ({ ...prev, taxesSubtext: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* MIP */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">FHA MIP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={settings.mipLabel}
                    onChange={(e) => setSettings(prev => ({ ...prev, mipLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subtext</label>
                  <input
                    type="text"
                    value={settings.mipSubtext}
                    onChange={(e) => setSettings(prev => ({ ...prev, mipSubtext: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* PMI */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Conventional PMI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Label</label>
                  <input
                    type="text"
                    value={settings.pmiLabel}
                    onChange={(e) => setSettings(prev => ({ ...prev, pmiLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subtext</label>
                  <input
                    type="text"
                    value={settings.pmiSubtext}
                    onChange={(e) => setSettings(prev => ({ ...prev, pmiSubtext: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      {activeSection === 'cta' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">CTA Section</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Title</label>
              <input
                type="text"
                value={settings.pageTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, pageTitle: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* CTA Text Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Show CTA Title &amp; Text</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When disabled, only the button will show in the CTA section.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ctaTextEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, ctaTextEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CTA Title</label>
              <input
                type="text"
                value={settings.ctaTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, ctaTitle: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CTA Text</label>
              <textarea
                value={settings.ctaText}
                onChange={(e) => setSettings(prev => ({ ...prev, ctaText: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Text</label>
                <input
                  type="text"
                  value={settings.ctaButtonText}
                  onChange={(e) => setSettings(prev => ({ ...prev, ctaButtonText: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button URL</label>
                <input
                  type="text"
                  value={settings.ctaButtonUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, ctaButtonUrl: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Button Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={settings.ctaButtonColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, ctaButtonColor: e.target.value }))}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.ctaButtonColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, ctaButtonColor: e.target.value }))}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={settings.ctaButtonTextColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, ctaButtonTextColor: e.target.value }))}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.ctaButtonTextColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, ctaButtonTextColor: e.target.value }))}
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{settings.ctaTitle}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{settings.ctaText}</p>
                <span
                  className="inline-block px-6 py-3 font-semibold rounded-lg"
                  style={{ backgroundColor: settings.ctaButtonColor, color: settings.ctaButtonTextColor }}
                >
                  {settings.ctaButtonText}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Settings Section */}
      {activeSection === 'quoteSettings' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quote Form Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Configure which fields are required when users download a quote PDF.
          </p>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Phone Number Required</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When enabled, users must enter their phone number to download a quote.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.quotePhoneRequired}
                  onChange={(e) => setSettings(prev => ({ ...prev, quotePhoneRequired: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Email Required</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When enabled, users must enter their email address to download a quote.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.quoteEmailRequired}
                  onChange={(e) => setSettings(prev => ({ ...prev, quoteEmailRequired: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> First Name and Last Name are always required. View all quote requests in the{' '}
                <a href="/admin/quotes" className="underline hover:no-underline">Quote Requests</a> section.
              </p>
            </div>

            {/* Download Quote Button Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Download Quote Button</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={settings.downloadQuoteButtonText}
                    onChange={(e) => setSettings(prev => ({ ...prev, downloadQuoteButtonText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="Download Quote"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Button Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.downloadQuoteButtonColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, downloadQuoteButtonColor: e.target.value }))}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.downloadQuoteButtonColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, downloadQuoteButtonColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                      placeholder="#DC2626"
                    />
                  </div>
                </div>
              </div>

              {/* Button Width Toggle */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Button Width
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, downloadQuoteButtonFullWidth: true }))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      settings.downloadQuoteButtonFullWidth
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Full Width
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, downloadQuoteButtonFullWidth: false }))}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      !settings.downloadQuoteButtonFullWidth
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Centered (Compact)
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div style={{ textAlign: settings.downloadQuoteButtonFullWidth ? 'left' : 'center' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: settings.downloadQuoteButtonColor,
                      width: settings.downloadQuoteButtonFullWidth ? '100%' : 'auto',
                      maxWidth: settings.downloadQuoteButtonFullWidth ? '100%' : '300px',
                    }}
                    className="px-6 py-3 text-white font-semibold rounded-lg inline-flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {settings.downloadQuoteButtonText || 'Download Quote'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quote Form Modal Button Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Quote Form Submit Button</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Customize the submit button in the quote form popup modal.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Button Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.quoteFormButtonColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, quoteFormButtonColor: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.quoteFormButtonColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, quoteFormButtonColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    placeholder="#181F53"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <button
                  type="button"
                  style={{ backgroundColor: settings.quoteFormButtonColor }}
                  className="w-full px-6 py-3 text-white font-semibold rounded-lg inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Quote PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {activeSection === 'faq' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">FAQ Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Manage frequently asked questions displayed below the calculator. Drag to reorder.
          </p>

          <div className="space-y-4">
            {settings.faqItems.map((faq, index) => (
              <div
                key={faq.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => {
                        if (index > 0) {
                          const newItems = [...settings.faqItems];
                          [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
                          setSettings(prev => ({ ...prev, faqItems: newItems }));
                        }
                      }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (index < settings.faqItems.length - 1) {
                          const newItems = [...settings.faqItems];
                          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                          setSettings(prev => ({ ...prev, faqItems: newItems }));
                        }
                      }}
                      disabled={index === settings.faqItems.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="checkbox"
                    checked={faq.enabled}
                    onChange={(e) => {
                      const newItems = [...settings.faqItems];
                      newItems[index] = { ...faq, enabled: e.target.checked };
                      setSettings(prev => ({ ...prev, faqItems: newItems }));
                    }}
                    className="mt-3 w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const newItems = [...settings.faqItems];
                        newItems[index] = { ...faq, question: e.target.value };
                        setSettings(prev => ({ ...prev, faqItems: newItems }));
                      }}
                      placeholder="Question"
                      className="w-full px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    />
                    <textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newItems = [...settings.faqItems];
                        newItems[index] = { ...faq, answer: e.target.value };
                        setSettings(prev => ({ ...prev, faqItems: newItems }));
                      }}
                      placeholder="Answer"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        faqItems: prev.faqItems.filter((_, i) => i !== index),
                      }));
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              const newId = Date.now().toString();
              setSettings(prev => ({
                ...prev,
                faqItems: [
                  ...prev.faqItems,
                  { id: newId, question: '', answer: '', enabled: true },
                ],
              }));
            }}
            className="mt-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
          >
            + Add FAQ Item
          </button>
        </div>
      )}

      {/* Disclaimer Section */}
      {activeSection === 'disclaimer' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Disclaimer Text</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            This text appears at the bottom of the calculator page to inform users that the calculations are estimates.
          </p>

          {/* Display Style Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Style
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, disclaimerCollapsible: true }))}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  settings.disclaimerCollapsible
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Collapsible Dropdown
              </button>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, disclaimerCollapsible: false }))}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  !settings.disclaimerCollapsible
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Always Visible
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Disclaimer Message
            </label>
            <textarea
              value={settings.disclaimerText}
              onChange={(e) => setSettings(prev => ({ ...prev, disclaimerText: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              placeholder="Enter disclaimer text..."
            />
          </div>

          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Preview ({settings.disclaimerCollapsible ? 'Collapsible' : 'Always Visible'})</h3>
            {settings.disclaimerCollapsible ? (
              <div style={{ borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                <div style={{
                  padding: '14px 20px',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#181F53" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Disclaimer
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #181F53',
                }}
              >
                <p style={{ fontSize: '12px', color: '#666', lineHeight: '1.6', margin: 0 }}>
                  <strong style={{ color: '#333' }}>Disclaimer:</strong> {settings.disclaimerText}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
