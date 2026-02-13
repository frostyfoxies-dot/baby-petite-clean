/**
 * Address Validation Utility
 * 
 * Provides functions for validating, parsing, and formatting addresses
 * from Google Places Autocomplete API results.
 */

/**
 * Parsed address components from Google Places API
 */
export interface ParsedAddress {
  /**
   * Street number (e.g., "123")
   */
  streetNumber: string;
  /**
   * Street name (e.g., "Main Street")
   */
  street: string;
  /**
   * Address line 1 (street number + street name)
   */
  line1: string;
  /**
   * Address line 2 (apartment, suite, etc.)
   */
  line2?: string;
  /**
   * City / Locality
   */
  city: string;
  /**
   * State / Province / Region
   */
  state: string;
  /**
   * State code (e.g., "CA", "NY")
   */
  stateCode: string;
  /**
   * Postal / ZIP code
   */
  postalCode: string;
  /**
   * Country name
   */
  country: string;
  /**
   * Country code (e.g., "US", "CA")
   */
  countryCode: string;
  /**
   * Full formatted address
   */
  formattedAddress: string;
  /**
   * Place ID from Google
   */
  placeId?: string;
  /**
   * Latitude coordinate
   */
  lat?: number;
  /**
   * Longitude coordinate
   */
  lng?: number;
}

/**
 * Google Places address component type
 */
interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/**
 * Google Places geometry location
 */
interface GeometryLocation {
  lat(): number;
  lng(): number;
}

/**
 * Google Places details result
 */
interface PlaceDetailsResult {
  address_components: AddressComponent[];
  formatted_address: string;
  place_id: string;
  geometry?: {
    location: GeometryLocation;
  };
}

/**
 * Google Places autocomplete prediction
 */
export interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Address validation result
 */
export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedAddress?: ParsedAddress;
}

/**
 * Country data with states/provinces
 */
export const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'MX', label: 'Mexico' },
  { value: 'BR', label: 'Brazil' },
  { value: 'IN', label: 'India' },
] as const;

/**
 * US States
 */
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
] as const;

/**
 * Canadian Provinces
 */
export const CA_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'YT', label: 'Yukon' },
] as const;

/**
 * Get states/provinces for a country
 */
export function getStatesForCountry(countryCode: string): Array<{ value: string; label: string }> {
  switch (countryCode.toUpperCase()) {
    case 'US':
      return [...US_STATES];
    case 'CA':
      return [...CA_PROVINCES];
    default:
      return [];
  }
}

/**
 * Extract a specific address component from Google Places result
 */
function extractComponent(
  components: AddressComponent[],
  type: string,
  useShortName = false
): string {
  const component = components.find((c) => c.types.includes(type));
  return component ? (useShortName ? component.short_name : component.long_name) : '';
}

/**
 * Parse Google Places address components into a structured address
 */
export function parseGoogleAddress(place: PlaceDetailsResult): ParsedAddress {
  const components = place.address_components;
  
  const streetNumber = extractComponent(components, 'street_number');
  const street = extractComponent(components, 'route');
  const city = 
    extractComponent(components, 'locality') ||
    extractComponent(components, 'sublocality') ||
    extractComponent(components, 'postal_town') ||
    extractComponent(components, 'administrative_area_level_3');
  const state = extractComponent(components, 'administrative_area_level_1');
  const stateCode = extractComponent(components, 'administrative_area_level_1', true);
  const postalCode = extractComponent(components, 'postal_code');
  const country = extractComponent(components, 'country');
  const countryCode = extractComponent(components, 'country', true);
  
  // Build line1 from street number and street
  const line1 = [streetNumber, street].filter(Boolean).join(' ');
  
  // Extract subpremise (apartment, suite, etc.) for line2
  const subpremise = extractComponent(components, 'subpremise');
  
  // Get coordinates if available
  let lat: number | undefined;
  let lng: number | undefined;
  if (place.geometry?.location) {
    lat = place.geometry.location.lat();
    lng = place.geometry.location.lng();
  }
  
  return {
    streetNumber,
    street,
    line1,
    line2: subpremise || undefined,
    city,
    state,
    stateCode,
    postalCode,
    country,
    countryCode,
    formattedAddress: place.formatted_address,
    placeId: place.place_id,
    lat,
    lng,
  };
}

/**
 * Validate a parsed address for completeness
 */
export function validateAddress(address: Partial<ParsedAddress>): AddressValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!address.line1?.trim()) {
    errors.push('Street address is required');
  }
  
  if (!address.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!address.state?.trim() && !address.stateCode?.trim()) {
    errors.push('State/Province is required');
  }
  
  if (!address.postalCode?.trim()) {
    errors.push('Postal/ZIP code is required');
  }
  
  if (!address.country?.trim() && !address.countryCode?.trim()) {
    errors.push('Country is required');
  }
  
  // Warnings for potentially incomplete addresses
  if (address.line1 && !address.streetNumber) {
    warnings.push('Street number may be missing');
  }
  
  if (address.countryCode === 'US' && address.postalCode) {
    // Validate US ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(address.postalCode)) {
      errors.push('Invalid US ZIP code format');
    }
  }
  
  if (address.countryCode === 'CA' && address.postalCode) {
    // Validate Canadian postal code format
    const postalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    if (!postalRegex.test(address.postalCode)) {
      errors.push('Invalid Canadian postal code format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedAddress: address as ParsedAddress,
  };
}

/**
 * Format address for display
 */
export function formatAddressForDisplay(address: Partial<ParsedAddress>): string {
  const parts: string[] = [];
  
  if (address.line1) {
    parts.push(address.line1);
  }
  
  if (address.line2) {
    parts.push(address.line2);
  }
  
  const cityStateZip = [
    address.city,
    address.stateCode || address.state,
    address.postalCode,
  ].filter(Boolean).join(', ');
  
  if (cityStateZip) {
    parts.push(cityStateZip);
  }
  
  if (address.country) {
    parts.push(address.country);
  }
  
  return parts.join('\n');
}

/**
 * Format address for single line display
 */
export function formatAddressSingleLine(address: Partial<ParsedAddress>): string {
  const parts: string[] = [];
  
  if (address.line1) {
    parts.push(address.line1);
  }
  
  if (address.line2) {
    parts.push(address.line2);
  }
  
  const cityStateZip = [
    address.city,
    address.stateCode || address.state,
    address.postalCode,
  ].filter(Boolean).join(' ');
  
  if (cityStateZip) {
    parts.push(cityStateZip);
  }
  
  return parts.join(', ');
}

/**
 * Format address for storage in database
 */
export function formatAddressForStorage(address: ParsedAddress): {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  return {
    line1: address.line1,
    line2: address.line2 || undefined,
    city: address.city,
    state: address.stateCode || address.state,
    zip: address.postalCode,
    country: address.countryCode || address.country,
  };
}

/**
 * Check if Google Maps API key is configured
 */
export function isGoogleMapsConfigured(): boolean {
  if (typeof window === 'undefined') {
    // Server-side check
    return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
  // Client-side check
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const country = COUNTRIES.find(c => c.value === countryCode.toUpperCase());
  return country?.label || countryCode;
}

/**
 * Get state name from state code
 */
export function getStateName(stateCode: string, countryCode: string): string {
  const states = getStatesForCountry(countryCode);
  const state = states.find(s => s.value === stateCode.toUpperCase());
  return state?.label || stateCode;
}

/**
 * Type guard for Google Places Autocomplete prediction
 */
export function isAutocompletePrediction(obj: unknown): obj is AutocompletePrediction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'description' in obj &&
    'place_id' in obj &&
    typeof (obj as AutocompletePrediction).description === 'string' &&
    typeof (obj as AutocompletePrediction).place_id === 'string'
  );
}

/**
 * Debounce function for autocomplete input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}
