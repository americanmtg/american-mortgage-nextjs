'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './prequalify.module.css';

// Google Places API Key
const GOOGLE_PLACES_API_KEY = 'AIzaSyCB4GdWDY3-KltLtR7mjqk1pn4-e4GWfUE';

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces: () => void;
  }
}

// Place suggestion type
interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

// Load Google Maps Script
let googleScriptLoaded = false;
let googleScriptLoading = false;
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (googleScriptLoaded && window.google?.maps?.places) {
      resolve();
      return;
    }

    if (googleScriptLoading) {
      // Wait for existing script to load
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    googleScriptLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;

    window.initGooglePlaces = () => {
      googleScriptLoaded = true;
      googleScriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      googleScriptLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });
};

// Types
interface FormData {
  // Initial choice
  loanType: 'purchase' | 'refinance' | '';

  // Purchase path
  homebuyingStage: string;
  priceRange: string;
  propertyType: string;
  purchaseTimeline: string;

  // Refinance path
  homeValue: string;
  currentRate: string;
  mortgageBalance: string;
  wantsCashOut: boolean | null;
  cashOutAmount: string;

  // Common fields
  militaryService: boolean | null;
  militaryBranch: string;
  downPaymentPercent: string;
  employmentStatus: string;
  annualIncome: string;
  bankruptcyHistory: boolean | null;
  ownsHome: string;
  firstTimeBuyer: boolean | null;
  creditScore: string;
  location: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const initialFormData: FormData = {
  loanType: '',
  homebuyingStage: '',
  priceRange: '',
  propertyType: '',
  purchaseTimeline: '',
  homeValue: '',
  currentRate: '',
  mortgageBalance: '',
  wantsCashOut: null,
  cashOutAmount: '',
  militaryService: null,
  militaryBranch: '',
  downPaymentPercent: '',
  employmentStatus: '',
  annualIncome: '',
  bankruptcyHistory: null,
  ownsHome: '',
  firstTimeBuyer: null,
  creditScore: '',
  location: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
};

// Price ranges for down payment calculation
const priceRangeValues: Record<string, { min: number; max: number }> = {
  '$700K or more': { min: 700000, max: 1000000 },
  '$600K - $700K': { min: 600000, max: 700000 },
  '$500K - $600K': { min: 500000, max: 600000 },
  '$400K - $500K': { min: 400000, max: 500000 },
  '$350K - $400K': { min: 350000, max: 400000 },
  '$300K - $350K': { min: 300000, max: 350000 },
  '$250K - $300K': { min: 250000, max: 300000 },
  '$200K - $250K': { min: 200000, max: 250000 },
  '$150K - $200K': { min: 150000, max: 200000 },
  '$100K - $150K': { min: 100000, max: 150000 },
  'Under $100K': { min: 50000, max: 100000 },
  "I don't know": { min: 200000, max: 300000 },
};

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function getDownPaymentRange(priceRange: string, percent: number): string {
  const range = priceRangeValues[priceRange];
  if (!range) return '';
  const minDown = Math.round(range.min * (percent / 100));
  const maxDown = Math.round(range.max * (percent / 100));
  return `~ ${formatCurrency(minDown)} - ${formatCurrency(maxDown)}`;
}

export default function PrequalifyPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Google Places state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Refs for Google Places
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const locationWrapperRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLButtonElement>(null);

  // Disable progress bar animation on initial mount
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialMount(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Override scroll-behavior: smooth for iOS Safari compatibility
  useEffect(() => {
    // Save original values
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const originalHtmlBehavior = htmlEl.style.scrollBehavior;
    const originalBodyBehavior = bodyEl.style.scrollBehavior;

    // Set to auto for the duration of this page
    htmlEl.style.scrollBehavior = 'auto';
    bodyEl.style.scrollBehavior = 'auto';

    // Restore on unmount
    return () => {
      htmlEl.style.scrollBehavior = originalHtmlBehavior;
      bodyEl.style.scrollBehavior = originalBodyBehavior;
    };
  }, []);

  // Load Google Maps script
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setGoogleMapsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
      });
  }, []);

  // Google Places services are initialized on-demand with the new API
  useEffect(() => {
    if (!googleMapsLoaded) return;
    // Places API (New) is ready to use
  }, [googleMapsLoaded]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track previous step to detect changes
  const prevStepRef = useRef(currentStep);

  // Scroll to top synchronously when step changes
  useLayoutEffect(() => {
    if (prevStepRef.current !== currentStep) {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  // Fetch place suggestions using the new Places API
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!googleMapsLoaded || input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      // Use the new Places API (AutocompleteSuggestion)
      const { suggestions: results } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
        includedPrimaryTypes: ['locality', 'postal_code', 'administrative_area_level_1', 'administrative_area_level_2'],
        includedRegionCodes: ['us'],
      });

      setIsLoadingSuggestions(false);

      if (results && results.length > 0) {
        const formattedSuggestions: PlaceSuggestion[] = results.slice(0, 10).map((suggestion) => ({
          placeId: suggestion.placePrediction?.placeId || '',
          description: suggestion.placePrediction?.text?.text || '',
          mainText: suggestion.placePrediction?.mainText?.text || '',
          secondaryText: suggestion.placePrediction?.secondaryText?.text || '',
        }));
        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Places API error:', err);
      setIsLoadingSuggestions(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [googleMapsLoaded]);

  // Handle location input change with debounce
  const handleLocationInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    setLocationError('');

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the API call
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection using the new Place API
  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setSuggestions([]);
    setShowSuggestions(false);

    if (!suggestion.placeId) {
      setFormData(prev => ({ ...prev, location: suggestion.description }));
      return;
    }

    try {
      // Use the new Place API to get details
      const place = new google.maps.places.Place({ id: suggestion.placeId });
      await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });

      let city = '';
      let state = '';
      let zip = '';

      if (place.addressComponents) {
        for (const component of place.addressComponents) {
          const types = component.types;
          if (types.includes('locality')) {
            city = component.longText || '';
          } else if (types.includes('administrative_area_level_1')) {
            state = component.shortText || '';
          } else if (types.includes('postal_code')) {
            zip = component.longText || '';
          }
        }
      }

      // Format the location string
      let locationString = '';
      if (zip && city && state) {
        locationString = `${zip} - ${city}, ${state}`;
      } else if (city && state) {
        locationString = `${city}, ${state}`;
      } else if (zip) {
        locationString = zip;
      } else if (place.formattedAddress) {
        locationString = place.formattedAddress;
      } else {
        locationString = suggestion.description;
      }

      setFormData(prev => ({ ...prev, location: locationString }));
    } catch (err) {
      console.error('Failed to get place details:', err);
      setFormData(prev => ({ ...prev, location: suggestion.description }));
    }
  };

  // Handle location input blur - hide suggestions after a short delay
  // (delay allows clicking on suggestions before they disappear)
  const handleLocationBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Calculate total steps based on loan type
  // Purchase: 18 steps (added separate military branch step)
  // Refinance: 16 steps
  const getTotalSteps = () => {
    if (formData.loanType === 'purchase') return 18;
    if (formData.loanType === 'refinance') return 16;
    return 1;
  };

  // Get current step number for display
  const getDisplayStep = () => {
    return currentStep;
  };

  const handleSelect = (field: keyof FormData, value: string | boolean | null, autoAdvance: boolean = false) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');

    // Auto-advance to next step immediately if flag is set
    if (autoAdvance) {
      setCurrentStep(prev => prev + 1);
      setTimeout(scrollToTop, 100);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'location') {
      setLocationError('');
    }
  };


  const validateLocation = (location: string): boolean => {
    // Basic validation: must be at least 2 characters
    if (location.trim().length < 2) return false;
    // Check if it looks like a ZIP code, city name, or city/state format
    const zipPattern = /^\d{5}(-\d{4})?$/;
    const cityPattern = /^[a-zA-Z\s]+$/;
    const cityStatePattern = /^[a-zA-Z\s]+,\s*[A-Z]{2}$/; // "Fayetteville, AR"
    const autoPopulatedPattern = /^\d{5}\s*-\s*.+/; // "72701 - Fayetteville, AR"
    return zipPattern.test(location.trim()) ||
           cityPattern.test(location.trim()) ||
           cityStatePattern.test(location.trim()) ||
           autoPopulatedPattern.test(location.trim());
  };

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const canProceed = (): boolean => {
    // Check based on current step and loan type
    if (currentStep === 0) return !!formData.loanType;

    if (formData.loanType === 'purchase') {
      switch (currentStep) {
        case 1: return !!formData.homebuyingStage;
        case 2: return !!formData.priceRange;
        case 3: return !!formData.propertyType;
        case 4: return !!formData.purchaseTimeline;
        case 5: return formData.militaryService !== null;
        case 6: return !!formData.militaryBranch;
        case 7: return !!formData.downPaymentPercent;
        case 8: return !!formData.employmentStatus;
        case 9: return !!formData.annualIncome;
        case 10: return formData.bankruptcyHistory !== null;
        case 11: return !!formData.ownsHome;
        case 12: return formData.firstTimeBuyer !== null; // first-time buyer (skipped if owns home)
        case 13: return !!formData.creditScore;
        case 14: return validateLocation(formData.location);
        case 15: return validateEmail(formData.email);
        case 16: return !!formData.firstName && !!formData.lastName;
        case 17: return validatePhone(formData.phone);
        default: return true;
      }
    }

    if (formData.loanType === 'refinance') {
      switch (currentStep) {
        case 1: return !!formData.homeValue;
        case 2: return !!formData.propertyType;
        case 3:
          if (formData.militaryService === null) return false;
          if (formData.militaryService && !formData.militaryBranch) return false;
          return true;
        case 4: return !!formData.employmentStatus;
        case 5: return !!formData.annualIncome;
        case 6: return formData.bankruptcyHistory !== null;
        case 7: return !!formData.currentRate;
        case 8: return !!formData.mortgageBalance;
        case 9:
          if (formData.wantsCashOut === null) return false;
          if (formData.wantsCashOut && !formData.cashOutAmount) return false;
          return true;
        case 10: return !!formData.creditScore;
        case 11: return validateLocation(formData.location);
        case 12: return validateEmail(formData.email);
        case 13: return !!formData.firstName && !!formData.lastName;
        case 14: return validatePhone(formData.phone);
        default: return true;
      }
    }

    return false;
  };

  const scrollToTop = () => {
    // Simple scroll to top - scroll-behavior is already set to 'auto' via useEffect
    window.scrollTo(0, 0);
  };

  const handleNext = () => {
    const isLocationStep =
      (formData.loanType === 'purchase' && currentStep === 14) ||
      (formData.loanType === 'refinance' && currentStep === 11);

    // Hide suggestions when moving to next step
    if (isLocationStep) {
      setShowSuggestions(false);
    }

    if (!canProceed()) {
      if (isLocationStep) {
        setLocationError('Please enter a valid US location.');
      }
      return;
    }
    setCurrentStep(prev => prev + 1);
    setTimeout(scrollToTop, 50);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setTimeout(scrollToTop, 50);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/prequalify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsComplete(true);
        setCurrentStep(getTotalSteps());
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress bar percentage
  // Use actual total steps for accurate progress display
  // Always use 18 as base to keep progress bar consistent (added military branch step)
  // Start at 15% and progress from there
  const totalSteps = 18;
  const progressPercent = Math.round(15 + ((currentStep) / totalSteps) * 85);

  // Render option card
  const OptionCard = ({
    value,
    label,
    selected,
    onClick,
    sublabel,
    fullWidth = false,
  }: {
    value: string;
    label: string;
    selected: boolean;
    onClick: () => void;
    sublabel?: string;
    fullWidth?: boolean;
  }) => (
    <button
      type="button"
      className={`${styles.optionCard} ${selected ? styles.optionCardSelected : ''} ${fullWidth ? styles.optionCardFullWidth : ''}`}
      onClick={onClick}
    >
      {selected && (
        <span className={styles.checkmark}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
      )}
      <span className={styles.optionLabel}>{label}</span>
      {sublabel && <span className={styles.optionSublabel}>{sublabel}</span>}
    </button>
  );

  // Render step content
  const renderStepContent = () => {
    // Initial choice
    if (currentStep === 0) {
      return (
        <div className={styles.stepContent}>
          <h2 className={styles.question}>Are you looking to purchase or refinance a home?</h2>
          <div className={styles.optionsGrid1Col}>
            <OptionCard
              value="purchase"
              label="I want to buy a home"
              selected={formData.loanType === 'purchase'}
              onClick={() => handleSelect('loanType', 'purchase', true)}
              fullWidth
            />
            <OptionCard
              value="refinance"
              label="I want to refinance a home"
              selected={formData.loanType === 'refinance'}
              onClick={() => handleSelect('loanType', 'refinance', true)}
              fullWidth
            />
          </div>
        </div>
      );
    }

    // PURCHASE PATH
    if (formData.loanType === 'purchase') {
      switch (currentStep) {
        case 1:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Where are you at in the homebuying journey?</h2>
              <div className={styles.optionsGrid2Col}>
                {['Daydreaming', 'Looking Around', 'Getting Serious', 'Ready to Buy'].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.homebuyingStage === option}
                    onClick={() => handleSelect('homebuyingStage', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 2:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your price range?<span className={styles.questionHint}>(An estimate is fine)</span></h2>
              <div className={styles.optionsGrid2Col}>
                {[
                  '$700K or more', '$600K - $700K', '$500K - $600K', '$400K - $500K',
                  '$350K - $400K', '$300K - $350K', '$250K - $300K', '$200K - $250K',
                  '$150K - $200K', '$100K - $150K', 'Under $100K', "I don't know"
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.priceRange === option}
                    onClick={() => handleSelect('priceRange', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 3:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What type of property are you buying?</h2>
              <div className={styles.optionsGrid2Col}>
                {['Single-Family Home', 'Condominium', 'Town Home', 'Multi-Family', 'Mobile / Manufactured', 'Other'].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.propertyType === option}
                    onClick={() => handleSelect('propertyType', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 4:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>When are you planning to make your home purchase?</h2>
              <div className={styles.optionsGrid2ColLastCenter}>
                {[
                  { value: 'Immediately: Signed a Purchase Agreement', label: 'Immediately: Signed a Purchase Agreement' },
                  { value: 'ASAP: Found a House/Offer Pending', label: 'ASAP: Found a House/Offer Pending' },
                  { value: 'Within 30 Days', label: 'Within 30 Days' },
                  { value: '2 - 3 Months', label: '2 - 3 Months' },
                  { value: '3 - 6 Months', label: '3 - 6 Months' },
                  { value: '6+ Months', label: '6+ Months' },
                  { value: 'No Time Frame/Still Researching Options', label: 'No Time Frame/Still Researching Options' },
                ].map((option, index, arr) => (
                  <OptionCard
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selected={formData.purchaseTimeline === option.value}
                    onClick={() => handleSelect('purchaseTimeline', option.value, true)}
                    fullWidth={index === arr.length - 1}
                  />
                ))}
              </div>
            </div>
          );

        case 5:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Have you (or your spouse) ever served in the US military?</h2>
              <div className={styles.optionsGrid1Col}>
                <OptionCard
                  value="yes"
                  label="Yes"
                  selected={formData.militaryService === true}
                  onClick={() => handleSelect('militaryService', true, true)}
                  fullWidth
                />
                <OptionCard
                  value="no"
                  label="No"
                  selected={formData.militaryService === false}
                  onClick={() => {
                    handleSelect('militaryService', false);
                    handleSelect('militaryBranch', '');
                    setCurrentStep(7); // Skip branch question
                    setTimeout(scrollToTop, 100);
                  }}
                  fullWidth
                />
              </div>
            </div>
          );

        case 6:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your branch of service?</h2>
              <div className={styles.optionsGrid2ColLastCenter}>
                {[
                  'Army', 'Marine Corps', 'Navy', 'Air Force',
                  'Coast Guard', 'National Guard', 'Military Spouse', 'Other VA Eligibility',
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.militaryBranch === option}
                    onClick={() => handleSelect('militaryBranch', option, true)}
                  />
                ))}
                <OptionCard
                  value="No Military Experience"
                  label="No Military Experience"
                  selected={formData.militaryBranch === 'No Military Experience'}
                  onClick={() => handleSelect('militaryBranch', 'No Military Experience', true)}
                />
              </div>
            </div>
          );

        case 7:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>How much are you saving for a down payment?<span className={styles.questionHint}>(An estimate is fine)</span></h2>
              <div className={styles.optionsGrid2Col}>
                {[0, 3.5, 5, 10, 15, 20].map(percent => {
                  const rangeText = percent > 0 && formData.priceRange ? ` (${getDownPaymentRange(formData.priceRange, percent)})` : '';
                  return (
                    <OptionCard
                      key={percent}
                      value={`${percent}%`}
                      label={`${percent}%${rangeText}`}
                      selected={formData.downPaymentPercent === `${percent}%`}
                      onClick={() => handleSelect('downPaymentPercent', `${percent}%`, true)}
                    />
                  );
                })}
                <OptionCard
                  value="More than 20%"
                  label="More than 20%"
                  selected={formData.downPaymentPercent === 'More than 20%'}
                  onClick={() => handleSelect('downPaymentPercent', 'More than 20%', true)}
                />
              </div>
            </div>
          );

        case 8:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your current employment status?</h2>
              <div className={styles.optionsGrid1Col}>
                {['Employed', 'Self-Employed / 1099 Independent Contractor', 'Retired', 'Not Employed'].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.employmentStatus === option}
                    onClick={() => handleSelect('employmentStatus', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 9:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your household gross (before taxes) annual income?</h2>
              <div className={styles.optionsGrid2ColLastCenter}>
                {[
                  'Greater than $200,000',
                  '$150,000 - $200,000',
                  '$100,000 - $150,000',
                  '$75,000 - $100,000',
                  '$50,000 - $75,000',
                  '$30,000 - $50,000',
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.annualIncome === option}
                    onClick={() => handleSelect('annualIncome', option, true)}
                  />
                ))}
                <OptionCard
                  value="Less than $30,000"
                  label="Less than $30,000"
                  selected={formData.annualIncome === 'Less than $30,000'}
                  onClick={() => handleSelect('annualIncome', 'Less than $30,000', true)}
                />
              </div>
            </div>
          );

        case 10:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Have you declared bankruptcy in the past 7 years?</h2>
              <div className={styles.optionsGrid1Col}>
                <OptionCard
                  value="no"
                  label="No"
                  selected={formData.bankruptcyHistory === false}
                  onClick={() => handleSelect('bankruptcyHistory', false, true)}
                  fullWidth
                />
                <OptionCard
                  value="yes"
                  label="Yes"
                  selected={formData.bankruptcyHistory === true}
                  onClick={() => handleSelect('bankruptcyHistory', true, true)}
                  fullWidth
                />
              </div>
            </div>
          );

        case 11:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Do you currently own a home?</h2>
              <div className={styles.optionsGrid1Col}>
                <OptionCard
                  value="Yes, I currently own a home"
                  label="Yes, I Own a Home"
                  selected={formData.ownsHome === 'Yes, I currently own a home'}
                  onClick={() => {
                    handleSelect('ownsHome', 'Yes, I currently own a home');
                    // Skip first-time buyer step, go directly to credit score (step 13)
                    handleSelect('firstTimeBuyer', false); // Set a default
                    setCurrentStep(13);
                    setTimeout(scrollToTop, 100);
                  }}
                  fullWidth
                />
                <OptionCard
                  value="No, I am currently renting"
                  label="No, I'm Renting"
                  selected={formData.ownsHome === 'No, I am currently renting'}
                  onClick={() => handleSelect('ownsHome', 'No, I am currently renting', true)}
                  fullWidth
                />
                <OptionCard
                  value="No, I have other living arrangements"
                  label="No, Other Arrangements"
                  selected={formData.ownsHome === 'No, I have other living arrangements'}
                  onClick={() => handleSelect('ownsHome', 'No, I have other living arrangements', true)}
                  fullWidth
                />
              </div>
            </div>
          );

        case 12:
          // First-time buyer question (only shown if not already owning a home)
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Is this your first time purchasing a home?</h2>
              <div className={styles.optionsGrid1Col}>
                <OptionCard
                  value="yes"
                  label="Yes"
                  selected={formData.firstTimeBuyer === true}
                  onClick={() => handleSelect('firstTimeBuyer', true, true)}
                  fullWidth
                />
                <OptionCard
                  value="no"
                  label="No"
                  selected={formData.firstTimeBuyer === false}
                  onClick={() => handleSelect('firstTimeBuyer', false, true)}
                  fullWidth
                />
              </div>
            </div>
          );

        case 13:
          // Credit score question
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your current credit score?</h2>
              <div className={styles.optionsGrid2Col}>
                {[
                  'Excellent (720+)',
                  'Good (680-719)',
                  'Fair (640-679)',
                  'Below Average (620-639)',
                  'Poor (Below 620)',
                  "I don't know"
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.creditScore === option}
                    onClick={() => handleSelect('creditScore', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 14:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>
                Where will your new home be located?
                <span className={styles.questionHint}>City or Zip Code</span>
              </h2>
              <div className={styles.inputGroup}>
                <div className={styles.locationInputWrapper} ref={locationWrapperRef}>
                  <input
                    type="text"
                    className={`${styles.textInput} ${locationError ? styles.inputError : ''}`}
                    placeholder="City or Zip Code"
                    value={formData.location}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    onFocus={() => formData.location.length >= 2 && fetchSuggestions(formData.location)}
                    onBlur={handleLocationBlur}
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.locationDropdown}>
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          className={styles.locationDropdownItem}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionSelect(suggestion);
                          }}
                        >
                          <strong>{suggestion.mainText}</strong>
                          {suggestion.secondaryText && <span> {suggestion.secondaryText}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {isLoadingSuggestions && (
                    <div className={styles.loadingIcon}>
                      <svg className={styles.spinner} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    </div>
                  )}
                </div>
                {locationError && <p className={styles.errorText}>{locationError}</p>}
              </div>
            </div>
          );

        case 15:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your email address?</h2>
              <div className={styles.inputGroup}>
                <div className={styles.inputWithIcon}>
                  <input
                    type="email"
                    className={styles.textInput}
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <span className={styles.secureIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="11" width="14" height="10" rx="2" ry="2" fill="currentColor"/>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none"/>
                    </svg>
                    SECURE
                  </span>
                </div>
              </div>
            </div>
          );

        case 16:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your name?</h2>
              <div className={styles.nameInputs}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>
          );

        case 17:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your phone number?</h2>
              <div className={styles.inputGroup}>
                <input
                  type="tel"
                  className={styles.textInput}
                  placeholder="(555) 555-5555"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          );

        default:
          return null;
      }
    }

    // REFINANCE PATH
    if (formData.loanType === 'refinance') {
      switch (currentStep) {
        case 1:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is the value of your home?<span className={styles.questionHint}>(An estimate is fine)</span></h2>
              <div className={styles.optionsGrid2Col}>
                {[
                  '$700K or more', '$600K - $700K', '$500K - $600K', '$400K - $500K',
                  '$350K - $400K', '$300K - $350K', '$250K - $300K', '$200K - $250K',
                  '$150K - $200K', '$100K - $150K', 'Under $100K', "I don't know"
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.homeValue === option}
                    onClick={() => handleSelect('homeValue', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 2:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What type of property is your home?</h2>
              <div className={styles.optionsGrid2Col}>
                {['Single-Family Home', 'Condominium', 'Town Home', 'Multi-Family', 'Mobile / Manufactured', 'Other'].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.propertyType === option}
                    onClick={() => handleSelect('propertyType', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 3:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Have you (or your spouse) ever served in the US military?</h2>
              {formData.militaryService === null && (
                <div className={styles.optionsGrid1Col}>
                  <OptionCard
                    value="yes"
                    label="Yes"
                    selected={false}
                    onClick={() => handleSelect('militaryService', true)}
                    fullWidth
                  />
                  <OptionCard
                    value="no"
                    label="No"
                    selected={false}
                    onClick={() => handleSelect('militaryService', false, true)}
                    fullWidth
                  />
                </div>
              )}
              {formData.militaryService === true && (
                <>
                  <p className={styles.subQuestion}>What is your branch of service?</p>
                  <div className={styles.optionsGrid2ColLastCenter}>
                    {[
                      'Army', 'Marine Corps', 'Navy', 'Air Force',
                      'Coast Guard', 'National Guard', 'Military Spouse', 'Other VA Eligibility',
                    ].map(option => (
                      <OptionCard
                        key={option}
                        value={option}
                        label={option}
                        selected={formData.militaryBranch === option}
                        onClick={() => handleSelect('militaryBranch', option, true)}
                      />
                    ))}
                    <OptionCard
                      value="No Military Experience"
                      label="No Military Experience"
                      selected={formData.militaryBranch === 'No Military Experience'}
                      onClick={() => handleSelect('militaryBranch', 'No Military Experience', true)}
                      fullWidth
                    />
                  </div>
                </>
              )}
            </div>
          );

        case 4:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your current employment status?</h2>
              <div className={styles.optionsGrid1Col}>
                {['Employed', 'Self-Employed / 1099 Independent Contractor', 'Retired', 'Not Employed'].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.employmentStatus === option}
                    onClick={() => handleSelect('employmentStatus', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 5:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your household gross (before taxes) annual income?</h2>
              <div className={styles.optionsGrid2ColLastCenter}>
                {[
                  'Greater than $200,000',
                  '$150,000 - $200,000',
                  '$100,000 - $150,000',
                  '$75,000 - $100,000',
                  '$50,000 - $75,000',
                  '$30,000 - $50,000',
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.annualIncome === option}
                    onClick={() => handleSelect('annualIncome', option, true)}
                  />
                ))}
                <OptionCard
                  value="Less than $30,000"
                  label="Less than $30,000"
                  selected={formData.annualIncome === 'Less than $30,000'}
                  onClick={() => handleSelect('annualIncome', 'Less than $30,000', true)}
                />
              </div>
            </div>
          );

        case 6:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Have you declared bankruptcy in the past 7 years?</h2>
              <div className={styles.optionsGrid1Col}>
                <OptionCard
                  value="no"
                  label="No"
                  selected={formData.bankruptcyHistory === false}
                  onClick={() => handleSelect('bankruptcyHistory', false, true)}
                  fullWidth
                />
                <OptionCard
                  value="yes"
                  label="Yes"
                  selected={formData.bankruptcyHistory === true}
                  onClick={() => handleSelect('bankruptcyHistory', true, true)}
                  fullWidth
                />
              </div>
            </div>
          );

        case 7:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your current mortgage interest rate?</h2>
              <div className={styles.optionsGrid2Col}>
                <OptionCard
                  value="Under 4.5%"
                  label="Under 4.5%"
                  selected={formData.currentRate === 'Under 4.5%'}
                  onClick={() => handleSelect('currentRate', 'Under 4.5%', true)}
                />
                {['4.5%', '4.75%', '5%', '5.25%', '5.5%', '5.75%', '6%', '6.25%', '6.5%', '6.75%', '7%', '7.25%', '7.5%', '7.75%', '8%', '8.25%', '8.5%', '8.75%', '9%', '9.25%', '9.5%', '9.75%'].map(rate => (
                  <OptionCard
                    key={rate}
                    value={rate}
                    label={rate}
                    selected={formData.currentRate === rate}
                    onClick={() => handleSelect('currentRate', rate, true)}
                  />
                ))}
                <OptionCard
                  value="Over 10%"
                  label="Over 10%"
                  selected={formData.currentRate === 'Over 10%'}
                  onClick={() => handleSelect('currentRate', 'Over 10%', true)}
                />
                <OptionCard
                  value="I don't know"
                  label="I don't know"
                  selected={formData.currentRate === "I don't know"}
                  onClick={() => handleSelect('currentRate', "I don't know", true)}
                />
              </div>
            </div>
          );

        case 8:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>How much do you currently owe on your home mortgage?</h2>
              <div className={styles.optionsGrid2Col}>
                {[
                  'Under $100,000', '$100,000 - $150,000', '$150,000 - $200,000', '$200,000 - $250,000',
                  '$250,000 - $300,000', '$300,000 - $350,000', '$350,000 - $400,000', '$400,000 or more',
                  "I don't know"
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.mortgageBalance === option}
                    onClick={() => handleSelect('mortgageBalance', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 9:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>Would you like to use your home&apos;s equity to borrow additional cash?</h2>
              {formData.wantsCashOut === null && (
                <div className={styles.optionsGrid1Col}>
                  <OptionCard
                    value="yes"
                    label="Yes"
                    selected={false}
                    onClick={() => handleSelect('wantsCashOut', true)}
                    fullWidth
                  />
                  <OptionCard
                    value="no"
                    label="No"
                    selected={false}
                    onClick={() => handleSelect('wantsCashOut', false, true)}
                    fullWidth
                  />
                </div>
              )}
              {formData.wantsCashOut === true && (
                <>
                  <div className={styles.selectedAnswer}>
                    <span>Yes</span>
                    <button
                      type="button"
                      className={styles.changeAnswerBtn}
                      onClick={() => {
                        handleSelect('wantsCashOut', null);
                        handleSelect('cashOutAmount', '');
                      }}
                    >
                      Change answer
                    </button>
                  </div>
                  <p className={styles.subQuestion}>How much additional cash would you like to borrow?<span className={styles.questionHint}>(An estimate is fine)</span></p>
                  <div className={styles.optionsGrid2Col}>
                    {[
                      '$0 - $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000 - $20,000',
                      '$20,000 - $50,000', '$50,000 - $100,000', '$100,000 - $150,000', '$150,000 or more',
                      "I don't know"
                    ].map(option => (
                      <OptionCard
                        key={option}
                        value={option}
                        label={option}
                        selected={formData.cashOutAmount === option}
                        onClick={() => handleSelect('cashOutAmount', option, true)}
                      />
                    ))}
                  </div>
                </>
              )}
              {formData.wantsCashOut === false && (
                <div className={styles.selectedAnswer}>
                  <span>No</span>
                  <button
                    type="button"
                    className={styles.changeAnswerBtn}
                    onClick={() => handleSelect('wantsCashOut', null)}
                  >
                    Change answer
                  </button>
                </div>
              )}
            </div>
          );

        case 10:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your current credit score?</h2>
              <div className={styles.optionsGrid2Col}>
                {[
                  'Excellent (720+)',
                  'Good (680-719)',
                  'Fair (640-679)',
                  'Below Average (620-639)',
                  'Poor (Below 620)',
                  "I don't know"
                ].map(option => (
                  <OptionCard
                    key={option}
                    value={option}
                    label={option}
                    selected={formData.creditScore === option}
                    onClick={() => handleSelect('creditScore', option, true)}
                  />
                ))}
              </div>
            </div>
          );

        case 11:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>
                Where is your home located?
                <span className={styles.questionHint}>City or Zip Code</span>
              </h2>
              <div className={styles.inputGroup}>
                <div className={styles.locationInputWrapper} ref={locationWrapperRef}>
                  <input
                    type="text"
                    className={`${styles.textInput} ${locationError ? styles.inputError : ''}`}
                    placeholder="City or Zip Code"
                    value={formData.location}
                    onChange={(e) => handleLocationInputChange(e.target.value)}
                    onFocus={() => formData.location.length >= 2 && fetchSuggestions(formData.location)}
                    onBlur={handleLocationBlur}
                    autoComplete="off"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.locationDropdown}>
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId}
                          type="button"
                          className={styles.locationDropdownItem}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSuggestionSelect(suggestion);
                          }}
                        >
                          <strong>{suggestion.mainText}</strong>
                          {suggestion.secondaryText && <span> {suggestion.secondaryText}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {isLoadingSuggestions && (
                    <div className={styles.loadingIcon}>
                      <svg className={styles.spinner} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    </div>
                  )}
                </div>
                {locationError && <p className={styles.errorText}>{locationError}</p>}
              </div>
            </div>
          );

        case 12:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your email address?</h2>
              <div className={styles.inputGroup}>
                <div className={styles.inputWithIcon}>
                  <input
                    type="email"
                    className={styles.textInput}
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <span className={styles.secureIcon}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                      <rect x="5" y="11" width="14" height="10" rx="2" ry="2" fill="currentColor"/>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none"/>
                    </svg>
                    SECURE
                  </span>
                </div>
              </div>
            </div>
          );

        case 13:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your name?</h2>
              <div className={styles.nameInputs}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>
          );

        case 14:
          return (
            <div className={styles.stepContent}>
              <h2 className={styles.question}>What is your phone number?</h2>
              <div className={styles.inputGroup}>
                <input
                  type="tel"
                  className={styles.textInput}
                  placeholder="(555) 555-5555"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          );

        case 15:
          return (
            <div className={styles.stepContent}>
              <div className={styles.successContent}>
                <div className={styles.successIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2 className={styles.successTitle}>Thanks, {formData.firstName}!</h2>
                <p className={styles.successMessage}>
                  We have received your information and a specialist will reach out soon.
                </p>
                <div className={styles.emailConfirmation}>
                  <span>Your email address</span>
                  <strong>{formData.email}</strong>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    }

    return null;
  };

  // Completion screen for purchase path
  if (isComplete && formData.loanType === 'purchase') {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.stepContent}>
            <div className={styles.successContent}>
              <div className={styles.successIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className={styles.successTitle}>Thanks, {formData.firstName}!</h2>
              <p className={styles.successMessage}>
                We have received your information and a specialist will reach out soon.
              </p>
              <div className={styles.emailConfirmation}>
                <span>Your email address</span>
                <strong>{formData.email}</strong>
              </div>
              <Link href="/" className={styles.returnHomeBtn}>
                Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine if we're on the final submit step
  const isFinalStep = (formData.loanType === 'purchase' && currentStep === 17) ||
                      (formData.loanType === 'refinance' && currentStep === 14);

  // Determine if current step requires text input (needs Continue button)
  const isTextInputStep = () => {
    if (formData.loanType === 'purchase') {
      return [14, 15, 16].includes(currentStep); // location, email, name
    }
    if (formData.loanType === 'refinance') {
      return [11, 12, 13].includes(currentStep); // location, email, name
    }
    return false;
  };

  // Check if refinance completion step
  if (formData.loanType === 'refinance' && currentStep === 15) {
    return (
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          {renderStepContent()}
          <div className={styles.navigationSingle}>
            <Link href="/" className={styles.returnHomeBtn}>
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hidden scroll anchor for iOS */}
      <div id="top" style={{ position: 'absolute', top: 0 }} />
      <button
        ref={scrollAnchorRef}
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, pointerEvents: 'none', height: 0, width: 0, border: 'none', padding: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div className={styles.formWrapper}>
        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${progressPercent}%`,
                transition: isInitialMount ? 'none' : undefined
              }}
            />
          </div>
          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            <span className={styles.stepText}>Step {currentStep + 1} of {totalSteps}</span>
          </div>
        </div>

        {/* Step Content */}
        <div key={currentStep}>
          {renderStepContent()}
        </div>

        {/* Error Display */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className={styles.navigation}>
          {/* Continue/Submit buttons */}
          <div className={styles.navigationButtons}>
            {isFinalStep ? (
              <button
                type="button"
                className={`${styles.submitBtn} ${!canProceed() || isSubmitting ? styles.submitBtnDisabled : ''}`}
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Get My Quote'}
              </button>
            ) : isTextInputStep() ? (
              <button
                type="button"
                className={`${styles.continueBtn} ${!canProceed() ? styles.continueBtnDisabled : ''}`}
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue
              </button>
            ) : null}
          </div>

        </div>

        {/* Privacy text - shown on email step */}
        {((formData.loanType === 'purchase' && currentStep === 15) ||
          (formData.loanType === 'refinance' && currentStep === 12)) && (
          <p className={styles.privacyText}>
            <strong>Your information is secure.</strong> Continuing here means you agree to our{' '}
            <Link href="/privacy-policy">privacy policy</Link> and to receive information
            from American Mortgage and its affiliates about your benefits.
          </p>
        )}

        {/* Back button - centered underneath */}
        {currentStep > 0 && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBack}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
