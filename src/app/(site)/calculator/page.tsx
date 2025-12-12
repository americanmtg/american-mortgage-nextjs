'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './calculator.css';

interface LoanTypeConfig {
  name: string;
  label: string;
  minDownPayment: number;
  enabled: boolean;
}

interface CalculatorSettings {
  loanTypes: LoanTypeConfig[];
  propertyInsuranceRate: number;
  propertyTaxRate: number;
  minPurchasePrice: number;
  maxPurchasePrice: number;
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
}

const defaultSettings: CalculatorSettings = {
  loanTypes: [
    { name: 'FHA', label: 'FHA', minDownPayment: 3.5, enabled: true },
    { name: 'Conventional', label: 'Conventional', minDownPayment: 3, enabled: true },
    { name: 'USDA', label: 'USDA', minDownPayment: 0, enabled: true },
    { name: 'VA', label: 'VA', minDownPayment: 0, enabled: true },
    { name: 'Non-QM', label: 'Non-QM / Investor', minDownPayment: 10, enabled: true },
  ],
  propertyInsuranceRate: 1.0,
  propertyTaxRate: 1.0,
  minPurchasePrice: 50000,
  maxPurchasePrice: 2000000,
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
};

export default function CalculatorPage() {
  const [settings, setSettings] = useState<CalculatorSettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [loanType, setLoanType] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState(defaultSettings.defaultPurchasePrice);
  const [purchasePriceInput, setPurchasePriceInput] = useState(defaultSettings.defaultPurchasePrice.toString());
  const [isPurchasePriceFocused, setIsPurchasePriceFocused] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | null>(null);
  const [isCustomDownPayment, setIsCustomDownPayment] = useState(false);
  const [customDownPayment, setCustomDownPayment] = useState('');
  const [customDownPaymentInput, setCustomDownPaymentInput] = useState('');
  const [isCustomDownPaymentFocused, setIsCustomDownPaymentFocused] = useState(false);
  const [interestRate, setInterestRate] = useState(defaultSettings.defaultInterestRate);
  const [interestRateInput, setInterestRateInput] = useState(defaultSettings.defaultInterestRate.toString());
  const [isInterestRateFocused, setIsInterestRateFocused] = useState(false);
  const [loanTerm, setLoanTerm] = useState(30);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [customInsurance, setCustomInsurance] = useState<string>('');
  const [customInsuranceInput, setCustomInsuranceInput] = useState('');
  const [isCustomInsuranceFocused, setIsCustomInsuranceFocused] = useState(false);
  const [customTaxes, setCustomTaxes] = useState<string>('');
  const [customTaxesInput, setCustomTaxesInput] = useState('');
  const [isCustomTaxesFocused, setIsCustomTaxesFocused] = useState(false);

  const purchasePriceSliderRef = useRef<HTMLInputElement>(null);
  const interestRateSliderRef = useRef<HTMLInputElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/calculator');
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            setSettings(result.data);
            // Set initial values from settings
            setPurchasePrice(result.data.defaultPurchasePrice || defaultSettings.defaultPurchasePrice);
            setPurchasePriceInput((result.data.defaultPurchasePrice || defaultSettings.defaultPurchasePrice).toString());
            setInterestRate(result.data.defaultInterestRate || defaultSettings.defaultInterestRate);
            setInterestRateInput((result.data.defaultInterestRate || defaultSettings.defaultInterestRate).toString());
          }
        }
      } catch (err) {
        console.error('Error fetching calculator settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    }
    fetchSettings();
  }, []);

  // Get enabled loan types
  const enabledLoanTypes = settings.loanTypes.filter(lt => lt.enabled);

  // Build loan type minimums map - memoized to prevent useEffect from firing on every render
  const loanTypeMinimums = useMemo(() => {
    const minimums: Record<string, number> = {};
    settings.loanTypes.forEach(lt => {
      minimums[lt.name] = lt.minDownPayment;
    });
    return minimums;
  }, [settings.loanTypes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyDecimal = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const updateSliderBackground = useCallback((slider: HTMLInputElement | null, value: number, min: number, max: number) => {
    if (!slider) return;
    const percent = ((value - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #181F53 ${percent}%, #E5E5E5 ${percent}%)`;
  }, []);

  const getDownPaymentOptions = (type: string) => {
    if (!type) return [];
    const minimum = loanTypeMinimums[type] || 0;
    const options: (number | 'custom')[] = [minimum];
    [5, 10, 20].forEach((pct) => {
      if (pct > minimum && !options.includes(pct)) {
        options.push(pct);
      }
    });
    options.push('custom');
    return options;
  };

  const getValidation = () => {
    if (!isCustomDownPayment || !loanType || !customDownPayment) {
      return null;
    }

    const minimumPercent = loanTypeMinimums[loanType] || 0;
    const minimumAmount = (minimumPercent / 100) * purchasePrice;
    const customAmount = parseFloat(customDownPayment) || 0;

    if (customAmount > purchasePrice) {
      return {
        type: 'warning',
        message: `Down payment cannot exceed purchase price of ${formatCurrency(purchasePrice)}`,
      };
    }

    if (customAmount < minimumAmount) {
      return {
        type: 'error',
        message: `Minimum down payment for ${loanType} is ${formatCurrency(minimumAmount)} (${minimumPercent}%)`,
      };
    }

    return {
      type: 'success',
      message: `Down payment meets ${loanType} requirements`,
    };
  };

  const validation = getValidation();

  // Calculate payments
  let downPaymentAmount = 0;
  if (isCustomDownPayment && customDownPayment) {
    downPaymentAmount = parseFloat(customDownPayment) || 0;
  } else if (downPaymentPercent !== null) {
    downPaymentAmount = (downPaymentPercent / 100) * purchasePrice;
  }

  const loanAmount = purchasePrice - downPaymentAmount;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  let monthlyPI = 0;
  if (monthlyRate > 0 && loanAmount > 0) {
    monthlyPI =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else if (loanAmount > 0) {
    monthlyPI = loanAmount / numPayments;
  }

  // Use custom values if provided, otherwise calculate from rates
  const defaultMonthlyInsurance = (purchasePrice * (settings.propertyInsuranceRate / 100)) / 12;
  const defaultMonthlyTaxes = (purchasePrice * (settings.propertyTaxRate / 100)) / 12;
  const monthlyInsurance = customInsurance ? parseFloat(customInsurance) : defaultMonthlyInsurance;
  const monthlyTaxes = customTaxes ? parseFloat(customTaxes) : defaultMonthlyTaxes;

  // Calculate LTV (Loan-to-Value) ratio
  const ltv = purchasePrice > 0 ? (loanAmount / purchasePrice) * 100 : 0;

  // Calculate MIP for FHA loans
  let monthlyMip = 0;
  let mipRate = 0;
  if (loanType === 'FHA' && loanAmount > 0) {
    // FHA MIP rate depends on LTV
    mipRate = ltv > settings.fhaMipLtvThreshold ? settings.fhaMipRateHigh : settings.fhaMipRateLow;
    monthlyMip = (loanAmount * (mipRate / 100)) / 12;
  }

  // Calculate PMI for Conventional loans (required when LTV > pmiLtvCutoff)
  let monthlyPmi = 0;
  let pmiRate = 0;
  if (loanType === 'Conventional' && ltv > settings.pmiLtvCutoff && loanAmount > 0) {
    pmiRate = settings.conventionalPmiRate;
    monthlyPmi = (loanAmount * (pmiRate / 100)) / 12;
  }

  // Calculate total monthly payment
  const totalMonthly = monthlyPI + monthlyInsurance + monthlyTaxes + monthlyMip + monthlyPmi;

  // Helper to replace {rate} placeholder in subtext
  const formatSubtext = (template: string, rate: number) => {
    return template.replace('{rate}', rate.toString());
  };

  // Update slider backgrounds
  useEffect(() => {
    updateSliderBackground(purchasePriceSliderRef.current, purchasePrice, settings.minPurchasePrice, settings.maxPurchasePrice);
  }, [purchasePrice, settings.minPurchasePrice, settings.maxPurchasePrice, updateSliderBackground]);

  useEffect(() => {
    updateSliderBackground(interestRateSliderRef.current, interestRate, settings.minInterestRate, settings.maxInterestRate);
  }, [interestRate, settings.minInterestRate, settings.maxInterestRate, updateSliderBackground]);

  // Reset down payment when loan type changes
  useEffect(() => {
    if (loanType) {
      setDownPaymentPercent(loanTypeMinimums[loanType] || 0);
      setIsCustomDownPayment(false);
      setCustomDownPayment('');
    } else {
      setDownPaymentPercent(null);
    }
  }, [loanType, loanTypeMinimums]);

  const handlePurchasePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPurchasePriceInput(value);
  };

  const handlePurchasePriceBlur = () => {
    setIsPurchasePriceFocused(false);
    const numValue = parseInt(purchasePriceInput) || settings.minPurchasePrice;
    const clampedValue = Math.min(Math.max(numValue, settings.minPurchasePrice), settings.maxPurchasePrice);
    setPurchasePrice(clampedValue);
    setPurchasePriceInput(clampedValue.toString());
  };

  const handlePurchasePriceFocus = () => {
    setIsPurchasePriceFocused(true);
    setPurchasePriceInput('');
  };

  const handleInterestRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setInterestRateInput(value);
  };

  const handleInterestRateBlur = () => {
    setIsInterestRateFocused(false);
    const numValue = parseFloat(interestRateInput) || settings.minInterestRate;
    const clampedValue = Math.min(Math.max(numValue, settings.minInterestRate), settings.maxInterestRate);
    setInterestRate(clampedValue);
    setInterestRateInput(clampedValue.toString());
  };

  const handleInterestRateFocus = () => {
    setIsInterestRateFocused(true);
    setInterestRateInput('');
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'custom') {
      setIsCustomDownPayment(true);
      setDownPaymentPercent(null);
    } else {
      setIsCustomDownPayment(false);
      setDownPaymentPercent(parseFloat(e.target.value));
      setCustomDownPayment('');
    }
  };

  const handleCustomDownPaymentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomDownPaymentInput(value);
    // Also update the actual value for real-time calculations
    setCustomDownPayment(value);
  };

  const handleCustomDownPaymentBlur = () => {
    setIsCustomDownPaymentFocused(false);
    const numValue = parseInt(customDownPaymentInput) || 0;
    setCustomDownPayment(numValue.toString());
    setCustomDownPaymentInput(numValue.toString());
  };

  const handleCustomDownPaymentFocus = () => {
    setIsCustomDownPaymentFocused(true);
    setCustomDownPaymentInput(customDownPayment || '');
  };

  // Custom insurance handlers
  const handleCustomInsuranceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomInsuranceInput(value);
    setCustomInsurance(value);
  };

  const handleCustomInsuranceBlur = () => {
    setIsCustomInsuranceFocused(false);
    const numValue = parseFloat(customInsuranceInput) || 0;
    if (numValue > 0) {
      setCustomInsurance(numValue.toString());
      setCustomInsuranceInput(numValue.toString());
    } else {
      setCustomInsurance('');
      setCustomInsuranceInput('');
    }
  };

  const handleCustomInsuranceFocus = () => {
    setIsCustomInsuranceFocused(true);
    setCustomInsuranceInput(customInsurance || '');
  };

  // Custom taxes handlers
  const handleCustomTaxesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomTaxesInput(value);
    setCustomTaxes(value);
  };

  const handleCustomTaxesBlur = () => {
    setIsCustomTaxesFocused(false);
    const numValue = parseFloat(customTaxesInput) || 0;
    if (numValue > 0) {
      setCustomTaxes(numValue.toString());
      setCustomTaxesInput(numValue.toString());
    } else {
      setCustomTaxes('');
      setCustomTaxesInput('');
    }
  };

  const handleCustomTaxesFocus = () => {
    setIsCustomTaxesFocused(true);
    setCustomTaxesInput(customTaxes || '');
  };

  const downPaymentOptions = getDownPaymentOptions(loanType);

  // Show loading state until settings are loaded
  if (!settingsLoaded) {
    return (
      <div className="calc-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#181F53]"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="calc-container"
      style={{
        '--slider-thumb-size': `${settings.sliderThumbSize}px`,
        '--slider-track-height': `${settings.sliderTrackHeight}px`,
      } as React.CSSProperties}
    >
      <h1 className="calc-title">{settings.pageTitle}</h1>
      <div className="calc-layout">
        <div className="calc-input-section">
          {/* Loan Type */}
          <div className="calc-input-group">
            <label className="calc-label">Loan Type</label>
            <div className="calc-select-wrapper">
              <select
                className="calc-select"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value)}
              >
                <option value="">Select Value</option>
                {enabledLoanTypes.map((lt) => (
                  <option key={lt.name} value={lt.name}>
                    {lt.label}
                  </option>
                ))}
              </select>
              <span className="calc-select-arrow">▼</span>
            </div>
          </div>

          {/* Purchase Price */}
          <div className="calc-input-group">
            <div className="calc-label-row">
              <label className="calc-label">Purchase Price</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="calc-value-input"
                value={isPurchasePriceFocused ? purchasePriceInput : formatCurrency(purchasePrice)}
                onChange={handlePurchasePriceInputChange}
                onFocus={handlePurchasePriceFocus}
                onBlur={handlePurchasePriceBlur}
                placeholder="Enter price"
              />
            </div>
            <input
              ref={purchasePriceSliderRef}
              type="range"
              className="calc-slider"
              min={settings.minPurchasePrice}
              max={settings.maxPurchasePrice}
              step={5000}
              value={purchasePrice}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPurchasePrice(val);
                setPurchasePriceInput(val.toString());
              }}
            />
          </div>

          {/* Down Payment */}
          <div className="calc-input-group">
            <label className="calc-label">Down Payment</label>
            <div className="calc-select-wrapper">
              <select
                className="calc-select"
                value={isCustomDownPayment ? 'custom' : (downPaymentPercent ?? '')}
                onChange={handleDownPaymentChange}
                disabled={!loanType}
              >
                <option value="">Select Value</option>
                {downPaymentOptions.map((option) => {
                  if (option === 'custom') {
                    return (
                      <option key="custom" value="custom">
                        Custom
                      </option>
                    );
                  }
                  const amount = (option / 100) * purchasePrice;
                  const isMinimum = option === loanTypeMinimums[loanType];
                  return (
                    <option key={option} value={option}>
                      {option}% ({formatCurrency(amount)}){isMinimum ? ' - Minimum' : ''}
                    </option>
                  );
                })}
              </select>
              <span className="calc-select-arrow">▼</span>
            </div>
            <div className={`calc-custom-input-wrapper ${isCustomDownPayment ? 'visible' : ''}`}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`calc-value-input full-width ${validation?.type || ''}`}
                placeholder="Enter down payment amount"
                value={isCustomDownPaymentFocused ? customDownPaymentInput : (customDownPayment ? formatCurrency(parseInt(customDownPayment)) : '')}
                onChange={handleCustomDownPaymentInput}
                onFocus={handleCustomDownPaymentFocus}
                onBlur={handleCustomDownPaymentBlur}
              />
              {validation?.type === 'error' && (
                <div className="calc-error-message">
                  <svg className="calc-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="13"></line>
                    <circle cx="12" cy="16.5" r="0.5" fill="currentColor"></circle>
                  </svg>
                  <span>{validation.message}</span>
                </div>
              )}
              {validation?.type === 'success' && (
                <div className="calc-success-message">
                  <svg className="calc-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="9 12 11.5 14.5 16 10"></polyline>
                  </svg>
                  <span>{validation.message}</span>
                </div>
              )}
              {validation?.type === 'warning' && (
                <div className="calc-warning-message">
                  <svg className="calc-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="13"></line>
                    <circle cx="12" cy="16.5" r="0.5" fill="currentColor"></circle>
                  </svg>
                  <span>{validation.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Interest Rate */}
          <div className="calc-input-group">
            <div className="calc-label-row">
              <label className="calc-label">Interest Rate</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                className="calc-value-input"
                value={isInterestRateFocused ? interestRateInput : `${interestRate}%`}
                onChange={handleInterestRateInputChange}
                onFocus={handleInterestRateFocus}
                onBlur={handleInterestRateBlur}
                placeholder="Enter rate"
              />
            </div>
            <input
              ref={interestRateSliderRef}
              type="range"
              className="calc-slider"
              min={settings.minInterestRate}
              max={settings.maxInterestRate}
              step={0.1}
              value={interestRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setInterestRate(val);
                setInterestRateInput(val.toString());
              }}
            />
          </div>

          {/* Loan Term */}
          <div className="calc-input-group">
            <label className="calc-label">Loan Term</label>
            <div className="calc-select-wrapper">
              <select
                className="calc-select"
                value={loanTerm}
                onChange={(e) => setLoanTerm(parseInt(e.target.value))}
              >
                <option value={15}>15 years</option>
                <option value={30}>30 years</option>
              </select>
              <span className="calc-select-arrow">▼</span>
            </div>
          </div>
        </div>

        <div className="calc-results-section">
          <div className="calc-results-card">
            <h2 className="calc-results-title">{settings.resultsTitle}</h2>
            <p className="calc-monthly-amount">{formatCurrency(Math.round(monthlyPI))}</p>
            <p className="calc-results-subtext">{settings.resultsSubtext}</p>

            {/* Estimated Total */}
            <div className="calc-breakdown-item" style={{ borderBottom: '1px solid #e0e0e0', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <p className="calc-breakdown-label">Estimated Total</p>
                <p className="calc-breakdown-subtext">P&I + Insurance + Taxes{monthlyMip > 0 ? ' + MIP' : ''}{monthlyPmi > 0 ? ' + PMI' : ''}</p>
              </div>
              <p className="calc-breakdown-value" style={{ fontWeight: '700', fontSize: '16px' }}>{formatCurrencyDecimal(totalMonthly)}</p>
            </div>

            {/* Advanced Settings Collapsible */}
            <div className="calc-advanced-section">
              <button
                type="button"
                className="calc-advanced-toggle"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#181F53',
                }}
              >
                <span>Advanced Settings</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {advancedOpen && (
                <div className="calc-advanced-content" style={{ paddingTop: '8px' }}>
                  {/* Principal & Interest */}
                  <div className="calc-breakdown-item">
                    <div>
                      <p className="calc-breakdown-label">{settings.piLabel}</p>
                      <p className="calc-breakdown-subtext">{formatSubtext(settings.piSubtext, interestRate)}</p>
                    </div>
                    <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyPI)}</p>
                  </div>

                  {/* FHA MIP - only shown for FHA loans */}
                  {loanType === 'FHA' && monthlyMip > 0 && (
                    <div className="calc-breakdown-item">
                      <div>
                        <p className="calc-breakdown-label">{settings.mipLabel}</p>
                        <p className="calc-breakdown-subtext">{formatSubtext(settings.mipSubtext, mipRate)}</p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyMip)}</p>
                    </div>
                  )}

                  {/* Conventional PMI - only shown when LTV > 80% */}
                  {loanType === 'Conventional' && monthlyPmi > 0 && (
                    <div className="calc-breakdown-item">
                      <div>
                        <p className="calc-breakdown-label">{settings.pmiLabel}</p>
                        <p className="calc-breakdown-subtext">{formatSubtext(settings.pmiSubtext, pmiRate)}</p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyPmi)}</p>
                    </div>
                  )}

                  {/* Property Insurance - with custom input */}
                  <div className="calc-breakdown-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p className="calc-breakdown-label">{settings.insuranceLabel}</p>
                        <p className="calc-breakdown-subtext">
                          {customInsurance ? 'Custom amount' : formatSubtext(settings.insuranceSubtext, settings.propertyInsuranceRate)}
                        </p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyInsurance)}</p>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      className="calc-value-input full-width"
                      placeholder="Enter custom monthly amount"
                      value={isCustomInsuranceFocused ? customInsuranceInput : (customInsurance ? formatCurrencyDecimal(parseFloat(customInsurance)) : '')}
                      onChange={handleCustomInsuranceInput}
                      onFocus={handleCustomInsuranceFocus}
                      onBlur={handleCustomInsuranceBlur}
                      style={{ fontSize: '16px', padding: '8px 12px' }}
                    />
                  </div>

                  {/* Property Taxes - with custom input */}
                  <div className="calc-breakdown-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p className="calc-breakdown-label">{settings.taxesLabel}</p>
                        <p className="calc-breakdown-subtext">
                          {customTaxes ? 'Custom amount' : formatSubtext(settings.taxesSubtext, settings.propertyTaxRate)}
                        </p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyTaxes)}</p>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      className="calc-value-input full-width"
                      placeholder="Enter custom monthly amount"
                      value={isCustomTaxesFocused ? customTaxesInput : (customTaxes ? formatCurrencyDecimal(parseFloat(customTaxes)) : '')}
                      onChange={handleCustomTaxesInput}
                      onFocus={handleCustomTaxesFocus}
                      onBlur={handleCustomTaxesBlur}
                      style={{ fontSize: '16px', padding: '8px 12px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="calc-cta-section">
              <h3 className="calc-cta-title">{settings.ctaTitle}</h3>
              <p className="calc-cta-text">{settings.ctaText}</p>
              <a
                href={settings.ctaButtonUrl}
                className="calc-cta-button"
                style={{
                  backgroundColor: settings.ctaButtonColor,
                  color: settings.ctaButtonTextColor
                }}
              >
                {settings.ctaButtonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
