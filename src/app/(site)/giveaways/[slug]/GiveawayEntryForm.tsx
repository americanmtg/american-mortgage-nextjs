'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

interface GiveawayEntryFormProps {
  giveawayId: number;
  giveawaySlug: string;
  restrictedStates: string[];
  entryType?: 'phone' | 'email' | 'both';
  bonusEntriesEnabled?: boolean;
  bonusEntryCount?: number;
  variant?: 'mobile' | 'desktop';
}

interface ExistingEntry {
  id: number;
  firstName: string;
  entryCount: number;
  baseEntries: number;
  bonusEntries: number;
  referralEntries: number;
  bonusClaimed: boolean;
  hasSecondaryContact: boolean;
  referralCode?: string | null;
}

interface GiveawayInfo {
  referralEnabled?: boolean;
  referralBonusEntries?: number;
}

export default function GiveawayEntryForm({
  giveawayId,
  giveawaySlug,
  restrictedStates,
  entryType = 'both',
  bonusEntriesEnabled = false,
  bonusEntryCount = 1,
  variant = 'mobile',
}: GiveawayEntryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'entry' | 'lookup' | 'found'>('entry');
  const [incomingReferralCode, setIncomingReferralCode] = useState<string | null>(null);

  // Capture referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setIncomingReferralCode(refCode);
      // Also store in sessionStorage in case they navigate away and come back
      sessionStorage.setItem(`giveaway_ref_${giveawaySlug}`, refCode);
    } else {
      // Check sessionStorage for previously captured referral
      const storedRef = sessionStorage.getItem(`giveaway_ref_${giveawaySlug}`);
      if (storedRef) {
        setIncomingReferralCode(storedRef);
      }
    }
  }, [searchParams, giveawaySlug]);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [secondaryContact, setSecondaryContact] = useState('');

  // Lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [existingEntry, setExistingEntry] = useState<ExistingEntry | null>(null);
  const [bonusSecondary, setBonusSecondary] = useState('');
  const [giveawayInfo, setGiveawayInfo] = useState<GiveawayInfo | null>(null);
  const [copied, setCopied] = useState(false);

  // Determine what's required
  const requiresPhone = entryType === 'phone' || entryType === 'both';
  const requiresEmail = entryType === 'email' || entryType === 'both';
  const secondaryType = entryType === 'phone' ? 'email' : 'phone';

  // Check if all required fields are filled
  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    state &&
    agreedToTerms &&
    (requiresPhone ? phone.trim() : true) &&
    (requiresEmail ? email.trim() : true);

  // Filter out restricted states
  const availableStates = US_STATES.filter(s => !restrictedStates.includes(s.code));

  // Format phone number as user types
  function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  function handlePhoneChange(value: string, setter: (v: string) => void) {
    const formatted = formatPhoneNumber(value);
    setter(formatted);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate
    if (!firstName || !lastName || !state) {
      setError('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    if (requiresPhone && !phone) {
      setError('Phone number is required.');
      setIsSubmitting(false);
      return;
    }

    if (requiresEmail && !email) {
      setError('Email is required.');
      setIsSubmitting(false);
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the terms to enter.');
      setIsSubmitting(false);
      return;
    }

    // Check if state is restricted
    if (restrictedStates.includes(state)) {
      setError('Sorry, this giveaway is not available in your state.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/giveaways/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giveawayId,
          email: email || null,
          phone: phone ? phone.replace(/\D/g, '') : null,
          firstName,
          lastName,
          state,
          zipCode: zipCode || null,
          smsOptIn: agreedToTerms,
          agreedToRules: agreedToTerms,
          entrySource: 'website',
          secondaryContact: secondaryContact || null,
          referralCode: incomingReferralCode || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit entry');
      }

      // Clear the stored referral code after successful entry
      sessionStorage.removeItem(`giveaway_ref_${giveawaySlug}`);

      // Build success URL with all relevant params
      const params = new URLSearchParams();
      if (result.referralCode) {
        params.set('ref', result.referralCode);
        params.set('bonus', String(result.referralBonusEntries || 1));
      }
      if (result.entryId) {
        params.set('entryId', String(result.entryId));
      }
      if (result.canClaimBonus) {
        params.set('canClaimBonus', 'true');
      }
      const queryString = params.toString();
      const successUrl = `/giveaways/${giveawaySlug}/success${queryString ? `?${queryString}` : ''}`;
      router.push(successUrl);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!lookupPhone) {
      setError('Please enter your phone number.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/giveaways/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giveawayId,
          phone: lookupPhone.replace(/\D/g, ''),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to look up entry');
      }

      if (result.found) {
        setExistingEntry(result.entry);
        setGiveawayInfo(result.giveaway);
        setMode('found');
        // Scroll form into view so user sees their entry info (mobile only)
        setTimeout(() => {
          if (formContainerRef.current && window.innerWidth < 768) {
            const elementTop = formContainerRef.current.getBoundingClientRect().top + window.scrollY;
            // Scroll to 150px above the element to show the welcome message
            window.scrollTo({ top: elementTop - 150, behavior: 'smooth' });
          }
        }, 100);
      } else {
        setError('No entry found with this phone number. Would you like to enter?');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClaimBonus(e: React.FormEvent) {
    e.preventDefault();
    if (!existingEntry) return;

    setIsSubmitting(true);
    setError('');

    if (!bonusSecondary) {
      setError(`Please enter your ${secondaryType === 'email' ? 'email address' : 'phone number'}.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/giveaways/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: existingEntry.id,
          giveawayId,
          secondaryContact: secondaryType === 'phone'
            ? bonusSecondary.replace(/\D/g, '')
            : bonusSecondary,
          secondaryContactType: secondaryType,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to claim bonus entry');
      }

      // Update existing entry state
      setExistingEntry({
        ...existingEntry,
        entryCount: result.entry.entryCount,
        bonusClaimed: true,
      });
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper for copy to clipboard
  async function copyReferralLink() {
    if (!existingEntry?.referralCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dev.americanmtg.com';
    const referralUrl = `${baseUrl}/giveaways/${giveawaySlug}?ref=${existingEntry.referralCode}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  // Entry Found View
  if (mode === 'found' && existingEntry) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dev.americanmtg.com';
    const referralUrl = existingEntry.referralCode ? `${baseUrl}/giveaways/${giveawaySlug}?ref=${existingEntry.referralCode}` : null;
    const referralBonusAmount = giveawayInfo?.referralBonusEntries || 1;

    return (
      <div ref={formContainerRef} className="space-y-3">
        {/* Compact Entry Found Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                Welcome back, {existingEntry.firstName}!
              </p>
              <p className="text-sm font-bold text-green-700">
                Total: {existingEntry.entryCount} {existingEntry.entryCount === 1 ? 'entry' : 'entries'}
              </p>
              <div className="text-xs text-green-600 mt-1 space-y-0.5">
                <p>• Base entry: 1</p>
                {existingEntry.bonusEntries > 0 && (
                  <p>• Bonus entry (email): +{existingEntry.bonusEntries}</p>
                )}
                {existingEntry.referralEntries > 0 && (
                  <p>• Referral entries: +{existingEntry.referralEntries}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Entry Option - styled same as main entry form */}
        {bonusEntriesEnabled && !existingEntry.bonusClaimed && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="mb-2">
              <span className="text-xs font-bold text-blue-800">
                +{bonusEntryCount} Bonus {bonusEntryCount === 1 ? 'Entry' : 'Entries'}
              </span>
              <span className="text-xs text-blue-700 ml-1">
                (optional)
              </span>
            </div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              {secondaryType === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <form onSubmit={handleClaimBonus} className="space-y-2">
              {secondaryType === 'email' ? (
                <input
                  type="email"
                  value={bonusSecondary}
                  onChange={(e) => setBonusSecondary(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                />
              ) : (
                <input
                  type="tel"
                  value={bonusSecondary}
                  onChange={(e) => handlePhoneChange(e.target.value, setBonusSecondary)}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                />
              )}
              <button
                type="submit"
                disabled={isSubmitting || !bonusSecondary}
                className="w-full py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Claiming...' : `Claim ${bonusEntryCount} Bonus ${bonusEntryCount === 1 ? 'Entry' : 'Entries'}`}
              </button>
            </form>
          </div>
        )}

        {/* Referral Share Section - Show for all users when referrals are enabled */}
        {referralUrl && giveawayInfo?.referralEnabled && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h3 className="text-sm font-bold text-purple-900 mb-1">
              Claim more chances to win:
            </h3>
            <div className="mb-2">
              <span className="text-xs font-bold text-purple-800">
                +{referralBonusAmount} Bonus {referralBonusAmount === 1 ? 'Entry' : 'Entries'} Per Referral
              </span>
            </div>
            <label className="block text-xs font-medium text-purple-700 mb-1">
              Your Referral Link
            </label>
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-sm text-gray-600 mb-2"
            />
            <button
              onClick={copyReferralLink}
              className={`w-full py-2 text-xs font-semibold rounded-lg transition-all ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Referral Link'}
            </button>
          </div>
        )}

        {existingEntry.bonusClaimed && !giveawayInfo?.referralEnabled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center text-xs text-gray-600">
            You've already claimed your bonus entries!
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-700 text-xs">
            {error}
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="w-full py-2 text-xs text-gray-500 hover:text-gray-700"
        >
          ← Return to previous page
        </button>
      </div>
    );
  }

  // Lookup View
  if (mode === 'lookup') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Check Your Entry</h3>
          <p className="text-sm text-gray-500">Enter your phone number to see your entries</p>
        </div>

        <form onSubmit={handleLookup} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={lookupPhone}
              onChange={(e) => handlePhoneChange(e.target.value, setLookupPhone)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="(555) 123-4567"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !lookupPhone}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Looking up...' : 'Check My Entry'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setMode('entry');
              setError('');
              setLookupPhone('');
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            New entry? Enter here
          </button>
        </div>
      </div>
    );
  }

  // Entry Form View
  return (
    <div className="space-y-3">
      {/* Title and description - only show in entry mode */}
      <div>
        <h2 className={`font-bold text-gray-900 ${variant === 'desktop' ? 'text-xl' : 'text-lg'}`}>Enter to Win</h2>
        <p className="text-sm text-gray-500 mt-1">Fill out the form below for your chance to win!</p>
        <button
          onClick={() => setMode('lookup')}
          className="text-sm text-blue-600 hover:text-blue-700 mt-1"
        >
          Already entered? Check your entries
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-gray-100">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Phone (if required or both) */}
        {requiresPhone && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value, setPhone)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="(555) 123-4567"
            />
          </div>
        )}

        {/* Email (if required or both) */}
        {requiresEmail && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="john@example.com"
            />
          </div>
        )}

        {/* Bonus Entry - Secondary Contact (only for phone/email-only entry types) */}
        {bonusEntriesEnabled && entryType !== 'both' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="mb-2">
              <span className="text-xs font-bold text-blue-800">
                +{bonusEntryCount} Bonus {bonusEntryCount === 1 ? 'Entry' : 'Entries'}
              </span>
              <span className="text-xs text-blue-700 ml-1">
                (optional)
              </span>
            </div>
            <label className="block text-xs font-medium text-blue-700 mb-1">
              {secondaryType === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            {secondaryType === 'email' ? (
              <input
                type="email"
                value={secondaryContact}
                onChange={(e) => setSecondaryContact(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                placeholder="your@email.com"
              />
            ) : (
              <input
                type="tel"
                value={secondaryContact}
                onChange={(e) => handlePhoneChange(e.target.value, setSecondaryContact)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base"
                placeholder="(555) 123-4567"
              />
            )}
          </div>
        )}

        {/* State & Zip */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              className="w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
            >
              <option value="">Select State</option>
              {availableStates.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="w-full h-[38px] px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="12345"
              maxLength={5}
            />
          </div>
        </div>

        {/* Combined Terms Agreement */}
        <div className="bg-gray-50 rounded-lg p-2.5">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              required
              className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-xs text-gray-600 leading-tight">
              I agree to the Official Rules and consent to receive SMS notifications about this giveaway, including winner announcements.
              Message and data rates may apply. Reply STOP to opt out. <span className="text-red-500">*</span>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="w-full h-[44px] bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting Entry...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Enter to Win
            </>
          )}
        </button>
      </form>
    </div>
  );
}
