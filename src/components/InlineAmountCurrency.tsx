/**
 * InlineAmountCurrency Component
 * 
 * A composite control combining a currency dropdown with an amount input.
 * Uses portal rendering to prevent modal clipping and ensure dropdowns are clickable.
 * 
 * @example
 * ```tsx
 * const [value, setValue] = useState({ amount: 34, currency: 'US' });
 * 
 * <InlineAmountCurrency
 *   value={value}
 *   onChange={setValue}
 *   baseCurrency="IND"
 *   conversionRates={{ IND: 1, US: 82, SWZ: 90 }}
 * />
 * ```
 * 
 * Currency Mappings:
 * - IND → INR (Indian Rupee) ₹
 * - US → USD (US Dollar) $
 * - SWZ → CHF (Swiss Franc) CHF
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Currency = 'IND' | 'SWZ' | 'US';

export interface CurrencyAmount {
  amount: number;
  currency: Currency;
}

export interface InlineAmountCurrencyProps {
  value: CurrencyAmount;
  onChange: (value: CurrencyAmount) => void;
  baseCurrency?: Currency;
  conversionRates?: Record<string, number>;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

// Currency configuration with ISO codes and symbols
const CURRENCY_CONFIG = {
  IND: { code: 'INR', symbol: '₹', label: 'IND', displayName: 'Indian Rupee' },
  US: { code: 'USD', symbol: '$', label: 'USD', displayName: 'US Dollar' },
  SWZ: { code: 'CHF', symbol: 'CHF', label: 'CHF', displayName: 'Swiss Franc' },
} as const;

const DEFAULT_RATES: Record<string, number> = {
  IND: 1,
  US: 82,
  SWZ: 90,
};

export const InlineAmountCurrency: React.FC<InlineAmountCurrencyProps> = ({
  value,
  onChange,
  baseCurrency = 'IND',
  conversionRates = DEFAULT_RATES,
  allowDecimals = true,
  min,
  max,
  label,
  disabled = false,
  className,
  placeholder = 'Enter amount',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [inputValue, setInputValue] = useState(value.amount.toString());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currencies = Object.keys(CURRENCY_CONFIG) as Currency[];

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value.amount.toString());
  }, [value.amount]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Update trigger position when dropdown opens
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // Handle amount input change with debounce
  const handleAmountChange = useCallback((inputVal: string) => {
    setInputValue(inputVal);
    
    if (inputVal === '') {
      setValidationError(null);
      onChange({ amount: 0, currency: value.currency });
      return;
    }

    const numericValue = parseFloat(inputVal);
    
    if (isNaN(numericValue)) {
      setValidationError('Please enter a valid number');
      return;
    }

    if (!allowDecimals && inputVal.includes('.')) {
      setValidationError('Decimal values are not allowed');
      return;
    }

    if (min !== undefined && numericValue < min) {
      setValidationError(`Value must be at least ${min}`);
      return;
    }

    if (max !== undefined && numericValue > max) {
      setValidationError(`Value must not exceed ${max}`);
      return;
    }

    setValidationError(null);
    onChange({ amount: numericValue, currency: value.currency });
  }, [value.currency, onChange, allowDecimals, min, max]);

  // Handle currency selection
  const handleCurrencySelect = useCallback((currency: Currency) => {
    onChange({ amount: value.amount, currency });
    setIsOpen(false);
    // Return focus to amount input after selection
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value.amount, onChange]);

  // Handle dropdown trigger click
  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Handle keyboard navigation in dropdown
  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) {
          handleCurrencySelect(currencies[highlightedIndex]);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev + 1) % currencies.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prev) => (prev - 1 + currencies.length) % currencies.length);
        }
        break;
      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(currencies.length - 1);
        }
        break;
    }
  };

  // Handle input keyboard events
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  // Calculate equivalent value
  const calculateEquivalent = (): number | null => {
    if (!conversionRates[value.currency] || !conversionRates[baseCurrency]) {
      return null;
    }

    if (value.currency === baseCurrency) {
      return value.amount;
    }

    // Convert from selected currency to base currency
    const equivalent = value.amount * conversionRates[value.currency];
    return Math.round(equivalent * 100) / 100;
  };

  // Format currency value
  const formatCurrency = (amount: number, currency: Currency): string => {
    try {
      const config = CURRENCY_CONFIG[currency];
      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch {
      const config = CURRENCY_CONFIG[currency];
      return `${config.symbol} ${amount.toFixed(2)}`;
    }
  };

  const equivalent = calculateEquivalent();
  const hasConversionError = equivalent === null && value.amount > 0;

  // Dropdown menu rendered via portal to avoid modal clipping
  const dropdownMenu = isOpen && triggerRect && typeof window !== 'undefined' ? createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Currency options"
      style={{
        position: 'fixed',
        top: `${triggerRect.bottom + 4}px`,
        left: `${triggerRect.left}px`,
        width: `${triggerRect.width}px`,
        zIndex: 99999, // Very high to ensure it's above modal overlays
      }}
      className="bg-popover border rounded-md shadow-lg"
    >
      {currencies.map((curr, index) => {
        const config = CURRENCY_CONFIG[curr];
        const isSelected = value.currency === curr;
        const isHighlighted = index === highlightedIndex;

        return (
          <button
            key={curr}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => handleCurrencySelect(curr)}
            onMouseEnter={() => setHighlightedIndex(index)}
            className={cn(
              'w-full px-4 py-2.5 text-left flex items-center gap-3',
              'hover:bg-accent transition-colors text-sm',
              'focus:bg-accent focus:outline-none',
              isHighlighted && 'bg-accent',
              isSelected && 'bg-accent/50'
            )}
          >
            <span className="font-semibold text-base">{config.symbol}</span>
            <div className="flex flex-col flex-1">
              <span className="font-medium">{config.label}</span>
              <span className="text-xs text-muted-foreground">{config.displayName}</span>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

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
        aria-label={label || "Amount and currency"}
        className={cn(
          'flex items-stretch border rounded-md overflow-hidden bg-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          validationError && 'border-destructive'
        )}
      >
        {/* Currency Dropdown Trigger */}
        <button
          ref={triggerRef}
          type="button"
          role="button"
          onClick={handleTriggerClick}
          onKeyDown={handleDropdownKeyDown}
          disabled={disabled}
          aria-label="Select currency"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'px-3 py-2 flex items-center gap-1.5 bg-muted hover:bg-muted/80',
            'border-r transition-colors text-sm font-medium min-w-[90px]',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            disabled && 'pointer-events-none'
          )}
        >
          <span className="text-base">{CURRENCY_CONFIG[value.currency].symbol}</span>
          <span className="text-xs">{CURRENCY_CONFIG[value.currency].label}</span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 opacity-50 transition-transform',
            isOpen && 'transform rotate-180'
          )} />
        </button>

        {/* Amount Input */}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={(e) => handleAmountChange(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder={placeholder}
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
        <p id="amount-error" className="text-xs text-destructive">
          {validationError}
        </p>
      )}

      {/* Equivalent Display */}
      {!validationError && (
        <div
          id="equivalent-display"
          aria-live="polite"
          aria-atomic="true"
          className="text-sm text-muted-foreground"
        >
          {hasConversionError ? (
            <span className="text-amber-600 dark:text-amber-400">
              Conversion unavailable
            </span>
          ) : equivalent !== null && value.amount > 0 ? (
            <>
              <span className="font-medium">Equivalent: </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(equivalent, baseCurrency)}
              </span>
            </>
          ) : null}
        </div>
      )}

      {/* Dropdown Menu (Portal) */}
      {dropdownMenu}
    </div>
  );
};

export default InlineAmountCurrency;
