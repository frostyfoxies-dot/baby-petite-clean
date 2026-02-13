'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';
import { Input, InputProps } from '@/components/ui/input';

/**
 * Country code type
 */
export interface CountryCode {
  /**
   * Country code (e.g., "US", "MY")
   */
  code: string;
  /**
   * Country name
   */
  name: string;
  /**
   * Dial code (e.g., "+1", "+60")
   */
  dialCode: string;
  /**
   * Country flag emoji
   */
  flag: string;
}

/**
 * Default country codes
 */
export const DEFAULT_COUNTRY_CODES: CountryCode[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
];

/**
 * Phone input component props
 */
export interface PhoneInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  /**
   * Phone value (full number with country code)
   */
  value?: string;
  /**
   * Callback when phone value changes
   */
  onChange?: (value: string) => void;
  /**
   * Default country code
   * @default "US"
   */
  defaultCountry?: string;
  /**
   * Available country codes
   * @default DEFAULT_COUNTRY_CODES
   */
  countryCodes?: CountryCode[];
  /**
   * Whether to show country selector
   * @default true
   */
  showCountrySelector?: boolean;
  /**
   * Whether to show phone icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Input size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Phone number input
 * 
 * @example
 * ```tsx
 * <PhoneInput
 *   value={phone}
 *   onChange={setPhone}
 *   defaultCountry="MY"
 *   placeholder="123456789"
 * />
 * ```
 */
export function PhoneInput({
  value = '',
  onChange,
  defaultCountry = 'US',
  countryCodes = DEFAULT_COUNTRY_CODES,
  showCountrySelector = true,
  showIcon = true,
  size = 'md',
  className,
  ...props
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = React.useState<CountryCode>(
    countryCodes.find((c) => c.code === defaultCountry) || countryCodes[0]
  );
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      // Try to find matching country code
      for (const country of countryCodes) {
        if (value.startsWith(country.dialCode)) {
          setSelectedCountry(country);
          setPhoneNumber(value.slice(country.dialCode.length));
          return;
        }
      }
      // No match found, use default
      setPhoneNumber(value);
    }
  }, [value, countryCodes]);

  // Update full value when phone number or country changes
  React.useEffect(() => {
    const fullValue = phoneNumber ? `${selectedCountry.dialCode}${phoneNumber}` : '';
    onChange?.(fullValue);
  }, [phoneNumber, selectedCountry, onChange]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '');
    setPhoneNumber(digits);
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const filteredCountries = countryCodes.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11',
    lg: 'h-13 text-lg',
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex">
        {/* Country selector */}
        {showCountrySelector && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                'flex items-center gap-2 px-3 border border-r-0 border-gray-300 rounded-l-md bg-white',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
                sizeClasses[size]
              )}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm text-gray-600">{selectedCountry.dialCode}</span>
            </button>

            {/* Country dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                {/* Search */}
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow"
                    autoFocus
                  />
                </div>

                {/* Country list */}
                <ul role="listbox">
                  {filteredCountries.map((country) => (
                    <li
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50',
                        selectedCountry.code === country.code && 'bg-yellow/10'
                      )}
                      role="option"
                      aria-selected={selectedCountry.code === country.code}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1 text-sm">{country.name}</span>
                      <span className="text-xs text-gray-500">{country.dialCode}</span>
                    </li>
                  ))}
                  {filteredCountries.length === 0 && (
                    <li className="px-3 py-4 text-sm text-gray-500 text-center">
                      No countries found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Phone input */}
        <div className="relative flex-1">
          {showIcon && (
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
          <Input
            ref={inputRef}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="123456789"
            className={cn(
              !showCountrySelector && 'rounded-l-md',
              showCountrySelector && 'rounded-l-none rounded-r-md',
              showIcon && 'pl-10',
              sizeClasses[size]
            )}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}
