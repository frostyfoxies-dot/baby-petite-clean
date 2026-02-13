'use client';

import * as React from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { cn } from '@/lib/utils';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import {
  parseGoogleAddress,
  validateAddress,
  ParsedAddress,
  isGoogleMapsConfigured,
} from '@/lib/address-validation';

/**
 * Address autocomplete component props
 */
export interface AddressAutocompleteProps {
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display
   */
  helperText?: string;
  /**
   * Whether the input is required
   */
  required?: boolean;
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  /**
   * Initial value
   */
  initialValue?: string;
  /**
   * Current value (controlled)
   */
  value?: string;
  /**
   * Callback when an address is selected
   */
  onAddressSelect: (address: ParsedAddress) => void;
  /**
   * Callback when the input value changes
   */
  onInputChange?: (value: string) => void;
  /**
   * Callback when there's an error
   */
  onError?: (error: string) => void;
  /**
   * Country restrictions (ISO 3166-1 Alpha-2 codes)
   */
  countryRestrictions?: string[];
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Input ID
   */
  id?: string;
  /**
   * Whether to show the manual entry fallback
   */
  showManualEntryFallback?: boolean;
  /**
   * Callback when user clicks manual entry
   */
  onManualEntryClick?: () => void;
}

/**
 * Google Maps libraries needed for Places Autocomplete
 */
const libraries: ('places')[] = ['places'];

/**
 * Address Autocomplete Component
 * 
 * Provides Google Places Autocomplete functionality for address input.
 * Falls back to manual entry when Google Maps API is not available.
 * 
 * @example
 * ```tsx
 * <AddressAutocomplete
 *   label="Shipping Address"
 *   placeholder="Enter your address"
 *   onAddressSelect={(address) => {
 *     console.log('Selected address:', address);
 *   }}
 * />
 * ```
 */
export function AddressAutocomplete({
  label = 'Address',
  placeholder = 'Enter your address',
  error,
  helperText = 'Start typing your address to see suggestions',
  required = false,
  disabled = false,
  initialValue = '',
  value,
  onAddressSelect,
  onInputChange,
  onError,
  countryRestrictions = ['us', 'ca'],
  className,
  id,
  showManualEntryFallback = true,
  onManualEntryClick,
}: AddressAutocompleteProps) {
  const inputId = id || React.useId();
  const [inputValue, setInputValue] = React.useState(value ?? initialValue);
  const [isLoading, setIsLoading] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);

  // Check if Google Maps API is configured
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isConfigured = isGoogleMapsConfigured();

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || '',
    libraries,
  });

  // Handle API load errors
  React.useEffect(() => {
    if (loadError || !isConfigured) {
      setIsApiAvailable(false);
      if (loadError) {
        setInternalError('Address autocomplete is unavailable. Please enter your address manually.');
        onError?.('Google Maps API failed to load');
      }
    }
  }, [loadError, isConfigured, onError]);

  // Sync value prop with internal state
  React.useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  /**
   * Handle autocomplete load
   */
  const onLoad = React.useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    
    // Set fields to return
    autocomplete.setFields(['address_components', 'formatted_address', 'geometry', 'place_id']);
    
    // Set country restrictions
    if (countryRestrictions.length > 0) {
      autocomplete.setComponentRestrictions({
        country: countryRestrictions,
      });
    }
    
    // Set types to addresses only
    autocomplete.setTypes(['address']);
  }, [countryRestrictions]);

  /**
   * Handle autocomplete unmount
   */
  const onUnmount = React.useCallback(() => {
    autocompleteRef.current = null;
  }, []);

  /**
   * Handle place selection from autocomplete
   */
  const onPlaceChanged = React.useCallback(() => {
    if (!autocompleteRef.current) return;

    setIsLoading(true);
    setInternalError(null);

    try {
      const place = autocompleteRef.current.getPlace();
      
      if (!place || !place.address_components) {
        setInternalError('Unable to get address details. Please try again or enter manually.');
        setIsLoading(false);
        return;
      }

      // Parse the address
      const parsedAddress = parseGoogleAddress(place as any);
      
      // Validate the address
      const validation = validateAddress(parsedAddress);
      
      if (!validation.isValid) {
        setInternalError(validation.errors[0] || 'Invalid address. Please try again.');
        setIsLoading(false);
        return;
      }

      // Notify parent of selection
      onAddressSelect(parsedAddress);
      setInputValue(parsedAddress.formattedAddress);
      
      if (validation.warnings.length > 0) {
        console.warn('Address validation warnings:', validation.warnings);
      }
    } catch (err) {
      console.error('Error processing place:', err);
      setInternalError('Failed to process address. Please try again.');
      onError?.('Failed to process address');
    } finally {
      setIsLoading(false);
    }
  }, [onAddressSelect, onError]);

  /**
   * Handle input value changes
   */
  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onInputChange?.(newValue);
    },
    [onInputChange]
  );

  // If API is not available, show manual input
  if (!isApiAvailable || !isConfigured) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-900"
          >
            {label}
            {required && <span className="text-yellow ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full px-3 py-2 text-sm',
              'bg-white border rounded-md',
              'text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              (error || internalError) && 'border-red-500 focus:ring-red-500',
              !(error || internalError) && 'border-gray-200'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <MapPin className="w-4 h-4" />
          </div>
        </div>
        {(error || internalError) && (
          <p className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error || internalError}
          </p>
        )}
        {helperText && !error && !internalError && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  // Show loading state while API loads
  if (!isLoaded) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-900"
          >
            {label}
            {required && <span className="text-yellow ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={true}
            required={required}
            className={cn(
              'w-full px-3 py-2 pr-10 text-sm',
              'bg-white border rounded-md',
              'text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-200',
              'border-gray-200',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>
        {helperText && (
          <p className="text-xs text-gray-500">Loading address autocomplete...</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium text-gray-900',
            disabled && 'text-gray-400'
          )}
        >
          {label}
          {required && <span className="text-yellow ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Google Places Autocomplete */}
        <Autocomplete
          onLoad={onLoad}
          onUnmount={onUnmount}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
              'w-full px-3 py-2 pr-10 text-sm',
              'bg-white border rounded-md',
              'text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              (error || internalError) && 'border-red-500 focus:ring-red-500',
              !(error || internalError) && 'border-gray-200'
            )}
          />
        </Autocomplete>
        
        {/* Map pin icon */}
        {!isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <MapPin className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {(error || internalError) && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error || internalError}
        </p>
      )}
      
      {/* Helper text */}
      {helperText && !error && !internalError && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      
      {/* Manual entry fallback */}
      {showManualEntryFallback && (
        <button
          type="button"
          onClick={onManualEntryClick}
          className="text-xs text-yellow-dark hover:text-yellow underline underline-offset-2 text-left"
        >
          Can't find your address? Enter it manually
        </button>
      )}
    </div>
  );
}

/**
 * Google Maps Provider Wrapper
 * 
 * Wrap your app or component tree with this to enable Google Places Autocomplete.
 * Note: This is now optional since AddressAutocomplete handles its own loading.
 * 
 * @example
 * ```tsx
 * <GoogleMapsProvider>
 *   <AddressAutocomplete onAddressSelect={handleAddressSelect} />
 * </GoogleMapsProvider>
 * ```
 */
export interface GoogleMapsProviderProps {
  children: React.ReactNode;
  apiKey?: string;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  // The AddressAutocomplete component now handles its own API loading
  // This provider is kept for backward compatibility and potential future use
  return <>{children}</>;
}

export default AddressAutocomplete;
