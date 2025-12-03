'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

interface Giveaway {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  rules: string | null;
  prizeTitle: string;
  prizeValue: number | null;
  prizeDescription: string | null;
  prizeImage: string | null;
  detailImage: string | null;
  startDate: string;
  endDate: string;
  drawingDate: string | null;
  numWinners: number;
  alternateWinners: number;
  alternateSelection: string;
  requireW9: boolean;
  w9Threshold: number;
  restrictedStates: string[];
  status: string;
  winnerSelected: boolean;
  entryCount: number;
  winnerCount: number;
  // New fields
  entryType: string;
  primaryContact: string;
  bonusEntriesEnabled: boolean;
  bonusEntryCount: number;
  requireId: boolean;
  // Button customization
  buttonText: string;
  buttonColor: string;
  buttonIcon: string;
  // Delivery method
  deliveryMethod: string;
  // Fine print
  finePrint: string | null;
  // Referral settings
  referralEnabled: boolean;
  referralBonusEntries: number;
  maxReferralBonus: number;
  maxReferralsPerIp: number;
  // Sections
  sections?: GiveawaySection[];
}

interface GiveawaySection {
  id?: number;
  title: string;
  content: string;
  order: number;
  isExpanded: boolean;
}

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().slice(0, 16);
}

export default function EditGiveawayPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);

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
  // New fields
  const [entryType, setEntryType] = useState('both');
  const [primaryContact, setPrimaryContact] = useState('phone');
  const [bonusEntriesEnabled, setBonusEntriesEnabled] = useState(false);
  const [bonusEntryCount, setBonusEntryCount] = useState('1');
  const [requireId, setRequireId] = useState(false);
  // Button customization
  const [buttonText, setButtonText] = useState('Enter Now');
  const [buttonColor, setButtonColor] = useState('#2563eb');
  const [buttonIcon, setButtonIcon] = useState('ticket');
  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  // Fine print
  const [finePrint, setFinePrint] = useState('');
  // Referral settings
  const [referralEnabled, setReferralEnabled] = useState(false);
  const [referralBonusEntries, setReferralBonusEntries] = useState('1');
  const [maxReferralBonus, setMaxReferralBonus] = useState('10');
  const [maxReferralsPerIp, setMaxReferralsPerIp] = useState('3');
  // Sections
  const [sections, setSections] = useState<GiveawaySection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchGiveaway();
    fetchSections();
  }, [id]);

  async function fetchSections() {
    setSectionsLoading(true);
    try {
      const res = await fetch(`/api/giveaways/${id}/sections`, {
        credentials: 'include',
      });
      if (res.ok) {
        const result = await res.json();
        setSections(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    } finally {
      setSectionsLoading(false);
    }
  }

  async function addSection() {
    try {
      const res = await fetch(`/api/giveaways/${id}/sections`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Section',
          content: '',
          isExpanded: false,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setSections([...sections, result.data]);
      }
    } catch (err) {
      console.error('Error adding section:', err);
    }
  }

  async function updateSection(index: number, field: keyof GiveawaySection, value: any) {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
    return updated[index]; // Return the updated section for immediate saving
  }

  async function saveSection(index: number, sectionData?: GiveawaySection) {
    const section = sectionData || sections[index];
    if (!section || !section.id) return;

    try {
      await fetch(`/api/giveaways/${id}/sections`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: [section] }),
      });
    } catch (err) {
      console.error('Error saving section:', err);
    }
  }

  async function updateAndSaveSection(index: number, field: keyof GiveawaySection, value: any) {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
    // Save immediately with the updated data
    await saveSection(index, updated[index]);
  }

  async function moveSection(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= sections.length) return;

    const updated = [...sections];
    // Swap positions
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    // Update order values
    updated.forEach((s, i) => {
      s.order = i;
    });
    setSections(updated);

    // Save all sections with new order
    try {
      await fetch(`/api/giveaways/${id}/sections`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updated }),
      });
    } catch (err) {
      console.error('Error reordering sections:', err);
    }
  }

  async function deleteSection(index: number) {
    const section = sections[index];
    if (!section.id) {
      setSections(sections.filter((_, i) => i !== index));
      return;
    }

    try {
      const res = await fetch(`/api/giveaways/${id}/sections?sectionId=${section.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setSections(sections.filter((_, i) => i !== index));
      }
    } catch (err) {
      console.error('Error deleting section:', err);
    }
  }

  async function fetchGiveaway() {
    try {
      const res = await fetch(`/api/giveaways/${id}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Giveaway not found');
      }

      const result = await res.json();
      const data = result.data as Giveaway;
      setGiveaway(data);

      // Populate form fields
      setTitle(data.title);
      setSlug(data.slug);
      setDescription(data.description || '');
      setRules(data.rules || '');
      setPrizeValue(data.prizeValue?.toString() || '');
      setPrizeImage(data.prizeImage || '');
      setDetailImage(data.detailImage || '');
      setStartDate(formatDateForInput(data.startDate));
      setEndDate(formatDateForInput(data.endDate));
      setDrawingDate(data.drawingDate ? formatDateForInput(data.drawingDate) : '');
      setNumWinners(data.numWinners.toString());
      setAlternateWinners(data.alternateWinners.toString());
      setAlternateSelection(data.alternateSelection);
      setRequireW9(data.requireW9);
      setW9Threshold(data.w9Threshold.toString());
      setRestrictedStates(data.restrictedStates || []);
      setStatus(data.status);
      // New fields
      setEntryType(data.entryType || 'both');
      setPrimaryContact(data.primaryContact || 'phone');
      setBonusEntriesEnabled(data.bonusEntriesEnabled || false);
      setBonusEntryCount((data.bonusEntryCount || 1).toString());
      setRequireId(data.requireId || false);
      // Button customization
      setButtonText(data.buttonText || 'Enter Now');
      setButtonColor(data.buttonColor || '#2563eb');
      setButtonIcon(data.buttonIcon || 'ticket');
      // Delivery method
      setDeliveryMethod(data.deliveryMethod || 'email');
      // Fine print
      setFinePrint(data.finePrint || '');
      // Referral settings
      setReferralEnabled(data.referralEnabled || false);
      setReferralBonusEntries((data.referralBonusEntries || 1).toString());
      setMaxReferralBonus((data.maxReferralBonus || 10).toString());
      setMaxReferralsPerIp((data.maxReferralsPerIp || 3).toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/giveaways/${id}`, {
        method: 'PUT',
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
          // New fields
          entryType,
          primaryContact,
          bonusEntriesEnabled,
          bonusEntryCount: parseInt(bonusEntryCount),
          requireId,
          // Button customization
          buttonText,
          buttonColor,
          buttonIcon,
          // Delivery method
          deliveryMethod,
          // Fine print
          finePrint: finePrint || null,
          // Referral settings
          referralEnabled,
          referralBonusEntries: parseInt(referralBonusEntries),
          maxReferralBonus: parseInt(maxReferralBonus),
          maxReferralsPerIp: parseInt(maxReferralsPerIp),
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to update giveaway');
      }

      setSuccessMessage('Giveaway updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectWinners() {
    if (!confirm('Are you sure you want to select winners? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/giveaways/${id}/winners`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to select winners');
      }

      const result = await res.json();
      alert(`Winners selected!\n\nPrimary Winners: ${result.data.primaryWinners.length}\nAlternate Winners: ${result.data.alternateWinners.length}`);

      // Refresh giveaway data
      fetchGiveaway();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/giveaways/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to delete giveaway');
      }

      router.push('/admin/giveaways');
    } catch (err: any) {
      alert(err.message);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading giveaway...</p>
        </div>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Giveaway Not Found</h2>
          <p className="text-red-600 mb-4">{error || 'The giveaway you are looking for does not exist.'}</p>
          <Link href="/admin/giveaways" className="text-blue-600 hover:underline">
            Back to Giveaways
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Giveaway</h1>
            <p className="text-gray-600">{giveaway.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/giveaways/${id}/entries`}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            View Entries ({giveaway.entryCount})
          </Link>
          {giveaway.winnerSelected && (
            <Link
              href={`/admin/giveaways/${id}/winners`}
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Manage Winners ({giveaway.winnerCount})
            </Link>
          )}
          {!giveaway.winnerSelected && giveaway.entryCount > 0 && (
            <button
              onClick={handleSelectWinners}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Select Winners
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Entries</p>
          <p className="text-2xl font-bold text-gray-900">{giveaway.entryCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Winners</p>
          <p className="text-2xl font-bold text-gray-900">{giveaway.winnerCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-2xl font-bold text-gray-900 capitalize">{giveaway.status}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Winners Selected</p>
          <p className="text-2xl font-bold text-gray-900">{giveaway.winnerSelected ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700">
          {successMessage}
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
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
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
            />
          </div>

        </div>

        {/* Custom Collapsible Sections */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Collapsible Sections</h2>
              <p className="text-sm text-gray-500">Add Official Rules, Fine Print, FAQ, and other collapsible sections</p>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </button>
          </div>

          {sectionsLoading ? (
            <div className="text-center py-4 text-gray-500">Loading sections...</div>
          ) : sections.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No custom sections yet</p>
              <p className="text-gray-400 text-xs">Click &quot;Add Section&quot; to create FAQ, terms, or other collapsible content</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                          onBlur={() => saveSection(index)}
                          placeholder="e.g., FAQ, Official Rules, Fine Print, How It Works"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          onBlur={() => saveSection(index)}
                          rows={4}
                          placeholder="Section content..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={section.isExpanded}
                            onChange={(e) => updateAndSaveSection(index, 'isExpanded', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">Expanded by default</span>
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSection(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete section"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {/* Entry Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Entry Settings</h2>

          <div className="grid grid-cols-2 gap-4">
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
              <p className="mt-1 text-xs text-gray-500">Choose which contact methods are required for entry</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact</label>
              <select
                value={primaryContact}
                onChange={(e) => setPrimaryContact(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">The main contact method for notifications</p>
            </div>
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
                <p className="mt-1 text-xs text-gray-500">Extra entries for verifying secondary contact method</p>
              </div>
            )}
          </div>
        </div>

        {/* Referral Program */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Referral Program</h2>
              <p className="text-sm text-gray-500">Allow entrants to earn bonus entries by sharing with friends</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={referralEnabled}
                onChange={(e) => setReferralEnabled(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Enable referral program</span>
                <p className="text-xs text-gray-500">Entrants get a unique link to share. When friends enter using their link, both earn bonus entries.</p>
              </div>
            </label>
          </div>

          {referralEnabled && (
            <div className="bg-purple-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Entries per Referral</label>
                  <input
                    type="number"
                    value={referralBonusEntries}
                    onChange={(e) => setReferralBonusEntries(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Entries awarded when a referred friend enters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Referral Bonus</label>
                  <input
                    type="number"
                    value={maxReferralBonus}
                    onChange={(e) => setMaxReferralBonus(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Max total bonus entries from referrals</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Referrals per IP</label>
                  <input
                    type="number"
                    value={maxReferralsPerIp}
                    onChange={(e) => setMaxReferralsPerIp(e.target.value)}
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Limits referrals from same household/network</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-sm text-purple-800">
                  <strong>How it works:</strong> After entering, users see a share section with their unique referral link. When friends enter using that link, the referrer earns +{referralBonusEntries} bonus {parseInt(referralBonusEntries) === 1 ? 'entry' : 'entries'}. They can earn up to {maxReferralBonus} total bonus entries from referrals.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Button Customization */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Entry Button Appearance</h2>
          <p className="text-sm text-gray-500">Customize how the "Enter" button appears on the giveaway card</p>

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
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Giveaway
          </button>
          <div className="flex items-center gap-4">
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Delete Giveaway
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                This will permanently archive this giveaway. All entries and winner data will be preserved but the giveaway will no longer be accessible.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium">
                  To confirm, type <span className="font-mono bg-yellow-100 px-1 rounded">delete</span> below:
                </p>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText.toLowerCase() !== 'delete' || isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
