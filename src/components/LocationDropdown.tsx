/**
 * LocationDropdown Component
 * 
 * A fully accessible, searchable dropdown for location selection with support for:
 * - Single and multi-select modes
 * - Search/filter with case-insensitive matching
 * - "Select All" for multi-select mode
 * - "Other" option with custom text input
 * - Keyboard navigation (Arrow keys, Enter, Esc, Home, End)
 * - ARIA accessibility attributes
 * - Custom scrollbar with mouse-wheel support
 * 
 * @example
 * ```tsx
 * <LocationDropdown
 *   options={[
 *     { label: 'Office - Hyd', value: 'office-hyd' },
 *     { label: 'Other', value: 'other' }
 *   ]}
 *   value={selectedLocation}
 *   onChange={(value) => setSelectedLocation(value)}
 *   placeholder="Select location"
 * />
 * ```
 * 
 * Props:
 * - options: Array of {label, value} objects
 * - value: string | string[] - Current selected value(s)
 * - onChange: (value: string | string[], otherText?: string) => void
 * - multiple: boolean (default: false) - Enable multi-select
 * - placeholder: string (default: "Select location")
 * - allowClear: boolean (default: false) - Show clear button for single-select
 * - allowFreeText: boolean (default: false) - Allow custom text entry
 * - disabled: boolean (default: false)
 * - className: string - Additional CSS classes
 * 
 * Return format:
 * - Single-select: onChange receives string value
 * - Multi-select: onChange receives string[] array
 * - When "Other" selected: onChange receives value with otherText as second param
 */

"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationOption {
  label: string;
  value: string;
}

export interface LocationDropdownProps {
  options: LocationOption[];
  value: string | string[];
  onChange: (value: string | string[], otherText?: string) => void;
  multiple?: boolean;
  placeholder?: string;
  allowClear?: boolean;
  allowFreeText?: boolean;
  disabled?: boolean;
  className?: string;
  name?: string;
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select location',
  allowClear = false,
  allowFreeText = false,
  disabled = false,
  className,
  name,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [otherText, setOtherText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Normalize value to array for easier handling
  const selectedValues = useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [value]);

  // Check if "Other" is in options
  const hasOtherOption = useMemo(() => {
    return options.some(opt => opt.value.toLowerCase() === 'other');
  }, [options]);

  // Check if "Other" is selected
  const isOtherSelected = useMemo(() => {
    return selectedValues.some(val => val.toLowerCase() === 'other' || val.startsWith('Other:'));
  }, [selectedValues]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!debouncedSearch) return options;
    const search = debouncedSearch.toLowerCase();
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(search) ||
        opt.value.toLowerCase().includes(search)
    );
  }, [options, debouncedSearch]);

  // Add "Select All" option for multi-select
  const displayOptions = useMemo(() => {
    if (multiple && options.length > 1) {
      return [{ label: 'Select All', value: '__select_all__' }, ...filteredOptions];
    }
    return filteredOptions;
  }, [multiple, filteredOptions, options.length]);

  // Check if all options are selected
  const allSelected = useMemo(() => {
    if (!multiple) return false;
    const selectableOptions = options.filter(opt => opt.value !== '__select_all__');
    return selectableOptions.every(opt => selectedValues.includes(opt.value));
  }, [multiple, options, selectedValues]);

  // Handle option selection
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (optionValue === '__select_all__') {
        // Toggle select all
        if (allSelected) {
          onChange([], '');
          setOtherText('');
        } else {
          const allValues = options.map(opt => opt.value);
          onChange(allValues, '');
        }
        return;
      }

      if (multiple) {
        const newValues = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        
        // Keep dropdown open for multi-select
        onChange(newValues, optionValue.toLowerCase() === 'other' ? otherText : undefined);
      } else {
        // Close dropdown for single-select
        onChange(optionValue, optionValue.toLowerCase() === 'other' ? otherText : undefined);
        setIsOpen(false);
      }
    },
    [multiple, selectedValues, allSelected, options, onChange, otherText]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < displayOptions.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;

        case 'Home':
          e.preventDefault();
          setHighlightedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setHighlightedIndex(displayOptions.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (displayOptions[highlightedIndex]) {
            handleSelect(displayOptions[highlightedIndex].value);
          } else if (searchText && filteredOptions.length === 1) {
            // Auto-select if exactly one match
            handleSelect(filteredOptions[0].value);
          } else if (searchText && allowFreeText) {
            // Add as custom value if allowed
            onChange(multiple ? [...selectedValues, searchText] : searchText);
            setSearchText('');
            if (!multiple) setIsOpen(false);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchText('');
          break;
      }
    },
    [isOpen, displayOptions, highlightedIndex, searchText, filteredOptions, allowFreeText, multiple, selectedValues, handleSelect, onChange]
  );

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchText('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle other text change
  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (isOtherSelected) {
      onChange(selectedValues, text);
    }
  };

  // Remove chip in multi-select
  const handleRemoveChip = useCallback(
    (valueToRemove: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newValues = selectedValues.filter(v => v !== valueToRemove);
      onChange(newValues);
      if (valueToRemove.toLowerCase() === 'other') {
        setOtherText('');
      }
    },
    [selectedValues, onChange]
  );

  // Clear all selections
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(multiple ? [] : '');
      setOtherText('');
    },
    [multiple, onChange]
  );

  // Get display label
  const getDisplayLabel = () => {
    if (selectedValues.length === 0) return placeholder;
    if (multiple) {
      return `${selectedValues.length} selected`;
    }
    const selected = options.find(opt => opt.value === selectedValues[0]);
    return selected?.label || selectedValues[0];
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'ring-2 ring-ring ring-offset-2'
        )}
      >
        <span className={cn('truncate', selectedValues.length === 0 && 'text-muted-foreground')}>
          {getDisplayLabel()}
        </span>
        <div className="flex items-center gap-2">
          {allowClear && !multiple && selectedValues.length > 0 && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
              aria-label="Clear selection"
            />
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 opacity-50 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Selected Chips for Multi-Select */}
      {multiple && selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedValues.map(val => {
            const option = options.find(opt => opt.value === val);
            return (
              <div
                key={val}
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
              >
                <span className="truncate max-w-[200px]" title={option?.label || val}>
                  {option?.label || val}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(val, e)}
                  className="rounded-full p-0.5 hover:bg-secondary-foreground/20 focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`Remove ${option?.label || val}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md"
          role="listbox"
          aria-label="Location options"
        >
          {/* Search Input */}
          <div className="border-b p-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search locations..."
              className="w-full rounded-md border-0 bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-0"
              aria-label="Search locations"
              aria-controls="location-options-list"
              aria-autocomplete="list"
            />
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            id="location-options-list"
            className="max-h-[240px] overflow-y-auto p-1 custom-scrollbar"
            role="listbox"
            aria-label={`${displayOptions.length} locations available`}
          >
            {displayOptions.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No matching location
              </div>
            ) : (
              displayOptions.map((option, index) => {
                const isSelected =
                  option.value === '__select_all__'
                    ? allSelected
                    : selectedValues.includes(option.value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'relative flex cursor-pointer items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors',
                      isHighlighted && 'bg-accent',
                      isSelected && 'font-medium',
                      'hover:bg-accent focus:bg-accent'
                    )}
                    title={option.label}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Results Count for Screen Readers */}
          <div className="sr-only" role="status" aria-live="polite">
            {displayOptions.length} location{displayOptions.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}

      {/* Other Text Input */}
      {isOtherSelected && hasOtherOption && (
        <div className="mt-2">
          <input
            ref={otherInputRef}
            type="text"
            value={otherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            placeholder="Type location"
            required
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'placeholder:text-muted-foreground'
            )}
            aria-label="Custom location text"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Please specify the location
          </p>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
        }
      `}</style>
    </div>
  );
};

export default LocationDropdown;
