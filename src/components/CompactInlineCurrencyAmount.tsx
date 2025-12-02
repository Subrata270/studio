/**
 * CompactInlineCurrencyAmount Component
 * 
 * A neat, compact inline currency selector inside the amount input.
 * Features portal rendering to prevent modal clipping issues.
 * Fully accessible with ARIA attributes and keyboard navigation.
 * 
 * @example
 * ```tsx
 * const [amt, setAmt] = useState({ amount: 34, currency: 'IND' });
 * 
 * <CompactInlineCurrencyAmount
 *   value={amt}
 *   onChange={setAmt}
 *   conversionRates={{ IND: 1, US: 82, SWZ: 90 }}
 *   baseCurrency="IND"
 * />
 * ```
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CompactCurrency = 'IND' | 'SWZ' | 'US';

export interface CurrencyAmountValue {
  amount: number;
  currency: CompactCurrency;
}

export interface CompactInlineCurrencyAmountProps {
  value: CurrencyAmountValue;
  onChange: (value: CurrencyAmountValue) => void;
  conversionRates?: Record<string, number>;
  baseCurrency?: CompactCurrency;
  allowDecimals?: boolean;
  locale?: string;
  menuPortalTarget?: HTMLElement;
  menuMatchTriggerWidth?: boolean;
  showCompactLabels?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  isLoadingRates?: boolean;
}

// Compact currency configuration - minimal, clean design
const CURRENCY_INFO = {
  IND: { code: 'INR', symbol: '₹', label: 'IND', name: 'Indian Rupee' },
  US: { code: 'USD', symbol: '$', label: 'US', name: 'US Dollar' },
  SWZ: { code: 'CHF', symbol: 'CHF', label: 'SWZ', name: 'Swiss Franc' },
} as const;

const DEFAULT_RATES: Record<string, number> = {
  IND: 1,
  US: 82,
  SWZ: 90,
};

export const CompactInlineCurrencyAmount: React.FC<CompactInlineCurrencyAmountProps> = ({
  value,
  onChange,
  conversionRates = DEFAULT_RATES,
  baseCurrency = 'IND',
  allowDecimals = true,
  locale = 'en-IN',
  menuPortalTarget,
  menuMatchTriggerWidth = true,
  showCompactLabels = false,
  disabled = false,
  className,
  placeholder = 'Enter amount',
  min,
  max,
  isLoadingRates = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [inputValue, setInputValue] = useState(value.amount.toString());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const currencies = Object.keys(CURRENCY_INFO) as CompactCurrency[];
  const portalTarget = menuPortalTarget || (typeof document !== 'undefined' ? document.body : null);

  // Sync input with external value changes
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

  // Update trigger position when dropdown opens and close on scroll
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
    };

    const handleScroll = () => {
      // Close dropdown on scroll for better UX
      setIsOpen(false);
    };

    // Initial position
    updatePosition();

    // Close on scroll, update on resize
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Handle amount input with debounce
  const handleAmountChange = useCallback((inputVal: string) => {
    setInputValue(inputVal);
    
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce by 100ms
    debounceTimer.current = setTimeout(() => {
      if (inputVal === '') {
        setValidationError(null);
        onChange({ amount: 0, currency: value.currency });
        return;
      }

      const numericValue = parseFloat(inputVal);
      
      if (isNaN(numericValue)) {
        setValidationError('Invalid number');
        return;
      }

      if (!allowDecimals && inputVal.includes('.')) {
        setValidationError('No decimals allowed');
        return;
      }

      if (min !== undefined && numericValue < min) {
        setValidationError(`Min: ${min}`);
        return;
      }

      if (max !== undefined && numericValue > max) {
        setValidationError(`Max: ${max}`);
        return;
      }

      setValidationError(null);
      onChange({ amount: numericValue, currency: value.currency });
    }, 100);
  }, [value.currency, onChange, allowDecimals, min, max]);

  // Handle currency selection
  const handleCurrencySelect = useCallback((currency: CompactCurrency) => {
    onChange({ amount: value.amount, currency });
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [value.amount, onChange]);

  // Keyboard navigation
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
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
    }
  };

  // Prevent form submission on Enter in input
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

    const equivalent = value.amount * conversionRates[value.currency];
    return Math.round(equivalent * 100) / 100;
  };

  // Format currency
  const formatCurrency = (amount: number, currency: CompactCurrency): string => {
    try {
      const info = CURRENCY_INFO[currency];
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: info.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${CURRENCY_INFO[currency].symbol} ${amount.toFixed(2)}`;
    }
  };

  const equivalent = calculateEquivalent();
  const currentCurrency = CURRENCY_INFO[value.currency];

  // Compact dropdown menu (portal rendered)
  const dropdownMenu = isOpen && triggerRect && portalTarget ? createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Currency options"
      aria-activedescendant={`currency-option-${value.currency}`}
      style={{
        position: 'fixed',
        top: `${triggerRect.bottom + 4}px`,
        left: `${triggerRect.left}px`,
        width: menuMatchTriggerWidth ? `${triggerRect.width}px` : undefined,
        minWidth: menuMatchTriggerWidth ? `${triggerRect.width}px` : '140px',
        maxHeight: '200px',
        zIndex: 99999,
        pointerEvents: 'auto', // Ensure clicks work inside modal
      }}
      className="bg-popover border rounded-md shadow-lg overflow-y-auto"
    >
      {currencies.map((curr, index) => {
        const info = CURRENCY_INFO[curr];
        const isSelected = value.currency === curr;
        const isHighlighted = index === highlightedIndex;

        return (
          <button
            key={curr}
            id={`currency-option-${curr}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCurrencySelect(curr);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseEnter={() => setHighlightedIndex(index)}
            className={cn(
              'w-full px-2.5 py-1.5 text-left flex items-center gap-2',
              'transition-colors text-sm border-b last:border-b-0 border-border/30',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
              'hover:bg-accent/50',
              isHighlighted && !isSelected && 'bg-accent/30',
              isSelected && 'bg-primary/10 border-primary/20 font-semibold'
            )}
          >
            <span className={cn(
              'text-sm w-7',
              isSelected ? 'font-bold' : 'font-semibold'
            )}>
              {info.symbol}
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <span className={cn(
                'text-xs leading-tight',
                isSelected ? 'font-bold' : 'font-medium'
              )}>
                {info.label}
              </span>
              {!showCompactLabels && (
                <span className="text-[9px] text-muted-foreground truncate leading-tight">
                  {info.name}
                </span>
              )}
            </div>
            {isSelected && (
              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 font-bold" />
            )}
          </button>
        );
      })}
    </div>,
    portalTarget
  ) : null;

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Compact Composite Control */}
      <div
        className={cn(
          'flex items-stretch border rounded-md overflow-hidden bg-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
          disabled && 'opacity-50 cursor-not-allowed',
          validationError && 'border-destructive'
        )}
      >
        {/* Compact Currency Trigger */}
        <button
          ref={triggerRef}
          type="button"
          role="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleTriggerKeyDown}
          disabled={disabled}
          aria-label="Select currency"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            'px-2.5 py-2 flex items-center gap-1 bg-muted/50 hover:bg-muted/80',
            'border-r transition-colors text-xs font-medium min-w-[75px]',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            disabled && 'pointer-events-none'
          )}
        >
          <span className="text-sm">{currentCurrency.symbol}</span>
          <span className="text-[11px] font-semibold">{currentCurrency.label}</span>
          <ChevronDown className={cn(
            'h-3 w-3 opacity-50 transition-transform ml-auto',
            isOpen && 'rotate-180'
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
          aria-label="Amount"
          aria-invalid={!!validationError}
          className={cn(
            'flex-1 px-3 py-2 bg-transparent outline-none text-sm',
            'placeholder:text-muted-foreground',
            disabled && 'cursor-not-allowed'
          )}
        />
      </div>

      {/* Validation Error - Compact */}
      {validationError && (
        <p className="text-[11px] text-destructive" role="alert">{validationError}</p>
      )}

      {/* Equivalent Display - Compact with Loading State */}
      {!validationError && equivalent !== null && value.amount > 0 && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="text-xs text-muted-foreground flex items-center gap-1.5"
        >
          {isLoadingRates ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-[11px]">Loading rates...</span>
            </>
          ) : (
            <>
              <span className="font-medium">≈ </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(equivalent, baseCurrency)}
              </span>
            </>
          )}
        </div>
      )}

      {/* Dropdown Menu (Portal) */}
      {dropdownMenu}
    </div>
  );
};

export default CompactInlineCurrencyAmount;
