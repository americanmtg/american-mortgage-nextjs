'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './calculator.css';

type LoanType = 'FHA' | 'Conventional' | 'USDA' | 'VA' | '';

const loanTypeMinimums: Record<string, number> = {
  FHA: 3.5,
  Conventional: 3,
  USDA: 0,
  VA: 0,
};

export default function CalculatorPage() {
  const [loanType, setLoanType] = useState<LoanType>('');
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | null>(null);
  const [isCustomDownPayment, setIsCustomDownPayment] = useState(false);
  const [customDownPayment, setCustomDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState(3.5);
  const [loanTerm, setLoanTerm] = useState(30);

  const purchasePriceSliderRef = useRef<HTMLInputElement>(null);
  const interestRateSliderRef = useRef<HTMLInputElement>(null);

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

  const getDownPaymentOptions = (type: LoanType) => {
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

    const minimumPercent = loanTypeMinimums[loanType];
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

  const monthlyInsurance = (purchasePrice * 0.01) / 12;
  const monthlyTaxes = (purchasePrice * 0.01) / 12;

  // Update slider backgrounds
  useEffect(() => {
    updateSliderBackground(purchasePriceSliderRef.current, purchasePrice, 50000, 2000000);
  }, [purchasePrice, updateSliderBackground]);

  useEffect(() => {
    updateSliderBackground(interestRateSliderRef.current, interestRate, 3, 10);
  }, [interestRate, updateSliderBackground]);

  // Reset down payment when loan type changes
  useEffect(() => {
    if (loanType) {
      setDownPaymentPercent(loanTypeMinimums[loanType]);
      setIsCustomDownPayment(false);
      setCustomDownPayment('');
    } else {
      setDownPaymentPercent(null);
    }
  }, [loanType]);

  const handlePurchasePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    let numValue = parseInt(value) || 50000;
    numValue = Math.min(Math.max(numValue, 50000), 2000000);
    setPurchasePrice(numValue);
  };

  const handleInterestRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    let numValue = parseFloat(value) || 3;
    numValue = Math.min(Math.max(numValue, 3), 10);
    setInterestRate(numValue);
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
    setCustomDownPayment(value);
  };

  const downPaymentOptions = getDownPaymentOptions(loanType);

  return (
    <div className="calc-container">
      <h1 className="calc-title">Home Loan Calculator</h1>
      <div className="calc-layout">
        <div className="calc-input-section">
          {/* Loan Type */}
          <div className="calc-input-group">
            <label className="calc-label">Loan Type</label>
            <div className="calc-select-wrapper">
              <select
                className="calc-select"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
              >
                <option value="">Select Value</option>
                <option value="FHA">FHA</option>
                <option value="Conventional">Conventional</option>
                <option value="USDA">USDA</option>
                <option value="VA">VA</option>
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
                className="calc-value-input"
                value={formatCurrency(purchasePrice)}
                onChange={handlePurchasePriceInputChange}
              />
            </div>
            <input
              ref={purchasePriceSliderRef}
              type="range"
              className="calc-slider"
              min={50000}
              max={2000000}
              step={5000}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(parseInt(e.target.value))}
            />
            <div className="calc-range-labels">
              <span>$50,000</span>
              <span>$2,000,000</span>
            </div>
            <p className="calc-help-text">Total amount of money you want to borrow.</p>
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
                className={`calc-value-input full-width ${validation?.type || ''}`}
                placeholder="Enter down payment amount"
                value={customDownPayment ? formatCurrency(parseInt(customDownPayment)) : ''}
                onChange={handleCustomDownPaymentInput}
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
            <p className="calc-help-text">Total amount of money you want to put down.</p>
          </div>

          {/* Interest Rate */}
          <div className="calc-input-group">
            <div className="calc-label-row">
              <label className="calc-label">Interest Rate</label>
              <input
                type="text"
                className="calc-value-input"
                value={`${interestRate}%`}
                onChange={handleInterestRateInputChange}
              />
            </div>
            <input
              ref={interestRateSliderRef}
              type="range"
              className="calc-slider"
              min={3}
              max={10}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(parseFloat(e.target.value))}
            />
            <div className="calc-range-labels">
              <span>3%</span>
              <span>10%</span>
            </div>
            <p className="calc-help-text">Annual interest rate for the loan.</p>
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
            <p className="calc-help-text">Total duration over which you&apos;ll repay the loan.</p>
          </div>
        </div>

        <div className="calc-results-section">
          <div className="calc-results-card">
            <h2 className="calc-results-title">Monthly Payments</h2>
            <p className="calc-monthly-amount">{formatCurrency(Math.round(monthlyPI))}</p>
            <p className="calc-results-subtext">
              Principal and interest. Calculated based on the entered values.
            </p>
            <div className="calc-breakdown-item">
              <div>
                <p className="calc-breakdown-label">Property Insurance</p>
                <p className="calc-breakdown-subtext">Estimated monthly insurance</p>
              </div>
              <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyInsurance)}</p>
            </div>
            <div className="calc-breakdown-item">
              <div>
                <p className="calc-breakdown-label">Property Taxes</p>
                <p className="calc-breakdown-subtext">Estimated monthly taxes</p>
              </div>
              <p className="calc-breakdown-value">{formatCurrencyDecimal(monthlyTaxes)}</p>
            </div>
            <div className="calc-cta-section">
              <h3 className="calc-cta-title">Take the First Step Towards Your New Home</h3>
              <p className="calc-cta-text">
                With our simple home loan calculator, you can estimate your monthly payments and
                start your journey towards owning a new home.
              </p>
              <a
                href="https://www.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="calc-cta-button"
              >
                Get Pre-Approved Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
