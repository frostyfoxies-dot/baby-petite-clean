/**
 * Tax Calculation Module
 *
 * Handles tax calculations based on shipping destination.
 * Currently supports US states, Malaysia (MY), Singapore (SG).
 *
 * Future: integrate with TaxJar/Avalara for automated rates.
 */

export interface TaxRate {
  country: string;
  state?: string; // For US states
  rate: number; // decimal, e.g., 0.08 for 8%
  name: string; // e.g., "CA Sales Tax"
  isIncludedInPrice: boolean; // VAT-style countries
}

// Static tax rates (will be replaced by API later)
const TAX_RATES: Record<string, TaxRate | Record<string, TaxRate>> = {
  US: {
    // US states with sales tax
    CA: { country: 'US', state: 'CA', rate: 0.0725, name: 'California Sales Tax', isIncludedInPrice: false },
    NY: { country: 'US', state: 'NY', rate: 0.08875, name: 'New York Sales Tax', isIncludedInPrice: false },
    TX: { country: 'US', state: 'TX', rate: 0.0625, name: 'Texas Sales Tax', isIncludedInPrice: false },
    FL: { country: 'US', state: 'FL', rate: 0.06, name: 'Florida Sales Tax', isIncludedInPrice: false },
    // Default US rate for states not listed (will need lookup for accuracy)
    '_default': { country: 'US', rate: 0.05, name: 'US Sales Tax (Default)', isIncludedInPrice: false },
  },
  MY: { country: 'MY', rate: 0.10, name: 'Malaysia SST', isIncludedInPrice: false },
  SG: { country: 'SG', rate: 0.07, name: 'Singapore GST', isIncludedInPrice: false },
  // Add more countries as needed
  '_default': { country: 'XX', rate: 0, name: 'No Tax', isIncludedInPrice: false },
};

/**
 * Get tax rate for a given shipping address
 */
export function getTaxRate(
  country: string,
  state?: string | null
): TaxRate {
  const countryRates = TAX_RATES[country] || TAX_RATES['_default'];

  if (typeof countryRates === 'object' && '_default' in countryRates) {
    // Country object with states
    if (state) {
      const stateRate = countryRates[state as keyof typeof countryRates] as TaxRate | undefined;
      if (stateRate) return stateRate;
    }
    return (countryRates._default as TaxRate);
  }

  // Country-level only
  return countryRates as TaxRate;
}

/**
 * Calculate tax amount for an order subtotal
 * @param subtotal - Pre-tax amount (excluding shipping)
 * @param shipping - Shipping cost (may be taxable depending on jurisdiction)
 * @param country - Shipping address country code (ISO 2)
 * @param state - Shipping address state/province (if applicable)
 * @returns Tax amount rounded to 2 decimals
 */
export function calculateTax(
  subtotal: number,
  shipping: number,
  country: string,
  state?: string | null
): number {
  const taxRate = getTaxRate(country, state);
  // In most jurisdictions, shipping is taxable
  const taxableAmount = subtotal + shipping;
  const tax = taxableAmount * taxRate.rate;
  return Math.round(tax * 100) / 100;
}

/**
 * Format tax rate for display (e.g. "8%")
 */
export function formatTaxRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * List of supported countries with tax rates
 */
export const SUPPORTED_TAX_COUNTRIES = ['US', 'MY', 'SG'];
