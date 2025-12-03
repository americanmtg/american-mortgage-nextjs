'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'Washington D.C.' },
];

export default function NewGiveawayPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizeValue, setPrizeValue] = useState('');
  const [prizeImage, setPrizeImage] = useState('');
  const [detailImage, setDetailImage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [drawingDate, setDrawingDate] = useState('');
  const [numWinners, setNumWinners] = useState('1');
  const [alternateWinners, setAlternateWinners] = useState('3');
  const [alternateSelection, setAlternateSelection] = useState('auto');
  const [requireW9, setRequireW9] = useState(false);
  const [w9Threshold, setW9Threshold] = useState('600');
  const [restrictedStates, setRestrictedStates] = useState<string[]>([]);
  const [status, setStatus] = useState('draft');

  // Entry settings
  const [entryType, setEntryType] = useState('both');
  const [bonusEntriesEnabled, setBonusEntriesEnabled] = useState(false);
  const [bonusEntryCount, setBonusEntryCount] = useState('1');
  const [requireId, setRequireId] = useState(false);

  // Button customization
  const [buttonText, setButtonText] = useState('Enter Now');
  const [buttonColor, setButtonColor] = useState('#2563eb');
  const [buttonIcon, setButtonIcon] = useState('ticket');
  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState('email');

  // Generate slug from title
  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  }

  function toggleState(stateCode: string) {
    setRestrictedStates(prev =>
      prev.includes(stateCode)
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
    );
  }

  function selectAllStates() {
    setRestrictedStates(US_STATES.map(s => s.code));
  }

  function deselectAllStates() {
    setRestrictedStates([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/giveaways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          slug,
          description: description || null,
          rules: rules || null,
          prizeTitle: title, // Use title as prize title
          prizeValue: prizeValue ? parseFloat(prizeValue) : null,
          prizeDescription: description || null, // Use description as prize description
          prizeImage: prizeImage || null,
          detailImage: detailImage || null,
          startDate,
          endDate,
          drawingDate: drawingDate || null,
          numWinners: parseInt(numWinners),
          alternateWinners: parseInt(alternateWinners),
          alternateSelection,
          requireW9,
          w9Threshold: parseFloat(w9Threshold),
          restrictedStates,
          status,
          entryType,
          bonusEntriesEnabled,
          bonusEntryCount: parseInt(bonusEntryCount),
          requireId,
          // Button customization
          buttonText,
          buttonColor,
          buttonIcon,
          // Delivery method
          deliveryMethod,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create giveaway');
      }

      const result = await res.json();
      router.push(`/admin/giveaways/${result.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/giveaways"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Giveaway</h1>
          <p className="text-gray-600">Create a new promotional giveaway</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Giveaway Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Giveaway Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="$10 Candy Craze Gift Card"
              />
              <p className="mt-1 text-xs text-gray-500">The main title for your giveaway/prize</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10-candy-craze-gift-card"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize Value ($)</label>
              <input
                type="number"
                value={prizeValue}
                onChange={(e) => setPrizeValue(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>

          {/* Image Fields Section */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Giveaway Images</h3>

            {/* Card Image */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Image (for listings page)
              </label>
              <input
                type="text"
                value={prizeImage}
                onChange={(e) => setPrizeImage(e.target.value)}
                placeholder="/cms-media/your-image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex items-start gap-3">
                <div className="flex-shrink-0 w-16 h-10 bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
                  <span className="text-[10px] text-blue-600 font-medium">340x176</span>
                </div>
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-600">Recommended: 340 x 176 pixels (or 2:1 ratio)</p>
                  <p>This image appears on the giveaways listing page cards. Use a landscape image that shows the prize clearly.</p>
                </div>
              </div>
              {prizeImage && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img src={prizeImage} alt="Card preview" className="w-40 h-20 object-cover rounded border border-gray-200" />
                </div>
              )}
            </div>

            {/* Detail Page Image */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detail Page Image (for entry page)
              </label>
              <input
                type="text"
                value={detailImage}
                onChange={(e) => setDetailImage(e.target.value)}
                placeholder="/cms-media/your-detail-image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex items-start gap-3">
                <div className="flex-shrink-0 w-16 h-12 bg-green-100 rounded border border-green-200 flex items-center justify-center">
                  <span className="text-[10px] text-green-600 font-medium">800x450 (16:9)</span>
                </div>
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-600">Recommended: 800 x 450 pixels (16:9 ratio)</p>
                  <p>This image appears as the hero on the giveaway entry page. Use a high-quality, full-width image. If not set, the card image will be used.</p>
                </div>
              </div>
              {detailImage && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Preview:</p>
                  <img src={detailImage} alt="Detail preview" className="w-48 h-36 object-cover rounded border border-gray-200" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the giveaway description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Rules</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the official rules..."
            />
          </div>
        </div>

        {/* Entry Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Entry Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entry Type</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="both">Phone & Email (Both Required)</option>
              <option value="phone">Phone Only</option>
              <option value="email">Email Only</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose what contact information is required to enter
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={bonusEntriesEnabled}
                onChange={(e) => setBonusEntriesEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable bonus entries for providing secondary contact</span>
            </label>
            <p className="ml-7 text-xs text-gray-500">
              Extra entries for verifying secondary contact method (e.g., email if phone is primary)
            </p>

            {bonusEntriesEnabled && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Entry Count</label>
                <input
                  type="number"
                  value={bonusEntryCount}
                  onChange={(e) => setBonusEntryCount(e.target.value)}
                  min="1"
                  max="10"
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Timing */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Timing</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drawing Date</label>
              <input
                type="datetime-local"
                value={drawingDate}
                onChange={(e) => setDrawingDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Winner Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Winner Settings</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Winners</label>
              <input
                type="number"
                value={numWinners}
                onChange={(e) => setNumWinners(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Winners</label>
              <input
                type="number"
                value={alternateWinners}
                onChange={(e) => setAlternateWinners(e.target.value)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Selection</label>
              <select
                value={alternateSelection}
                onChange={(e) => setAlternateSelection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

        </div>

        {/* Button Customization */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Entry Button Appearance</h2>
          <p className="text-sm text-gray-500">Customize how the &quot;Enter&quot; button appears on the giveaway card</p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                maxLength={30}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Icon</label>
              <select
                value={buttonIcon}
                onChange={(e) => setButtonIcon(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ticket">Ticket</option>
                <option value="arrow">Arrow</option>
                <option value="gift">Gift</option>
                <option value="star">Star</option>
                <option value="none">No Icon</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <button
              type="button"
              style={{ backgroundColor: buttonColor }}
              className="w-full py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
            >
              {buttonIcon === 'ticket' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              )}
              {buttonIcon === 'arrow' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              )}
              {buttonIcon === 'gift' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              )}
              {buttonIcon === 'star' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
              {buttonText}
            </button>
          </div>
        </div>

        {/* Claim Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Claim Settings</h2>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={requireId}
              onChange={(e) => setRequireId(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm text-gray-700">Require ID upload when claiming prize</span>
              <p className="text-xs text-gray-500">Winners must upload a government-issued ID to claim</p>
            </div>
          </label>

          <div className="border-t border-gray-200 pt-4 space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requireW9}
                onChange={(e) => setRequireW9(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm text-gray-700">Require W-9 for prizes at or above threshold</span>
                <p className="text-xs text-gray-500">IRS requires W-9 for prizes valued at $600 or more</p>
              </div>
            </label>

            {requireW9 && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-1">W-9 Threshold ($)</label>
                <input
                  type="number"
                  value={w9Threshold}
                  onChange={(e) => setW9Threshold(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Prize Delivery Method</label>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="email">Email</option>
              <option value="physical">Physical Mail</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">How the prize will be delivered to winners</p>
          </div>
        </div>

        {/* State Restrictions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">State Restrictions</h2>
              <p className="text-sm text-gray-500">Select states where this giveaway is NOT available</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllStates}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAllStates}
                className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {US_STATES.map((state) => (
              <button
                key={state.code}
                type="button"
                onClick={() => toggleState(state.code)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  restrictedStates.includes(state.code)
                    ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
                title={state.name}
              >
                {state.code}
              </button>
            ))}
          </div>

          {restrictedStates.length > 0 && (
            <p className="text-sm text-red-600">
              {restrictedStates.length} state{restrictedStates.length > 1 ? 's' : ''} restricted
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/giveaways"
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Create Giveaway'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
