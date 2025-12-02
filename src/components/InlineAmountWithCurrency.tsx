/**
 * InlineAmountWithCurrency Component
 * 
 * A composite control that combines amount input with an inline currency selector.
 * Provides real-time currency conversion to a base currency with accessible UI.
 * 
 * @example
 * ```tsx
 * const [value, setValue] = useState({ amount: 34, currency: 'US' });
 * 
 * <InlineAmountWithCurrency
 *   value={value}
 *   onChange={setValue}
 *   baseCurrency="INS"
 *   conversionRates={{ INS: 1, US: 82, SWZ: 90 }}
 * />
 * ```
 * 
 * Currency Mappings:
 * - INS → INR (Indian Rupee) ₹
 * - US → USD (US Dollar) $
 * - SWZ → CHF (Swiss Franc) CHF
 * 
 * Default Conversion Rates (relative to INS):
 * - INS: 1 (base)
 * - US: 82 (1 USD = 82 INR)
 * - SWZ: 90 (1 CHF = 90 INR)
 * 
 * Props:
 * - value: { amount: number; currency: 'INS'|'SWZ'|'US' } - Controlled value
 * - onChange: (value: { amount: number; currency: string }) => void
 * - baseCurrency?: 'INS'|'SWZ'|'US' - Base currency for conversion (default: INS)
 * - conversionRates?: Record<string, number> - Custom conversion rates
 * - fetchRates?: () => Promise<Record<string, number>> - Function to fetch live rates
 * - allowDecimals?: boolean - Allow decimal input (default: true)
 * - min?: number - Minimum allowed value
 * - max?: number - Maximum allowed value
 * - label?: string - Label for the control
 * - lockConversion?: boolean - Prevent conversion updates (for audit/history)
 * - locale?: string - Locale for number formatting (default: 'en-IN')
 * - disabled?: boolean - Disable the control
 * - className?: string - Additional CSS classes
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Currency = 'INS' | 'SWZ' | 'US';

export interface CurrencyValue {
  amount: number;
  currency: Currency;
}

export interface InlineAmountWithCurrencyProps {
  value: CurrencyValue;
  onChange: (value: CurrencyValue) => void;
  baseCurrency?: Currency;
  conversionRates?: Record<string, number>;
  fetchRates?: () => Promise<Record<string, number>>;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  label?: string;
  lockConversion?: boolean;
  locale?: string;
  disabled?: boolean;
  className?: string;
}

// Currency metadata mapping
const CURRENCY_CONFIG = {
  INS: { code: 'INR', symbol: '₹', label: 'INR', displayName: 'Indian Rupee' },
  US: { code: 'USD', symbol: '$', label: 'USD', displayName: 'US Dollar' },
  SWZ: { code: 'CHF', symbol: 'CHF', label: 'CHF', displayName: 'Swiss Franc' },
} as const;

// Default conversion rates (relative to INS as base)
const DEFAULT_RATES: Record<string, number> = {
  INS: 1,
  US: 82,
  SWZ: 90,
};

export const InlineAmountWithCurrency: React.FC<InlineAmountWithCurrencyProps> = ({
  value,
  onChange,
  baseCurrency = 'INS',
  conversionRates,
  fetchRates,
  allowDecimals = true,
  min,
  max,
  label,
  lockConversion = false,
  locale = 'en-IN',
  disabled = false,
  className,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>(conversionRates || DEFAULT_RATES);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [ratesFetchError, setRatesFetchError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value.amount.toString());
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch rates on mount if fetchRates provided and no conversionRates
  useEffect(() => {
    if (!conversionRates && fetchRates) {
      setIsFetchingRates(true);
      fetchRates()
        .then((fetchedRates) => {
          setRates(fetchedRates);
          setRatesFetchError(false);
        })
        .catch(() => {
          setRatesFetchError(true);
          setRates(DEFAULT_RATES);
        })
        .finally(() => {
          setIsFetchingRates(false);
        });
    }
  }, [conversionRates, fetchRates]);

  // Update rates when conversionRates prop changes
  useEffect(() => {
    if (conversionRates) {
      setRates(conversionRates);
    }
  }, [conversionRates]);

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value.amount.toString());
  }, [value.amount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Calculate equivalent value in base currency
  const calculateEquivalent = (): number | null => {
    if (lockConversion) return null;
    if (!rates[value.currency]) return null;

    // If selected currency is base currency, equivalent is the same
    if (value.currency === baseCurrency) {
      return value.amount;
    }

    // Convert from selected currency to base currency
    // rate represents: 1 unit of selected currency = X units of base currency
    const equivalent = value.amount * rates[value.currency];
    return Math.round(equivalent * 100) / 100; // Round to 2 decimals
  };

  // Format currency value with locale and symbol
  const formatCurrency = (amount: number, currency: Currency): string => {
    try {
      const config = CURRENCY_CONFIG[currency];
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch {
      // Fallback formatting
      const config = CURRENCY_CONFIG[currency];
      return `${config.symbol} ${amount.toFixed(2)}`;
    }
  };

  // Validate and update amount
  const handleAmountChange = (inputVal: string) => {
    setInputValue(inputVal);
    
    // Allow empty input
    if (inputVal === '') {
      setValidationError(null);
      onChange({ amount: 0, currency: value.currency });
      return;
    }

    // Validate numeric input
    const numericValue = parseFloat(inputVal);
    
    if (isNaN(numericValue)) {
      setValidationError('Please enter a valid number');
      return;
    }

    // Validate decimals
    if (!allowDecimals && inputVal.includes('.')) {
      setValidationError('Decimal values are not allowed');
      return;
    }

    // Validate range
    if (min !== undefined && numericValue < min) {
      setValidationError(`Value must be at least ${min}`);
      return;
    }

    if (max !== undefined && numericValue > max) {
      setValidationError(`Value must not exceed ${max}`);
      return;
    }

    // Valid input
    setValidationError(null);
    onChange({ amount: numericValue, currency: value.currency });
  };

  // Handle currency selection
  const handleCurrencySelect = (currency: Currency) => {
    onChange({ amount: value.amount, currency });
    setIsDropdownOpen(false);
  };

  // Handle keyboard navigation
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsDropdownOpen(!isDropdownOpen);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
      }
    }
  };

  // Handle input keyboard events
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      inputRef.current?.blur();
    }
  };

  const equivalent = calculateEquivalent();
  const showWarning = !conversionRates && !fetchRates;
  const hasRatesError = ratesFetchError || !rates[value.currency];

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      {/* Composite Control */}
      <div
        className={cn(
          'flex items-stretch border rounded-md overflow-hidden bg-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          validationError && 'border-destructive'
        )}
      >
        {/* Currency Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            onKeyDown={handleDropdownKeyDown}
            disabled={disabled}
            aria-label="Select currency"
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
            className={cn(
              'h-full px-3 py-2 flex items-center gap-1.5 bg-muted hover:bg-muted/80',
              'border-r transition-colors text-sm font-medium',
              disabled && 'pointer-events-none'
            )}
          >
            <span>{CURRENCY_CONFIG[value.currency].symbol}</span>
            <span className="text-xs">{CURRENCY_CONFIG[value.currency].label}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              role="listbox"
              aria-label="Currency options"
              className="absolute top-full left-0 mt-1 w-48 bg-popover border rounded-md shadow-md z-50"
            >
              {Object.entries(CURRENCY_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={value.currency === key}
                  onClick={() => handleCurrencySelect(key as Currency)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCurrencySelect(key as Currency);
                    }
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-accent',
                    'transition-colors text-sm focus:bg-accent focus:outline-none',
                    value.currency === key && 'bg-accent/50'
                  )}
                >
                  <span className="font-semibold text-base">{config.symbol}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">{config.displayName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => handleAmountChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder="Enter amount"
          aria-label={label || "Amount"}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'amount-error' : 'equivalent-display'}
          className={cn(
            'flex-1 px-4 py-2 bg-transparent outline-none text-sm',
            'placeholder:text-muted-foreground',
            disabled && 'cursor-not-allowed'
          )}
        />
      </div>

      {/* Validation Error */}
      {validationError && (
        <p id="amount-error" className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {validationError}
        </p>
      )}

      {/* Equivalent Display */}
      {!lockConversion && (
        <div
          id="equivalent-display"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          {isFetchingRates ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Fetching rates...</span>
            </>
          ) : hasRatesError ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">Conversion unavailable</span>
            </>
          ) : equivalent !== null && value.amount > 0 ? (
            <>
              <span className="font-medium">Equivalent:</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(equivalent, baseCurrency)}
              </span>
              {showWarning && (
                <span 
                  className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                  title="Using default conversion rates. Pass conversionRates or fetchRates prop for accurate rates."
                >
                  <AlertCircle className="h-3 w-3" />
                </span>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Mobile Helper Text */}
      <p className="text-xs text-muted-foreground sm:hidden">
        {value.currency !== baseCurrency && equivalent && value.amount > 0
          ? `≈ ${formatCurrency(equivalent, baseCurrency)}`
          : 'Enter amount to see conversion'}
      </p>
    </div>
  );
};

export default InlineAmountWithCurrency;
