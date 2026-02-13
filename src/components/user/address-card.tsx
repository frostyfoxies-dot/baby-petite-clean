'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Edit, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Address data type
 */
export interface AddressData {
  /**
   * Address ID
   */
  id: string;
  /**
   * Address label (e.g., "Home", "Work")
   */
  label?: string;
  /**
   * Recipient name
   */
  name: string;
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
   * Country
   */
  country: string;
  /**
   * Phone number
   */
  phone?: string;
  /**
   * Whether this is the default address
   */
  isDefault?: boolean;
}

/**
 * Address card component props
 */
export interface AddressCardProps {
  /**
   * Address data
   */
  address: AddressData;
  /**
   * Callback when edit is clicked
   */
  onEdit?: (addressId: string) => void;
  /**
   * Callback when delete is clicked
   */
  onDelete?: (addressId: string) => void;
  /**
   * Callback when set as default is clicked
   */
  onSetDefault?: (addressId: string) => void;
  /**
   * Whether to show edit button
   * @default true
   */
  showEdit?: boolean;
  /**
   * Whether to show delete button
   * @default true
   */
  showDelete?: boolean;
  /**
   * Whether to show set default button
   * @default true
   */
  showSetDefault?: boolean;
  /**
   * Whether the card is selectable
   * @default false
   */
  selectable?: boolean;
  /**
   * Whether the card is selected
   * @default false
   */
  selected?: boolean;
  /**
   * Callback when card is selected
   */
  onSelect?: (addressId: string) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Address card with edit/delete
 * 
 * @example
 * ```tsx
 * <AddressCard
 *   address={address}
 *   onEdit={(id) => editAddress(id)}
 *   onDelete={(id) => deleteAddress(id)}
 *   onSetDefault={(id) => setDefaultAddress(id)}
 *   selectable
 *   selected={selectedAddressId === address.id}
 *   onSelect={(id) => setSelectedAddressId(id)}
 * />
 * ```
 */
export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  showEdit = true,
  showDelete = true,
  showSetDefault = true,
  selectable = false,
  selected = false,
  onSelect,
  className,
}: AddressCardProps) {
  const handleSelect = () => {
    if (selectable) {
      onSelect?.(address.id);
    }
  };

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        selectable && 'cursor-pointer',
        selected && 'border-yellow ring-2 ring-yellow ring-offset-2',
        className
      )}
      onClick={handleSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Address info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {address.label && (
                <Badge variant="secondary" size="sm">
                  {address.label}
                </Badge>
              )}
              {address.isDefault && (
                <Badge variant="primary" size="sm" leftIcon={<Star className="w-3 h-3" />}>
                  Default
                </Badge>
              )}
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{address.name}</p>
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                {address.phone && (
                  <p className="mt-1">{address.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            {showSetDefault && !address.isDefault && onSetDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDefault(address.id);
                }}
                className="text-xs"
              >
                Set Default
              </Button>
            )}
            {showEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(address.id);
                }}
                className="text-xs"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {showDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(address.id);
                }}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
