'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AddressAutocomplete } from '@/components/address';
import { ParsedAddress, COUNTRIES, getStatesForCountry } from '@/lib/address-validation';
import type { AddressData } from './address-form';

/**
 * Address form component props
 */
export interface AddressFormWithAutocompleteProps {
  /**
   * Initial address values
   */
  initialValues?: Partial<AddressData>;
  /**
   * Callback when form is submitted
   */
  onSubmit: (data: AddressData) => void | Promise<void>;
  /**
   * Callback when cancel is clicked
   */
  onCancel?: () => void;
  /**
   * Whether the form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Submit button text
   * @default 'Save Address'
   */
  submitText?: string;
  /**
   * Whether to show save as default checkbox
   * @default true
   */
  showDefaultCheckbox?: boolean;
  /**
   * Whether to show company field
   * @default true
   */
  showCompanyField?: boolean;
  /**
   * Whether to show address2 field
   * @default true
   */
  showAddress2Field?: boolean;
  /**
   * Form title
   */
  title?: string;
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Whether to use autocomplete for address
   * @default true
   */
  enableAutocomplete?: boolean;
}

/**
 * Address form with Google Places Autocomplete integration
 * 
 * @example
 * ```tsx
 * <AddressFormWithAutocomplete
 *   onSubmit={async (data) => {
 *     await saveAddress(data);
 *   }}
 *   isSubmitting={isSaving}
 * />
 * ```
 */
export function AddressFormWithAutocomplete({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Save Address',
  showDefaultCheckbox = true,
  showCompanyField = true,
  showAddress2Field = true,
  title,
  className,
  enableAutocomplete = true,
}: AddressFormWithAutocompleteProps) {
  const [formData, setFormData] = React.useState<AddressData>({
    firstName: initialValues?.firstName || '',
    lastName: initialValues?.lastName || '',
    company: initialValues?.company || '',
    address1: initialValues?.address1 || '',
    address2: initialValues?.address2 || '',
    city: initialValues?.city || '',
    state: initialValues?.state || '',
    postalCode: initialValues?.postalCode || '',
    country: initialValues?.country || 'US',
    phone: initialValues?.phone || '',
    isDefault: initialValues?.isDefault || false,
  });
  
  const [useAutocomplete, setUseAutocomplete] = React.useState(enableAutocomplete);
  const [addressSelected, setAddressSelected] = React.useState(false);

  // Get states for selected country
  const states = React.useMemo(() => {
    return getStatesForCountry(formData.country);
  }, [formData.country]);

  const handleChange = (field: keyof AddressData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Handle address selection from autocomplete
   */
  const handleAddressSelect = (address: ParsedAddress) => {
    setFormData((prev) => ({
      ...prev,
      address1: address.line1,
      address2: address.line2 || prev.address2,
      city: address.city,
      state: address.stateCode || address.state,
      postalCode: address.postalCode,
      country: address.countryCode || prev.country,
    }));
    setAddressSelected(true);
  };

  /**
   * Handle manual entry click
   */
  const handleManualEntryClick = () => {
    setUseAutocomplete(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      )}

      {/* Name fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
          />
        </div>

        {/* Company */}
        {showCompanyField && (
          <Input
            label="Company (optional)"
            value={formData.company}
            onChange={(e) => handleChange('company', e.target.value)}
          />
        )}

        {/* Address with Autocomplete */}
        {useAutocomplete && enableAutocomplete ? (
          <AddressAutocomplete
            label="Address"
            placeholder="Start typing your address..."
            value={formData.address1}
            onAddressSelect={handleAddressSelect}
            onInputChange={(value) => handleChange('address1', value)}
            onManualEntryClick={handleManualEntryClick}
            showManualEntryFallback={true}
            required
          />
        ) : (
          <Input
            label="Address"
            value={formData.address1}
            onChange={(e) => handleChange('address1', e.target.value)}
            required
          />
        )}

        {showAddress2Field && (
          <Input
            label="Apartment, suite, etc. (optional)"
            value={formData.address2}
            onChange={(e) => handleChange('address2', e.target.value)}
          />
        )}

        {/* City, State, Postal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            required
          />
          {states.length > 0 ? (
            <Select
              label="State"
              options={states}
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              required
            />
          ) : (
            <Input
              label="State/Province"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              required
            />
          )}
          <Input
            label="ZIP Code"
            value={formData.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            required
          />
        </div>

        {/* Country */}
        <Select
          label="Country"
          options={COUNTRIES.map(c => ({ value: c.value, label: c.label }))}
          value={formData.country}
          onChange={(e) => handleChange('country', e.target.value)}
          required
        />

        {/* Phone */}
        <Input
          type="tel"
          label="Phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          required
        />

        {/* Save as default */}
        {showDefaultCheckbox && (
          <Checkbox
            label="Save as default address"
            checked={formData.isDefault}
            onChange={(checked) => handleChange('isDefault', checked)}
          />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            fullWidth={!onCancel}
            loading={isSubmitting}
          >
            {submitText}
          </Button>
        </div>
      </form>
  );
}

export default AddressFormWithAutocomplete;
