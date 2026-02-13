'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CreditCard, Lock } from 'lucide-react';

/**
 * Payment method type
 */
export type PaymentMethodType = 'card' | 'paypal' | 'apple-pay' | 'google-pay';

/**
 * Payment method option type
 */
export interface PaymentMethodOption {
  /**
   * Method ID
   */
  id: string;
  /**
   * Method type
   */
  type: PaymentMethodType;
  /**
   * Method name
   */
  name: string;
  /**
   * Method description
   */
  description?: string;
  /**
   * Icon component
   */
  icon?: React.ReactNode;
}

/**
 * Payment method component props
 */
export interface PaymentMethodProps {
  /**
   * Available payment methods
   */
  methods: PaymentMethodOption[];
  /**
   * Currently selected method ID
   */
  selectedMethodId?: string;
  /**
   * Callback when method is selected
   */
  onSelect: (methodId: string) => void;
  /**
   * Whether to show secure badge
   * @default true
   */
  showSecureBadge?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Minimal payment method selector
 * 
 * @example
 * ```tsx
 * <PaymentMethod
 *   methods={[
 *     { id: 'card', type: 'card', name: 'Credit Card', icon: <CreditCard /> },
 *     { id: 'paypal', type: 'paypal', name: 'PayPal' }
 *   ]}
 *   selectedMethodId={selectedMethod}
 *   onSelect={setSelectedMethod}
 * />
 * ```
 */
export function PaymentMethod({
  methods,
  selectedMethodId,
  onSelect,
  showSecureBadge = true,
  className,
}: PaymentMethodProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {methods.map((method) => {
        const isSelected = method.id === selectedMethodId;

        return (
          <label
            key={method.id}
            className={cn(
              // Base styles
              'flex items-center gap-4 p-4 rounded-md border cursor-pointer',
              'transition-all duration-200',
              // Focus state
              'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
              // Selected state
              isSelected
                ? 'border-yellow bg-yellow/5'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            {/* Radio input */}
            <input
              type="radio"
              name="payment-method"
              value={method.id}
              checked={isSelected}
              onChange={() => onSelect(method.id)}
            />

            {/* Icon */}
            <div className={cn(
              'flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center',
              isSelected ? 'bg-yellow text-gray-900' : 'bg-gray-100 text-gray-600'
            )}>
              {method.icon || <CreditCard className="w-5 h-5" />}
            </div>

            {/* Method details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900">
                {method.name}
              </h4>
              {method.description && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {method.description}
                </p>
              )}
            </div>

            {/* Secure badge */}
            {showSecureBadge && isSelected && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Lock className="w-3 h-3" />
                <span>Secure</span>
              </div>
            )}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Card input form component
 */
export interface CardInputFormProps {
  /**
   * Callback when card details are submitted
   */
  onSubmit: (data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }) => void | Promise<void>;
  /**
   * Whether the form is submitting
   */
  isSubmitting?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Card input form for credit card details
 */
export function CardInputForm({
  onSubmit,
  isSubmitting = false,
  className,
}: CardInputFormProps) {
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiryMonth, setExpiryMonth] = React.useState('');
  const [expiryYear, setExpiryYear] = React.useState('');
  const [cvv, setCvv] = React.useState('');
  const [cardholderName, setCardholderName] = React.useState('');

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardNumber(formatCardNumber(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName,
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {/* Card number */}
      <div>
        <label className="text-sm font-medium text-gray-900 mb-2 block">
          Card Number
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          maxLength={19}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
          required
        />
      </div>

      {/* Cardholder name */}
      <div>
        <label className="text-sm font-medium text-gray-900 mb-2 block">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
          required
        />
      </div>

      {/* Expiry and CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-900 mb-2 block">
            Expiry Date
          </label>
          <div className="flex gap-2">
            <select
              value={expiryMonth}
              onChange={(e) => setExpiryMonth(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
              required
            >
              <option value="">MM</option>
              {months.map((month) => (
                <option key={month} value={month.toString().padStart(2, '0')}>
                  {month.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <select
              value={expiryYear}
              onChange={(e) => setExpiryYear(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
              required
            >
              <option value="">YY</option>
              {years.map((year) => (
                <option key={year} value={year.toString().slice(-2)}>
                  {year.toString().slice(-2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-900 mb-2 block">
            CVV
          </label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            maxLength={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Secure badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Submit button */}
      <Button type="submit" fullWidth loading={isSubmitting}>
        Pay Now
      </Button>
    </form>
  );
}
