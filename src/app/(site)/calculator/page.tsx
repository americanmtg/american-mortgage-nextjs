'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './calculator.css';
import { generateQuotePDF } from '@/lib/pdf/generate-quote-pdf';
import { searchZipCodes, getTaxRateByZip, ArkansasZipData } from '@/data/arkansas-zip-data';

interface LoanTypeConfig {
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
  loanTypes: LoanTypeConfig[];
  propertyInsuranceRate: number;
  propertyTaxRate: number;
  homesteadTaxCredit?: number;
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
  disclaimerText?: string;
  disclaimerCollapsible?: boolean;
  // CTA settings
  ctaTextEnabled?: boolean;
  // Quote settings
  quotePhoneRequired?: boolean;
  quoteEmailRequired?: boolean;
  // Download Quote Button
  downloadQuoteButtonText?: string;
  downloadQuoteButtonColor?: string;
  downloadQuoteButtonFullWidth?: boolean;
  quoteFormButtonColor?: string;
  faqItems?: FAQItem[];
}

interface CompanyInfo {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  nmls: string;
  applyUrl: string;
}

const defaultSettings: CalculatorSettings = {
  loanTypes: [
    { name: 'FHA', label: 'FHA', minDownPayment: 3.5, maxLoanAmount: 524225, enabled: true },
    { name: 'Conventional', label: 'Conventional', minDownPayment: 3, maxLoanAmount: 806500, enabled: true },
    { name: 'USDA', label: 'USDA', minDownPayment: 0, maxLoanAmount: 0, enabled: true },
    { name: 'VA', label: 'VA', minDownPayment: 0, maxLoanAmount: 0, enabled: true },
    { name: 'Non-QM', label: 'Non-QM / Investor', minDownPayment: 10, maxLoanAmount: 0, enabled: true },
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
  faqItems: [
    { id: 'faq-1', question: 'What are the current FHA loan limits for Arkansas?', answer: 'For 2025, the FHA loan limit in Arkansas is $524,225 for single-family homes. This limit applies to most counties in Arkansas. If you need a larger loan amount, you may want to consider a Conventional loan with limits up to $806,500.', enabled: true },
    { id: 'faq-2', question: 'What is MIP and how does it affect my payment?', answer: 'MIP (Mortgage Insurance Premium) is required on all FHA loans regardless of down payment. The annual MIP rate is typically 0.55% of the loan amount for loans with LTV over 95%, or 0.50% for LTV at or below 95%. This is divided by 12 and added to your monthly payment. MIP is required for the life of most FHA loans.', enabled: true },
    { id: 'faq-3', question: 'What is PMI and when is it required?', answer: 'PMI (Private Mortgage Insurance) is required on Conventional loans when your down payment is less than 20%. The rate varies based on credit score and LTV, typically ranging from 0.5% to 1.5% annually. Unlike FHA MIP, PMI can be removed once you reach 20% equity in your home.', enabled: true },
    { id: 'faq-4', question: 'What is the difference between FHA and Conventional loans?', answer: 'FHA loans are government-backed with lower credit score requirements (580+) and down payments (3.5%), but require MIP for the life of the loan. Conventional loans require higher credit scores (620+) but PMI can be removed at 20% equity. Conventional loans also have higher loan limits ($806,500 vs $524,225 for FHA).', enabled: true },
    { id: 'faq-5', question: 'How much down payment do I need?', answer: 'Down payment requirements vary by loan type: FHA requires 3.5% minimum, Conventional requires 3% minimum (with PMI), VA and USDA offer 0% down options for eligible borrowers, and Non-QM/Investor loans typically require 10%+ down. Use the calculator to see how different down payments affect your monthly payment.', enabled: true },
    { id: 'faq-6', question: 'What are Conventional loan limits?', answer: 'For 2025, the Conventional conforming loan limit is $806,500 for single-family homes in most areas. Loans above this amount are considered "Jumbo" loans and may have different requirements. High-cost areas have higher limits, but Arkansas uses the standard limit.', enabled: true },
    { id: 'faq-7', question: 'What is a Jumbo loan?', answer: 'A Jumbo loan is a mortgage that exceeds the conforming loan limits ($806,500 for 2025). These loans typically require larger down payments (10-20%), higher credit scores (700+), and may have slightly higher interest rates. They are used for purchasing higher-priced homes.', enabled: true },
    { id: 'faq-8', question: 'How is my monthly payment calculated?', answer: 'Your monthly payment consists of: Principal & Interest (based on loan amount, interest rate, and term), Property Taxes (varies by county, typically 0.4-0.7% in Arkansas), Property Insurance (estimated at ~0.5% annually, or $500 per $100k), and Mortgage Insurance (MIP for FHA or PMI for Conventional with <20% down). This calculator estimates all these components. You can enter your Arkansas ZIP code in Advanced Settings to get your county\'s actual tax rate.', enabled: true },
    { id: 'faq-9', question: 'Can I remove mortgage insurance from my loan?', answer: 'For Conventional loans, PMI can be removed when you reach 20% equity through payments or appreciation. For FHA loans taken after 2013, MIP is required for the life of the loan if your down payment was less than 10%. If you put 10% or more down on an FHA loan, MIP can be removed after 11 years.', enabled: true },
    { id: 'faq-10', question: 'What credit score do I need for each loan type?', answer: 'Minimum credit scores vary by loan type: FHA requires 580+ for 3.5% down (500-579 requires 10% down), Conventional typically requires 620+, VA loans generally require 620+, USDA requires 640+, and Non-QM/Investor loans may accept lower scores with larger down payments.', enabled: true },
  ],
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

  // Zip code lookup state
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [zipSuggestions, setZipSuggestions] = useState<ArkansasZipData[]>([]);
  const [showZipSuggestions, setShowZipSuggestions] = useState(false);
  const [selectedZipInfo, setSelectedZipInfo] = useState<{ county: string; city: string; taxRate: number } | null>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // FAQ state
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);

  // Disclaimer dropdown state
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteFirstName, setQuoteFirstName] = useState('');
  const [quoteLastName, setQuoteLastName] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [quoteFormErrors, setQuoteFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }>({});

  const purchasePriceSliderRef = useRef<HTMLInputElement>(null);
  const interestRateSliderRef = useRef<HTMLInputElement>(null);
  const downPaymentSliderRef = useRef<HTMLInputElement>(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/calculator');
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            // Merge saved loan types with defaults to include new fields like maxLoanAmount
            const savedLoanTypes = result.data.loanTypes || [];
            const mergedLoanTypes = defaultSettings.loanTypes.map(defaultLt => {
              const savedLt = savedLoanTypes.find((s: LoanTypeConfig) => s.name === defaultLt.name);
              if (savedLt) {
                return { ...defaultLt, ...savedLt };
              }
              return defaultLt;
            });
            // Add any custom loan types from saved settings that aren't in defaults
            savedLoanTypes.forEach((savedLt: LoanTypeConfig) => {
              if (!defaultSettings.loanTypes.find(d => d.name === savedLt.name)) {
                mergedLoanTypes.push({ ...savedLt, maxLoanAmount: savedLt.maxLoanAmount || 0 });
              }
            });

            // Merge settings with defaults to include new fields
            const mergedSettings = {
              ...defaultSettings,
              ...result.data,
              loanTypes: mergedLoanTypes,
            };
            setSettings(mergedSettings);
            // Set initial values from settings
            setPurchasePrice(result.data.defaultPurchasePrice || defaultSettings.defaultPurchasePrice);
            setPurchasePriceInput((result.data.defaultPurchasePrice || defaultSettings.defaultPurchasePrice).toString());
            setInterestRate(result.data.defaultInterestRate || defaultSettings.defaultInterestRate);
            setInterestRateInput((result.data.defaultInterestRate || defaultSettings.defaultInterestRate).toString());
            // Set default loan type to FHA if enabled
            const fhaLoan = mergedLoanTypes.find((lt: LoanTypeConfig) => lt.name === 'FHA' && lt.enabled);
            if (fhaLoan) {
              setLoanType('FHA');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching calculator settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    }

    async function fetchCompanyInfo() {
      try {
        const [siteRes, footerRes] = await Promise.all([
          fetch('/api/settings/site'),
          fetch('/api/settings/footer')
        ]);

        if (siteRes.ok && footerRes.ok) {
          const siteData = await siteRes.json();
          const footerData = await footerRes.json();

          const site = siteData.data || {};
          const footer = footerData.data || {};

          // Extract NMLS from footer nmls_info field
          const nmlsMatch = (footer.nmls_info || footer.nmlsInfo || '').match(/NMLS\s*(?:ID\s*)?#?\s*(\d+)/i);
          const nmls = nmlsMatch ? `NMLS #${nmlsMatch[1]}` : 'NMLS #2676687';

          setCompanyInfo({
            companyName: site.companyName || 'American Mortgage',
            phone: site.phone || '870-926-4052',
            email: site.email || 'hello@americanmtg.com',
            address: site.address || '122 CR 7185, Jonesboro, AR 72405',
            nmls,
            applyUrl: 'americanmtg.com/apply'
          });
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
        // Use defaults
        setCompanyInfo({
          companyName: 'American Mortgage',
          phone: '870-926-4052',
          email: 'hello@americanmtg.com',
          address: '122 CR 7185, Jonesboro, AR 72405',
          nmls: 'NMLS #2676687',
          applyUrl: 'americanmtg.com/apply'
        });
      }
    }

    fetchSettings();
    fetchCompanyInfo();
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

  // Build loan type max amounts map (0 means no limit)
  const loanTypeMaxAmounts = useMemo(() => {
    const maxAmounts: Record<string, number> = {};
    settings.loanTypes.forEach(lt => {
      maxAmounts[lt.name] = lt.maxLoanAmount || 0;
    });
    return maxAmounts;
  }, [settings.loanTypes]);

  // Get current loan type's max loan amount (0 means no limit)
  const currentMaxLoanAmount = loanType ? (loanTypeMaxAmounts[loanType] || 0) : 0;

  // Calculate effective slider max based on loan type limit
  const effectiveSliderMax = useMemo(() => {
    if (currentMaxLoanAmount > 0) {
      // Use loan type limit, but cap at sliderMaxPurchasePrice setting
      return Math.min(currentMaxLoanAmount, settings.sliderMaxPurchasePrice || 1000000);
    }
    return settings.sliderMaxPurchasePrice || 1000000;
  }, [currentMaxLoanAmount, settings.sliderMaxPurchasePrice]);

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
    const color = settings.sliderColor || '#181F53';
    slider.style.background = `linear-gradient(to right, ${color} ${percent}%, #E5E5E5 ${percent}%)`;
  }, [settings.sliderColor]);

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

  // Check if loan amount exceeds the limit for this loan type
  const getLoanLimitWarning = () => {
    if (!loanType || currentMaxLoanAmount === 0) return null;

    if (loanAmount > currentMaxLoanAmount) {
      // Find alternative loan types with higher limits
      const alternatives = enabledLoanTypes
        .filter(lt => lt.name !== loanType && (lt.maxLoanAmount === 0 || lt.maxLoanAmount >= loanAmount))
        .map(lt => lt.label);

      let suggestion = '';
      if (alternatives.includes('Conventional') && loanType === 'FHA') {
        suggestion = 'Consider switching to Conventional or increasing your down payment.';
      } else if (alternatives.some(a => a.includes('Non-QM') || a.includes('Jumbo'))) {
        suggestion = 'Consider switching to Non-QM/Jumbo or increasing your down payment.';
      } else {
        suggestion = 'Consider increasing your down payment.';
      }

      return {
        type: 'warning',
        message: `${loanType} limit is ${formatCurrency(currentMaxLoanAmount)}. Your loan amount is ${formatCurrency(loanAmount)}. ${suggestion}`,
      };
    }
    return null;
  };

  const loanLimitWarning = getLoanLimitWarning();

  let monthlyPI = 0;
  if (monthlyRate > 0 && loanAmount > 0) {
    monthlyPI =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);
  } else if (loanAmount > 0) {
    monthlyPI = loanAmount / numPayments;
  }

  // Use custom values if provided, otherwise calculate from rates
  // Use zip code county rate if selected, otherwise default rate
  const activeTaxRate = selectedZipInfo?.taxRate ?? settings.propertyTaxRate;
  const defaultMonthlyInsurance = (purchasePrice * (settings.propertyInsuranceRate / 100)) / 12;
  // Calculate annual taxes and apply homestead credit (minimum 0)
  const annualTaxes = purchasePrice * (activeTaxRate / 100);
  const homesteadCredit = settings.homesteadTaxCredit || 0;
  const annualTaxesAfterCredit = Math.max(0, annualTaxes - homesteadCredit);
  const defaultMonthlyTaxes = annualTaxesAfterCredit / 12;
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
    updateSliderBackground(purchasePriceSliderRef.current, Math.min(purchasePrice, effectiveSliderMax), settings.minPurchasePrice, effectiveSliderMax);
  }, [purchasePrice, settings.minPurchasePrice, effectiveSliderMax, updateSliderBackground]);

  useEffect(() => {
    updateSliderBackground(interestRateSliderRef.current, interestRate, settings.minInterestRate, settings.maxInterestRate);
  }, [interestRate, settings.minInterestRate, settings.maxInterestRate, updateSliderBackground]);

  useEffect(() => {
    if (downPaymentPercent !== null) {
      updateSliderBackground(downPaymentSliderRef.current, downPaymentPercent, 0, 50);
    }
  }, [downPaymentPercent, updateSliderBackground]);

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

  // Format number with commas for display while typing
  const formatNumberWithCommas = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('en-US').format(parseInt(numericValue));
  };

  const handlePurchasePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setPurchasePriceInput(rawValue);
    // Update actual value for real-time calculations
    if (rawValue) {
      const numValue = parseInt(rawValue);
      if (!isNaN(numValue)) {
        setPurchasePrice(numValue);
      }
    }
  };

  const handlePurchasePriceBlur = () => {
    setIsPurchasePriceFocused(false);
    const numValue = parseInt(purchasePriceInput) || settings.minPurchasePrice;
    // Only enforce minimum, no maximum - let users enter any amount for jumbo loans
    const clampedValue = Math.max(numValue, settings.minPurchasePrice);
    setPurchasePrice(clampedValue);
    setPurchasePriceInput(clampedValue.toString());
  };

  const handlePurchasePriceFocus = () => {
    setIsPurchasePriceFocused(true);
    setPurchasePriceInput('');
  };

  const handleInterestRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const numericValue = rawInput.replace(/[^0-9.]/g, '');

    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    const sanitizedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;

    // Detect if user pressed backspace on the % symbol (value unchanged but % removed)
    if (sanitizedValue === interestRateInput && rawInput === interestRateInput) {
      // User deleted the %, so delete the last character of the actual value
      const newValue = interestRateInput.slice(0, -1);
      setInterestRateInput(newValue);
      if (newValue) {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue)) {
          setInterestRate(numValue);
        }
      }
      return;
    }

    setInterestRateInput(sanitizedValue);
    // Update actual value for real-time calculations
    if (sanitizedValue) {
      const numValue = parseFloat(sanitizedValue);
      if (!isNaN(numValue)) {
        setInterestRate(numValue);
      }
    }
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
    setCustomDownPaymentInput('');
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

  // Zip code search handlers
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
    setZipCodeInput(value);

    if (value.length >= 2) {
      const results = searchZipCodes(value, 8);
      setZipSuggestions(results);
      setShowZipSuggestions(results.length > 0);
    } else {
      setZipSuggestions([]);
      setShowZipSuggestions(false);
    }

    // Clear selected info when user is typing
    if (selectedZipInfo && value !== zipCodeInput) {
      setSelectedZipInfo(null);
    }
  };

  const handleZipSelect = (zipData: ArkansasZipData) => {
    setZipCodeInput(zipData.zip);
    setShowZipSuggestions(false);

    const taxInfo = getTaxRateByZip(zipData.zip);
    if (taxInfo) {
      setSelectedZipInfo(taxInfo);
      // Clear custom taxes when zip is selected - use the county rate
      setCustomTaxes('');
      setCustomTaxesInput('');
    }
  };

  const handleZipBlur = () => {
    // Delay hiding to allow click on suggestions
    setTimeout(() => setShowZipSuggestions(false), 200);
  };

  const handleZipFocus = () => {
    if (zipSuggestions.length > 0) {
      setShowZipSuggestions(true);
    }
  };

  const downPaymentOptions = getDownPaymentOptions(loanType);

  // FAQ toggle
  const toggleFaq = (id: string) => {
    setOpenFaqIds(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  // Get enabled FAQ items
  const enabledFaqItems = (settings.faqItems || []).filter(item => item.enabled);

  // Format phone number with dashes (handles leading 1 country code)
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');

    // Remove leading 1 if present (US country code)
    if (digits.length > 10 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }

    // Limit to 10 digits
    digits = digits.slice(0, 10);

    // Format with dashes
    if (digits.length >= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  // Handle phone input change with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setQuotePhone(formatted);
    // Clear error when user starts typing
    if (quoteFormErrors.phone) {
      setQuoteFormErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format (must be XXX-XXX-XXXX)
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Handle quote submission
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Custom validation
    const errors: typeof quoteFormErrors = {};

    if (!quoteFirstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!quoteLastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (settings.quotePhoneRequired !== false) {
      if (!quotePhone.trim()) {
        errors.phone = 'Phone number is required';
      } else if (!isValidPhone(quotePhone)) {
        errors.phone = 'Please enter a valid 10-digit phone number';
      }
    } else if (quotePhone.trim() && !isValidPhone(quotePhone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (settings.quoteEmailRequired !== false) {
      if (!quoteEmail.trim()) {
        errors.email = 'Email is required';
      } else if (!isValidEmail(quoteEmail)) {
        errors.email = 'Please enter a valid email address';
      }
    } else if (quoteEmail.trim() && !isValidEmail(quoteEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setQuoteFormErrors(errors);
      return;
    }

    setQuoteFormErrors({});
    setQuoteError(null);
    setQuoteSubmitting(true);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: quoteFirstName,
          lastName: quoteLastName,
          phone: quotePhone || null,
          email: quoteEmail || null,
          loanType,
          purchasePrice,
          downPaymentPercent: isCustomDownPayment
            ? ((parseFloat(customDownPayment) || 0) / purchasePrice) * 100
            : downPaymentPercent,
          downPaymentAmount: Math.round(downPaymentAmount),
          loanAmount: Math.round(loanAmount),
          interestRate,
          loanTerm,
          monthlyPi: Math.round(monthlyPI * 100) / 100,
          monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
          monthlyTaxes: Math.round(monthlyTaxes * 100) / 100,
          monthlyMip: Math.round(monthlyMip * 100) / 100,
          monthlyPmi: Math.round(monthlyPmi * 100) / 100,
          totalMonthlyPayment: Math.round(totalMonthly * 100) / 100,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create quote');
      }

      const { data } = await res.json();

      // Only auto-download PDF on desktop (mobile users can download from quote page)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (companyInfo && !isMobile) {
        await generateQuotePDF(
          {
            quoteId: data.quoteId,
            firstName: quoteFirstName,
            lastName: quoteLastName,
            loanType,
            purchasePrice,
            downPaymentPercent: isCustomDownPayment
              ? ((parseFloat(customDownPayment) || 0) / purchasePrice) * 100
              : (downPaymentPercent || 0),
            downPaymentAmount: Math.round(downPaymentAmount),
            loanAmount: Math.round(loanAmount),
            interestRate,
            loanTerm,
            monthlyPi: monthlyPI,
            monthlyInsurance,
            monthlyTaxes,
            monthlyMip,
            monthlyPmi,
            totalMonthlyPayment: totalMonthly,
          },
          companyInfo
        );
      }

      // Close modal and redirect to quote page
      setShowQuoteModal(false);
      window.location.href = `/quote/${data.quoteId}`;
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Failed to create quote');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const handleCloseQuoteModal = () => {
    setShowQuoteModal(false);
    setQuoteFirstName('');
    setQuoteLastName('');
    setQuotePhone('');
    setQuoteEmail('');
    setQuoteError(null);
    setQuoteFormErrors({});
  };

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
        '--slider-color': settings.sliderColor,
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
                value={isPurchasePriceFocused ? (purchasePriceInput ? `$${formatNumberWithCommas(purchasePriceInput)}` : '') : formatCurrency(purchasePrice)}
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
              max={effectiveSliderMax}
              step={5000}
              value={Math.min(purchasePrice, effectiveSliderMax)}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPurchasePrice(val);
                setPurchasePriceInput(val.toString());
              }}
            />
            {/* Loan Limit Warning */}
            {loanLimitWarning && (
              <div className="calc-warning-message" style={{ marginTop: '12px' }}>
                <svg className="calc-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>{loanLimitWarning.message}</span>
              </div>
            )}
          </div>

          {/* Down Payment */}
          <div className="calc-input-group">
            <div className="calc-label-row">
              <label className="calc-label" style={{ marginBottom: 0 }}>Down Payment</label>
              <div className="calc-select-wrapper" style={{ width: 'auto' }}>
                <select
                  className="calc-select"
                  value={isCustomDownPayment ? 'custom' : (downPaymentPercent ?? '')}
                  onChange={handleDownPaymentChange}
                  disabled={!loanType}
                  style={{ padding: '10px 40px 10px 12px', fontSize: '16px', minWidth: '180px' }}
                >
                  {/* Always show current value as first option when sliding */}
                  {!isCustomDownPayment && downPaymentPercent !== null && !downPaymentOptions.includes(downPaymentPercent) && (
                    <option value={downPaymentPercent}>
                      {downPaymentPercent}% ({formatCurrency((downPaymentPercent / 100) * purchasePrice)})
                    </option>
                  )}
                  <option value="">Select</option>
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
                        {option}% ({formatCurrency(amount)}){isMinimum ? ' - Min' : ''}
                      </option>
                    );
                  })}
                </select>
                <span className="calc-select-arrow">▼</span>
              </div>
            </div>
            <input
              ref={downPaymentSliderRef}
              type="range"
              className="calc-slider"
              min={loanType ? (loanTypeMinimums[loanType] || 0) : 0}
              max={50}
              step={2.5}
              value={isCustomDownPayment
                ? (customDownPayment ? Math.min((parseInt(customDownPayment) / purchasePrice) * 100, 50) : 0)
                : (downPaymentPercent ?? 0)
              }
              onChange={(e) => {
                const rawVal = parseFloat(e.target.value);
                const minDP = loanType ? (loanTypeMinimums[loanType] || 0) : 0;
                // Snap to valid increments: min, then 2.5% increments (2.5, 5, 7.5, 10, etc.)
                const validValues: number[] = [minDP];
                for (let v = 2.5; v <= 50; v += 2.5) {
                  if (v > minDP && !validValues.includes(v)) {
                    validValues.push(v);
                  }
                }
                // Find the closest valid value
                const snappedVal = validValues.reduce((prev, curr) =>
                  Math.abs(curr - rawVal) < Math.abs(prev - rawVal) ? curr : prev
                );
                setIsCustomDownPayment(false);
                setCustomDownPayment('');
                setDownPaymentPercent(snappedVal);
              }}
              disabled={!loanType}
            />
            <div className={`calc-custom-input-wrapper ${isCustomDownPayment ? 'visible' : ''}`}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={`calc-value-input full-width ${validation?.type || ''}`}
                placeholder="Enter down payment amount"
                value={isCustomDownPaymentFocused ? (customDownPaymentInput ? `$${formatNumberWithCommas(customDownPaymentInput)}` : '') : (customDownPayment ? formatCurrency(parseInt(customDownPayment)) : '')}
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
                value={isInterestRateFocused ? (interestRateInput ? `${interestRateInput}%` : '') : `${interestRate}%`}
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
                  color: '#d93c37',
                }}
              >
                <span>Advanced Settings</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d93c37"
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
                    <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyPI)}/mo</p>
                  </div>

                  {/* FHA MIP - only shown for FHA loans */}
                  {loanType === 'FHA' && monthlyMip > 0 && (
                    <div className="calc-breakdown-item">
                      <div>
                        <p className="calc-breakdown-label">{settings.mipLabel}</p>
                        <p className="calc-breakdown-subtext">{formatSubtext(settings.mipSubtext, mipRate)}</p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyMip)}/mo</p>
                    </div>
                  )}

                  {/* Conventional PMI - only shown when LTV > 80% */}
                  {loanType === 'Conventional' && monthlyPmi > 0 && (
                    <div className="calc-breakdown-item">
                      <div>
                        <p className="calc-breakdown-label">{settings.pmiLabel}</p>
                        <p className="calc-breakdown-subtext">{formatSubtext(settings.pmiSubtext, pmiRate)}</p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyPmi)}/mo</p>
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
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyInsurance)}/mo</p>
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

                  {/* Property Taxes - with zip code lookup */}
                  <div className="calc-breakdown-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p className="calc-breakdown-label">{settings.taxesLabel}</p>
                        <p className="calc-breakdown-subtext">
                          {customTaxes
                            ? 'Custom amount'
                            : selectedZipInfo
                              ? `${selectedZipInfo.county} County (${selectedZipInfo.taxRate}% annually)`
                              : formatSubtext(settings.taxesSubtext, settings.propertyTaxRate)
                          }
                        </p>
                      </div>
                      <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyTaxes)}/mo</p>
                    </div>

                    {/* Homestead Credit Notice */}
                    {homesteadCredit > 0 && !customTaxes && (
                      <p style={{
                        fontSize: '11px',
                        color: '#666',
                        margin: '0 0 8px 0',
                        padding: '8px 10px',
                        backgroundColor: '#f0f9ff',
                        borderRadius: '4px',
                        borderLeft: '3px solid #3B82F6',
                      }}>
                        <strong>Note:</strong> Includes ${homesteadCredit} Arkansas homestead tax credit for owner-occupied primary residences.
                      </p>
                    )}

                    {/* Zip Code Lookup */}
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Enter Arkansas ZIP code for county tax rate
                      </label>
                      <input
                        ref={zipInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="calc-value-input full-width"
                        placeholder="e.g. 72701"
                        value={zipCodeInput}
                        onChange={handleZipCodeChange}
                        onFocus={handleZipFocus}
                        onBlur={handleZipBlur}
                        style={{ fontSize: '16px', padding: '8px 12px' }}
                      />
                      {/* Typeahead suggestions dropdown */}
                      {showZipSuggestions && zipSuggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 100,
                          maxHeight: '200px',
                          overflowY: 'auto',
                        }}>
                          {zipSuggestions.map((zip) => (
                            <button
                              key={zip.zip}
                              type="button"
                              onClick={() => handleZipSelect(zip)}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 12px',
                                border: 'none',
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: '#fff',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                            >
                              <strong>{zip.zip}</strong> - {zip.city}, {zip.county} County
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedZipInfo && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                          <p style={{ fontSize: '12px', color: '#16A34A', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="9 12 11.5 14.5 16 10"></polyline>
                            </svg>
                            Using {selectedZipInfo.county} County rate: {selectedZipInfo.taxRate}%
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedZipInfo(null);
                              setZipCodeInput('');
                            }}
                            style={{
                              fontSize: '11px',
                              color: '#666',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: '2px 4px',
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Custom override input - hidden when ZIP is selected */}
                    {!selectedZipInfo && (
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        className="calc-value-input full-width"
                        placeholder="Or enter custom monthly amount"
                        value={isCustomTaxesFocused ? customTaxesInput : (customTaxes ? formatCurrencyDecimal(parseFloat(customTaxes)) : '')}
                        onChange={handleCustomTaxesInput}
                        onFocus={handleCustomTaxesFocus}
                        onBlur={handleCustomTaxesBlur}
                        style={{ fontSize: '16px', padding: '8px 12px' }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Download Quote Button */}
            {loanType && (
              <div style={{
                marginTop: '16px',
                marginBottom: '8px',
                textAlign: settings.downloadQuoteButtonFullWidth !== false ? 'left' : 'center'
              }}>
                <button
                  onClick={() => setShowQuoteModal(true)}
                  style={{
                    width: settings.downloadQuoteButtonFullWidth !== false ? '100%' : 'auto',
                    maxWidth: settings.downloadQuoteButtonFullWidth !== false ? '100%' : '300px',
                    padding: '14px 24px',
                    backgroundColor: settings.downloadQuoteButtonColor || '#DC2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: settings.downloadQuoteButtonFullWidth !== false ? 'flex' : 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.filter = 'brightness(0.85)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {settings.downloadQuoteButtonText || 'Download Quote'}
                </button>
              </div>
            )}

            <div className="calc-cta-section">
              {settings.ctaTextEnabled !== false && (
                <>
                  <h3 className="calc-cta-title">{settings.ctaTitle}</h3>
                  <p className="calc-cta-text">{settings.ctaText}</p>
                </>
              )}
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

      {/* Estimates Disclosure */}
      {settings.disclaimerText && (
        settings.disclaimerCollapsible !== false ? (
          // Collapsible dropdown style
          <div style={{
            marginTop: '32px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => setDisclaimerOpen(!disclaimerOpen)}
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#f8f9fa',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#181F53" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Disclaimer
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#666"
                strokeWidth="2"
                style={{
                  transform: disclaimerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {disclaimerOpen && (
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#fff',
                borderTop: '1px solid #e0e0e0',
              }}>
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {settings.disclaimerText}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Always visible style
          <div style={{
            marginTop: '32px',
            padding: '16px 20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            borderLeft: '4px solid #181F53',
          }}>
            <p style={{
              fontSize: '12px',
              color: '#666',
              lineHeight: '1.6',
              margin: 0,
            }}>
              <strong style={{ color: '#333' }}>Disclaimer:</strong> {settings.disclaimerText}
            </p>
          </div>
        )
      )}

      {/* FAQ Section */}
      {enabledFaqItems.length > 0 && (
        <div className="calc-faq-section">
          <h2 className="calc-faq-title">
            Frequently Asked Questions
            <span className="calc-faq-title-underline" />
          </h2>
          <div className="calc-faq-list">
            {enabledFaqItems.map((faq) => {
              const isOpen = openFaqIds.includes(faq.id);
              return (
                <div key={faq.id} className="calc-faq-item">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className={`calc-faq-question ${isOpen ? 'open' : ''}`}
                  >
                    <span>{faq.question}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#666"
                      strokeWidth="2"
                      className={`calc-faq-arrow ${isOpen ? 'open' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="calc-faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quote Download Modal */}
      {showQuoteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={handleCloseQuoteModal}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '450px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#181F53', margin: 0 }}>
                    Download Your Quote
                  </h2>
                  <button
                    onClick={handleCloseQuoteModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#666',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                  Enter your information to receive your personalized loan estimate.
                </p>

                {quoteError && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}>
                    {quoteError}
                  </div>
                )}

                <form onSubmit={handleQuoteSubmit} noValidate>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={quoteFirstName}
                        onChange={(e) => {
                          setQuoteFirstName(e.target.value);
                          if (quoteFormErrors.firstName) {
                            setQuoteFormErrors(prev => ({ ...prev, firstName: undefined }));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: quoteFormErrors.firstName ? '2px solid #DC2626' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                        placeholder="John"
                      />
                      {quoteFormErrors.firstName && (
                        <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px', margin: '4px 0 0' }}>
                          {quoteFormErrors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={quoteLastName}
                        onChange={(e) => {
                          setQuoteLastName(e.target.value);
                          if (quoteFormErrors.lastName) {
                            setQuoteFormErrors(prev => ({ ...prev, lastName: undefined }));
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: quoteFormErrors.lastName ? '2px solid #DC2626' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                        placeholder="Smith"
                      />
                      {quoteFormErrors.lastName && (
                        <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px', margin: '4px 0 0' }}>
                          {quoteFormErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                      Phone {settings.quotePhoneRequired !== false ? '*' : '(optional)'}
                    </label>
                    <input
                      type="tel"
                      value={quotePhone}
                      onChange={handlePhoneChange}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: quoteFormErrors.phone ? '2px solid #DC2626' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      placeholder="555-123-4567"
                    />
                    {quoteFormErrors.phone && (
                      <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px', margin: '4px 0 0' }}>
                        {quoteFormErrors.phone}
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
                      Email {settings.quoteEmailRequired !== false ? '*' : '(optional)'}
                    </label>
                    <input
                      type="email"
                      value={quoteEmail}
                      onChange={(e) => {
                        setQuoteEmail(e.target.value);
                        if (quoteFormErrors.email) {
                          setQuoteFormErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: quoteFormErrors.email ? '2px solid #DC2626' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      placeholder="john@example.com"
                    />
                    {quoteFormErrors.email && (
                      <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '4px', margin: '4px 0 0' }}>
                        {quoteFormErrors.email}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={quoteSubmitting}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      backgroundColor: settings.quoteFormButtonColor || '#181F53',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: quoteSubmitting ? 'not-allowed' : 'pointer',
                      opacity: quoteSubmitting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {quoteSubmitting ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        Creating Quote...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download Quote PDF
                      </>
                    )}
                  </button>
                </form>

                <p style={{ fontSize: '12px', color: '#999', marginTop: '16px', textAlign: 'center' }}>
                  Your information is secure and will not be shared.
                </p>
              </>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
