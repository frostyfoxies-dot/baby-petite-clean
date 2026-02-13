/**
 * Address Components
 * 
 * Export address-related components for address input and validation.
 */

export {
  AddressAutocomplete,
  GoogleMapsProvider,
  type AddressAutocompleteProps,
  type GoogleMapsProviderProps,
} from './address-autocomplete';

// Re-export types and utilities from address-validation
export {
  parseGoogleAddress,
  validateAddress,
  formatAddressForDisplay,
  formatAddressSingleLine,
  formatAddressForStorage,
  isGoogleMapsConfigured,
  getStatesForCountry,
  getCountryName,
  getStateName,
  COUNTRIES,
  US_STATES,
  CA_PROVINCES,
  type ParsedAddress,
  type AddressValidationResult,
  type AutocompletePrediction,
} from '@/lib/address-validation';
