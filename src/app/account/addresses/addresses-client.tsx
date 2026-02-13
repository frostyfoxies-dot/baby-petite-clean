'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { AddressFormWithAutocomplete } from '@/components/checkout/address-form-with-autocomplete';
import { AddressData } from '@/components/checkout/address-form';
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/actions/addresses';
import { AddressType } from '@prisma/client';

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  type: AddressType;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressesClientProps {
  initialAddresses: Address[];
}

/**
 * Account addresses page client component
 * Allows users to manage their shipping addresses
 */
export default function AddressesClient({ initialAddresses }: AddressesClientProps) {
  const router = useRouter();
  const [addresses, setAddresses] = React.useState<Address[]>(initialAddresses);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddAddress = async (data: AddressData) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await createAddress({
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        line1: data.address1,
        line2: data.address2,
        city: data.city,
        state: data.state,
        zip: data.postalCode,
        country: data.country,
        phone: data.phone,
        isDefault: data.isDefault,
        type: 'SHIPPING',
      });

      if (result.success && result.data) {
        setMessage({ type: 'success', text: 'Address added successfully!' });
        setShowAddForm(false);
        router.refresh();
        // Refresh addresses
        const addressesResult = await fetch('/api/user/addresses').then(res => res.json());
        if (addressesResult.addresses) {
          setAddresses(addressesResult.addresses);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add address' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAddress = async (data: AddressData) => {
    if (!editingAddress) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateAddress(editingAddress.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        line1: data.address1,
        line2: data.address2,
        city: data.city,
        state: data.state,
        zip: data.postalCode,
        country: data.country,
        phone: data.phone,
        isDefault: data.isDefault,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Address updated successfully!' });
        setEditingAddress(null);
        router.refresh();
        // Refresh addresses
        const addressesResult = await fetch('/api/user/addresses').then(res => res.json());
        if (addressesResult.addresses) {
          setAddresses(addressesResult.addresses);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update address' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setDeletingId(id);
    setMessage(null);

    try {
      const result = await deleteAddress(id);

      if (result.success) {
        setMessage({ type: 'success', text: 'Address deleted successfully!' });
        setAddresses(prev => prev.filter(addr => addr.id !== id));
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete address' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setMessage(null);

    try {
      const result = await setDefaultAddress(id, 'SHIPPING');

      if (result.success) {
        setMessage({ type: 'success', text: 'Default address updated!' });
        setAddresses(prev => 
          prev.map(addr => ({
            ...addr,
            isDefault: addr.id === id,
          }))
        );
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to set default address' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  // Convert Address to AddressData for the form
  const addressToFormData = (address: Address): AddressData => ({
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company || undefined,
    address1: address.line1,
    address2: address.line2 || undefined,
    city: address.city,
    state: address.state,
    postalCode: address.zip,
    country: address.country,
    phone: address.phone || '',
    isDefault: address.isDefault,
  });

  return (
    <div className="space-y-6">
      {/* Message alert */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Addresses
          </h2>
          <p className="text-gray-600">
            Manage your shipping addresses for faster checkout.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Address
        </Button>
      </div>

      {/* Add address form */}
      {showAddForm && (
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Address
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
          <AddressFormWithAutocomplete
            onSubmit={handleAddAddress}
            onCancel={() => setShowAddForm(false)}
            submitText="Add Address"
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Edit address form */}
      {editingAddress && (
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Address
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingAddress(null)}>
              Cancel
            </Button>
          </div>
          <AddressFormWithAutocomplete
            initialValues={addressToFormData(editingAddress)}
            onSubmit={handleEditAddress}
            onCancel={() => setEditingAddress(null)}
            submitText="Update Address"
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Addresses list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="bg-white rounded-lg p-6 border-2 border-transparent hover:border-gray-200 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                {address.isDefault && (
                  <span className="px-2 py-0.5 bg-yellow/20 text-yellow-dark text-xs font-medium rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAddress(address)}
                  aria-label="Edit address"
                  disabled={!!deletingId}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAddress(address.id)}
                  aria-label="Delete address"
                  className="text-red-600 hover:text-red-700"
                  loading={deletingId === address.id}
                  disabled={!!deletingId && deletingId !== address.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-gray-900">
                {address.firstName} {address.lastName}
              </p>
              {address.company && (
                <p className="text-sm text-gray-600">{address.company}</p>
              )}
              <p className="text-sm text-gray-600">
                {address.line1}
              </p>
              {address.line2 && (
                <p className="text-sm text-gray-600">{address.line2}</p>
              )}
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} {address.zip}
              </p>
              {address.phone && (
                <p className="text-sm text-gray-600">{address.phone}</p>
              )}
            </div>

            {!address.isDefault && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(address.id)}
                >
                  Set as Default
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {addresses.length === 0 && !showAddForm && (
        <div className="bg-white rounded-lg p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            No addresses saved yet
          </p>
          <Button onClick={() => setShowAddForm(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Your First Address
          </Button>
        </div>
      )}
    </div>
  );
}
