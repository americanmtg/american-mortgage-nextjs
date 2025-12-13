'use client';

import { useEffect, useState } from 'react';

interface QuoteEmailSettings {
  subject: string;
  greeting: string;
  introText: string;
  bodyText: string;
  buttonText: string;
  showApplyButton: boolean;
  applyButtonText: string;
  closingText: string;
  signatureText: string;
  primaryColor: string;
  buttonColor: string;
}

const defaultSettings: QuoteEmailSettings = {
  subject: 'Your Loan Estimate - Quote #{quoteId}',
  greeting: 'Hi {firstName},',
  introText: 'Thank you for using our mortgage calculator! Here are the details of your personalized loan estimate:',
  bodyText: 'Ready to take the next step? Click the button below to view your full quote with additional details, or apply now to get started on your home loan journey.',
  buttonText: 'View Your Quote',
  showApplyButton: true,
  applyButtonText: 'Apply Now',
  closingText: "If you have any questions, feel free to reach out. We're here to help you every step of the way.",
  signatureText: 'Best regards,',
  primaryColor: '#0f2e71',
  buttonColor: '#0f2e71',
};

// Sample data for preview
const sampleData = {
  firstName: 'John',
  quoteId: '1234',
  loanType: 'FHA',
  purchasePrice: '$350,000',
  loanAmount: '$338,450',
  interestRate: '6.5',
  loanTerm: 30,
  totalMonthlyPayment: '$2,847.23',
  companyName: 'American Mortgage',
  companyPhone: '(870) 926-4052',
  companyEmail: 'hello@americanmtg.com',
  companyNmls: 'NMLS ID #2676687',
};

function replacePlaceholders(text: string): string {
  return text
    .replace(/{firstName}/g, sampleData.firstName)
    .replace(/{quoteId}/g, sampleData.quoteId)
    .replace(/{loanType}/g, sampleData.loanType)
    .replace(/{purchasePrice}/g, sampleData.purchasePrice)
    .replace(/{loanAmount}/g, sampleData.loanAmount)
    .replace(/{interestRate}/g, sampleData.interestRate)
    .replace(/{loanTerm}/g, String(sampleData.loanTerm))
    .replace(/{totalMonthlyPayment}/g, sampleData.totalMonthlyPayment);
}

export default function QuoteEmailPage() {
  const [settings, setSettings] = useState<QuoteEmailSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings/quote-email', { credentials: 'include' });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setSettings({ ...defaultSettings, ...result.data });
        }
      }
    } catch (err) {
      console.error('Failed to fetch quote email settings:', err);
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
      const res = await fetch('/api/settings/quote-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess('Quote email template saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quote Email Template</h1>
        <p className="text-gray-600 mt-1">Customize the email sent when you manually send a quote to customers</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Edit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Template</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject
              </label>
              <input
                type="text"
                value={settings.subject}
                onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="Your Loan Estimate - Quote #{quoteId}"
              />
              <p className="text-xs text-gray-500 mt-1">Use {'{quoteId}'} for quote number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Greeting
              </label>
              <input
                type="text"
                value={settings.greeting}
                onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="Hi {firstName},"
              />
              <p className="text-xs text-gray-500 mt-1">Use {'{firstName}'} for customer's name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Introduction Text
              </label>
              <textarea
                value={settings.introText}
                onChange={(e) => setSettings({ ...settings, introText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="Thank you for using our mortgage calculator..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Text (after quote details)
              </label>
              <textarea
                value={settings.bodyText}
                onChange={(e) => setSettings({ ...settings, bodyText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="Ready to take the next step?..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  View Quote Button Text
                </label>
                <input
                  type="text"
                  value={settings.buttonText}
                  onChange={(e) => setSettings({ ...settings, buttonText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.buttonColor}
                    onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.buttonColor}
                    onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showApplyButton}
                  onChange={(e) => setSettings({ ...settings, showApplyButton: e.target.checked })}
                  className="w-4 h-4 text-navy rounded focus:ring-navy"
                />
                <span className="text-sm font-medium text-gray-700">Show "Apply Now" Button</span>
              </label>
              {settings.showApplyButton && (
                <input
                  type="text"
                  value={settings.applyButtonText}
                  onChange={(e) => setSettings({ ...settings, applyButtonText: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                  placeholder="Apply Now"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closing Text
              </label>
              <textarea
                value={settings.closingText}
                onChange={(e) => setSettings({ ...settings, closingText: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="If you have any questions..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signature Text
              </label>
              <input
                type="text"
                value={settings.signatureText}
                onChange={(e) => setSettings({ ...settings, signatureText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                placeholder="Best regards,"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header/Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full px-4 py-3 bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
          <p className="text-sm text-gray-500 mb-4">This is how your email will look to customers</p>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
            {/* Email Preview */}
            <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
              {/* Header */}
              <div style={{
                background: settings.primaryColor,
                color: 'white',
                padding: '30px',
                textAlign: 'center' as const
              }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{sampleData.companyName}</h1>
              </div>

              {/* Content */}
              <div style={{ padding: '30px', backgroundColor: '#ffffff' }}>
                <p style={{ fontSize: '16px', color: '#333', margin: '0 0 20px' }}>
                  {replacePlaceholders(settings.greeting)}
                </p>

                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 20px' }}>
                  {replacePlaceholders(settings.introText)}
                </p>

                {/* Quote Details Box */}
                <div style={{
                  background: '#f8f9fa',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  padding: '20px',
                  margin: '20px 0'
                }}>
                  <h2 style={{
                    margin: '0 0 15px',
                    fontSize: '18px',
                    color: settings.primaryColor,
                    borderBottom: `2px solid ${settings.primaryColor}`,
                    paddingBottom: '10px'
                  }}>
                    Quote #{sampleData.quoteId}
                  </h2>
                  <table style={{ width: '100%', fontSize: '14px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#666' }}>Loan Type:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' as const }}>{sampleData.loanType}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#666' }}>Purchase Price:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' as const }}>{sampleData.purchasePrice}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#666' }}>Loan Amount:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' as const }}>{sampleData.loanAmount}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#666' }}>Interest Rate:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' as const }}>{sampleData.interestRate}%</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', color: '#666' }}>Loan Term:</td>
                        <td style={{ padding: '8px 0', fontWeight: 'bold', textAlign: 'right' as const }}>{sampleData.loanTerm} years</td>
                      </tr>
                      <tr style={{ borderTop: '2px solid #ddd' }}>
                        <td style={{ padding: '12px 0', color: '#333', fontWeight: 'bold', fontSize: '16px' }}>Est. Monthly Payment:</td>
                        <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '20px', textAlign: 'right' as const, color: settings.primaryColor }}>{sampleData.totalMonthlyPayment}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '20px 0' }}>
                  {replacePlaceholders(settings.bodyText)}
                </p>

                {/* Buttons */}
                <div style={{ textAlign: 'center' as const, margin: '25px 0' }}>
                  <a
                    href="#"
                    style={{
                      display: 'inline-block',
                      background: settings.buttonColor,
                      color: 'white',
                      padding: '14px 28px',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      marginRight: settings.showApplyButton ? '10px' : '0'
                    }}
                  >
                    {settings.buttonText}
                  </a>
                  {settings.showApplyButton && (
                    <a
                      href="#"
                      style={{
                        display: 'inline-block',
                        background: '#dc2626',
                        color: 'white',
                        padding: '14px 28px',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold'
                      }}
                    >
                      {settings.applyButtonText}
                    </a>
                  )}
                </div>

                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '20px 0' }}>
                  {replacePlaceholders(settings.closingText)}
                </p>

                <p style={{ fontSize: '14px', color: '#333', margin: '20px 0 5px' }}>
                  {settings.signatureText}<br />
                  <strong>{sampleData.companyName} Team</strong>
                </p>
              </div>

              {/* Footer */}
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                textAlign: 'center' as const,
                fontSize: '12px',
                color: '#666',
                borderTop: '1px solid #e5e5e5'
              }}>
                <p style={{ margin: '0 0 5px' }}>{sampleData.companyName} | {sampleData.companyNmls}</p>
                <p style={{ margin: '0 0 5px' }}>{sampleData.companyPhone} | {sampleData.companyEmail}</p>
                <p style={{ margin: '0' }}>Equal Housing Opportunity</p>
              </div>
            </div>
          </div>

          {/* Placeholder Reference */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Placeholders</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div><code className="bg-gray-200 px-1 rounded">{'{firstName}'}</code> - Customer name</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{quoteId}'}</code> - Quote number</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{loanType}'}</code> - Loan type</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{purchasePrice}'}</code> - Purchase price</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{loanAmount}'}</code> - Loan amount</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{interestRate}'}</code> - Interest rate</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{loanTerm}'}</code> - Loan term</div>
              <div><code className="bg-gray-200 px-1 rounded">{'{totalMonthlyPayment}'}</code> - Monthly payment</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
