'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Address data type
 */
export interface AddressData {
  /**
   * First name
   */
  firstName: string;
  /**
   * Last name
   */
  lastName: string;
  /**
   * Company name (optional)
   */
  company?: string;
  /**
   * Address line 1
   */
  address1: string;
  /**
   * Address line 2 (optional)
   */
  address2?: string;
  /**
   * City
   */
  city: string;
  /**
   * State/Province
   */
  state: string;
  /**
   * Postal/ZIP code
   */
  postalCode: string;
  /**
   * Country code
   */
  country: string;
  /**
   * Phone number
   */
  phone: string;
  /**
   * Whether to save as default
   */
  isDefault?: boolean;
}

/**
 * Address form component props
 */
export interface AddressFormProps {
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
   * Available countries
   */
  countries?: Array<{ value: string; label: string }>;
  /**
   * Available states
   */
  states?: Array<{ value: string; label: string }>;
  /**
   * Form title
   */
  title?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Clean shipping form
 * 
 * @example
 * ```tsx
 * <AddressForm
 *   onSubmit={async (data) => {
 *     await saveAddress(data);
 *   }}
 *   isSubmitting={isSaving}
 * />
 * ```
 */
export function AddressForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Save Address',
  showDefaultCheckbox = true,
  showCompanyField = true,
  showAddress2Field = true,
  countries = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
  ],
  states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'CA', label: 'California' },
    { value: 'NY', label: 'New York' },
    { value: 'TX', label: 'Texas' },
  ],
  title,
  className,
}: AddressFormProps) {
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

  const handleChange = (field: keyof AddressData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

      {/* Address */}
      <Input
        label="Address"
        value={formData.address1}
        onChange={(e) => handleChange('address1', e.target.value)}
        required
      />

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
        <Select
          label="State"
          options={states}
          value={formData.state}
          onChange={(e) => handleChange('state', e.target.value)}
          required
        />
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
        options={countries}
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
