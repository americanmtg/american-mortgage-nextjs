'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

interface PrizeClaimFormProps {
  token: string;
  winnerId: number;
  entry: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    state: string;
  };
  requiresW9: boolean;
}

export default function PrizeClaimForm({ token, winnerId, entry, requiresW9 }: PrizeClaimFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [legalName, setLegalName] = useState(`${entry.firstName} ${entry.lastName}`);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState(entry.state);
  const [zipCode, setZipCode] = useState('');

  // Document uploads
  const [w9File, setW9File] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const w9InputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Agreements
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [confirmIdentity, setConfirmIdentity] = useState(false);

  function handleW9Change(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('W-9 must be a PDF, JPG, or PNG file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('W-9 file must be less than 10MB');
        return;
      }
      setW9File(file);
      setError('');
    }
  }

  function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('ID must be a PDF, JPG, or PNG file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('ID file must be less than 10MB');
        return;
      }
      setIdFile(file);
      setError('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate required fields
    if (!legalName || !addressLine1 || !city || !state || !zipCode) {
      setError('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    if (!agreeTerms || !confirmIdentity) {
      setError('You must agree to the terms and confirm your identity.');
      setIsSubmitting(false);
      return;
    }

    if (requiresW9 && !w9File) {
      setError('W-9 form is required for this prize.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('token', token);
      formData.append('winnerId', winnerId.toString());
      formData.append('legalName', legalName);
      formData.append('addressLine1', addressLine1);
      formData.append('addressLine2', addressLine2);
      formData.append('city', city);
      formData.append('state', state);
      formData.append('zipCode', zipCode);

      if (w9File) {
        formData.append('w9Document', w9File);
      }
      if (idFile) {
        formData.append('idDocument', idFile);
      }

      const res = await fetch('/api/giveaways/claim', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit claim');
      }

      setSuccess(true);
      // Refresh the page to show claimed status
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted!</h3>
        <p className="text-gray-600">
          Your prize claim has been submitted successfully. We&apos;ll review your information and be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Legal Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Legal Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Full legal name as it appears on your ID"
        />
        <p className="mt-1 text-xs text-gray-500">Must match your government-issued ID</p>
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="123 Main Street"
        />
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apt, Suite, Unit (Optional)
        </label>
        <input
          type="text"
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Apt 4B"
        />
      </div>

      {/* City, State, Zip */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="New York"
          />
        </div>
        <div className="col-span-6 sm:col-span-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="10001"
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>
      </div>

      {/* Document Uploads */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>

        {/* W-9 Upload */}
        {requiresW9 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              W-9 Form <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => w9InputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                w9File ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <input
                ref={w9InputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleW9Change}
                className="hidden"
              />
              {w9File ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">{w9File.name}</span>
                </div>
              ) : (
                <>
                  <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">Click to upload W-9 form</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Download blank W-9 form from IRS.gov
              </a>
            </p>
          </div>
        )}

        {/* ID Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Government-Issued ID {requiresW9 && <span className="text-gray-500">(Recommended)</span>}
          </label>
          <div
            onClick={() => idInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              idFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input
              ref={idInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleIdChange}
              className="hidden"
            />
            {idFile ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{idFile.name}</span>
              </div>
            ) : (
              <>
                <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <p className="text-gray-600">Click to upload ID (Driver&apos;s License, Passport, etc.)</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (max 10MB)</p>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Upload a photo of your ID to speed up verification
          </p>
        </div>
      </div>

      {/* Agreements */}
      <div className="border-t pt-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmIdentity}
            onChange={(e) => setConfirmIdentity(e.target.checked)}
            required
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I confirm that I am the person who entered this giveaway and that all information provided is accurate.
            <span className="text-red-500">*</span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
            className="w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I agree to the prize claim terms and conditions, including that I am solely responsible for any taxes
            or fees associated with receiving this prize. <span className="text-red-500">*</span>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !agreeTerms || !confirmIdentity}
        className="w-full px-6 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting Claim...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Claim My Prize
          </>
        )}
      </button>

      {/* Privacy Note */}
      <p className="text-xs text-gray-500 text-center">
        Your personal information is secure and will only be used for prize fulfillment and required tax reporting.
      </p>
    </form>
  );
}
