'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AddressFormWithAutocomplete } from '@/components/checkout/address-form-with-autocomplete';
import { OrderSummary } from '@/components/checkout/order-summary';
import { Button } from '@/components/ui/button';
import { Radio } from '@/components/ui/radio';
import { Separator } from '@/components/ui/separator';
import { Truck, Clock, Loader2 } from 'lucide-react';
import { useCheckout, type CheckoutShippingAddress, type CheckoutShippingMethod } from '@/context/checkout-context';
import { getCart } from '@/actions/cart';
import { getUserAddresses } from '@/actions/addresses';
import { calculateShipping, validateDiscountCode } from '@/actions/checkout';
import { createAddress } from '@/actions/addresses';

/**
 * Saved address type from API
 */
interface SavedAddress {
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
}

/**
 * Cart item from API
 */
interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    size: string;
    color: string | null;
    price: number;
    compareAtPrice: number | null;
    sku: string;
    product: {
      id: string;
      name: string;
      slug: string;
      images: Array<{ url: string; altText: string | null }>;
    };
    inventory: {
      available: number;
    } | null;
  };
}

/**
 * Checkout shipping page component
 */
export default function CheckoutShippingPage() {
  const router = useRouter();
  const { state, actions } = useCheckout();
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [savedAddresses, setSavedAddresses] = React.useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = React.useState<'new' | 'saved'>('new');
  const [selectedSavedAddressId, setSelectedSavedAddressId] = React.useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = React.useState('standard');
  const [shippingOptions, setShippingOptions] = React.useState<CheckoutShippingMethod[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState('');
  const [promoCodeError, setPromoCodeError] = React.useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false);

  // Load cart and addresses on mount
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load cart data
        const cartResult = await getCart();
        if (!cartResult.success || !cartResult.data) {
          router.push('/cart');
          return;
        }

        const cartData = cartResult.data;
        
        // Transform cart items for checkout context
        const checkoutItems = cartData.items.map((item: CartItem) => ({
          id: item.id,
          variantId: item.variantId,
          productName: item.variant.product.name,
          productSlug: item.variant.product.slug,
          productImage: item.variant.product.images[0]?.url || '/images/placeholder.jpg',
          variantName: `${item.variant.size}${item.variant.color ? ` / ${item.variant.color}` : ''}`,
          price: item.variant.price,
          salePrice: item.variant.compareAtPrice || undefined,
          quantity: item.quantity,
        }));

        const subtotal = cartData.subtotal;
        
        actions.setCartData(cartData.id, checkoutItems, {
          subtotal,
          tax: 0, // Will be calculated after address selection
          shipping: 0, // Will be updated based on shipping method
          discount: 0,
          total: subtotal,
          currency: 'USD',
        });

        // Load saved addresses
        const addressesResult = await getUserAddresses();
        if (addressesResult.success && addressesResult.data) {
          setSavedAddresses(addressesResult.data.addresses);
          
          // Select default address if available
          const defaultAddress = addressesResult.data.addresses.find((a: SavedAddress) => a.isDefault);
          if (defaultAddress) {
            setSelectedSavedAddressId(defaultAddress.id);
            setSelectedAddress('saved');
          }
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, actions]);

  // Load shipping options when address changes
  React.useEffect(() => {
    async function loadShippingOptions() {
      if (selectedAddress === 'saved' && selectedSavedAddressId) {
        const result = await calculateShipping(selectedSavedAddressId);
        if (result.success && result.data) {
          setShippingOptions(result.data.options);
          
          // Set default shipping method
          const defaultOption = result.data.options[0];
          if (defaultOption) {
            setSelectedShipping(defaultOption.id);
            actions.setShippingMethod({
              id: defaultOption.id,
              name: defaultOption.name,
              price: defaultOption.price,
              estimatedDays: defaultOption.estimatedDays,
            });
          }
        }
      }
    }

    loadShippingOptions();
  }, [selectedAddress, selectedSavedAddressId, actions]);

  // Handle shipping method change
  const handleShippingMethodChange = (methodId: string) => {
    setSelectedShipping(methodId);
    const method = shippingOptions.find((o) => o.id === methodId);
    if (method) {
      actions.setShippingMethod({
        id: method.id,
        name: method.name,
        price: method.price,
        estimatedDays: method.estimatedDays,
      });
    }
  };

  // Handle new address submission
  const handleAddressSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Create address in database
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

      let addressId: string | undefined;
      
      if (result.success && result.data) {
        addressId = result.data.addressId;
      }

      // Set shipping address in context
      const shippingAddress: CheckoutShippingAddress = {
        id: addressId,
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
      };
      
      actions.setShippingAddress(shippingAddress);

      // Load shipping options for new address
      if (addressId) {
        const shippingResult = await calculateShipping(addressId);
        if (shippingResult.success && shippingResult.data) {
          setShippingOptions(shippingResult.data.options);
          const defaultOption = shippingResult.data.options[0];
          if (defaultOption) {
            setSelectedShipping(defaultOption.id);
            actions.setShippingMethod({
              id: defaultOption.id,
              name: defaultOption.name,
              price: defaultOption.price,
              estimatedDays: defaultOption.estimatedDays,
            });
          }
        }
      }

      router.push('/checkout/payment');
    } catch (error) {
      console.error('Error saving address:', error);
      actions.setError('Failed to save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saved address selection and continue
  const handleContinueWithSavedAddress = async () => {
    if (!selectedSavedAddressId) return;
    
    setIsSubmitting(true);
    try {
      const address = savedAddresses.find((a) => a.id === selectedSavedAddressId);
      if (!address) return;

      const shippingAddress: CheckoutShippingAddress = {
        id: address.id,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company || undefined,
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        phone: address.phone || undefined,
      };

      actions.setShippingAddress(shippingAddress);
      router.push('/checkout/payment');
    } catch (error) {
      console.error('Error selecting address:', error);
      actions.setError('Failed to select address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle promo code application
  const handleApplyPromoCode = async (code: string) => {
    if (!code.trim()) return;
    
    setIsApplyingPromo(true);
    setPromoCodeError(null);
    
    try {
      const result = await validateDiscountCode(code);
      if (result.success && result.data) {
        actions.applyDiscount(result.data.code, result.data.value);
        setPromoCode(code);
      } else {
        setPromoCodeError(result.error || 'Invalid promo code');
      }
    } catch (error) {
      setPromoCodeError('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Transform items for OrderSummary component
  const orderSummaryItems = state.items.map((item) => ({
    id: item.id,
    productId: item.variantId,
    productSlug: item.productSlug,
    productName: item.productName,
    productImage: item.productImage,
    variantName: item.variantName,
    price: item.price,
    salePrice: item.salePrice,
    quantity: item.quantity,
    maxQuantity: 99,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column - Forms */}
      <div className="lg:col-span-2 space-y-8">
        {/* Shipping address */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Shipping Address
          </h2>

          {/* Address selection */}
          {savedAddresses.length > 0 && (
            <div className="space-y-4 mb-6">
              <fieldset className="space-y-3">
                <legend className="sr-only">Choose address type</legend>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Radio
                    name="address"
                    value="saved"
                    checked={selectedAddress === 'saved'}
                    onChange={() => setSelectedAddress('saved')}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Use saved address
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Radio
                    name="address"
                    value="new"
                    checked={selectedAddress === 'new'}
                    onChange={() => setSelectedAddress('new')}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Use a new address
                  </span>
                </label>
              </fieldset>
            </div>
          )}

          {selectedAddress === 'new' || savedAddresses.length === 0 ? (
            <AddressFormWithAutocomplete
              onSubmit={handleAddressSubmit}
              submitText="Continue to Payment"
              isSubmitting={isSubmitting}
            />
          ) : (
            <div className="space-y-4">
              {/* Saved addresses list */}
              <div className="space-y-3">
                {savedAddresses.map((address) => (
                  <label
                    key={address.id}
                    className={`flex items-start gap-3 p-4 border rounded-md cursor-pointer transition-colors ${
                      selectedSavedAddressId === address.id
                        ? 'border-yellow bg-yellow/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Radio
                      name="savedAddress"
                      value={address.id}
                      checked={selectedSavedAddressId === address.id}
                      onChange={() => setSelectedSavedAddressId(address.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {address.firstName} {address.lastName}
                        </p>
                        {address.isDefault && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {address.line1}
                        {address.line2 && `, ${address.line2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.country}
                      </p>
                      {address.phone && (
                        <p className="text-sm text-gray-600 mt-1">
                          {address.phone}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <Button 
                onClick={handleContinueWithSavedAddress} 
                fullWidth
                disabled={!selectedSavedAddressId || isSubmitting}
                loading={isSubmitting}
              >
                Continue to Payment
              </Button>
            </div>
          )}
        </div>

        {/* Shipping method */}
        {shippingOptions.length > 0 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shipping Method
            </h2>

            <fieldset className="space-y-3">
              <legend className="sr-only">Select shipping method</legend>
              {shippingOptions.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center justify-between p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedShipping === method.id
                      ? 'border-yellow bg-yellow/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Radio
                      name="shipping"
                      value={method.id}
                      checked={selectedShipping === method.id}
                      onChange={() => handleShippingMethodChange(method.id)}
                    />
                    <div className="flex items-center gap-2 text-gray-600">
                      {method.id === 'express' || method.id === 'overnight' ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Truck className="w-5 h-5" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {method.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {method.price === 0 ? 'Free' : `${method.price.toFixed(2)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {method.estimatedDays}
                    </p>
                  </div>
                </label>
              ))}
            </fieldset>
          </div>
        )}
      </div>

      {/* Right column - Order summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg p-6 sticky top-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>

          <OrderSummary
            items={orderSummaryItems}
            summary={{
              subtotal: state.summary.subtotal,
              tax: state.summary.tax,
              shipping: state.summary.shipping,
              total: state.summary.subtotal + state.summary.shipping + state.summary.tax - state.discountAmount,
              currency: state.summary.currency,
            }}
            showShippingInfo={false}
            showPromoCode={true}
            onApplyPromoCode={handleApplyPromoCode}
            promoCodeError={promoCodeError || undefined}
            appliedPromoCode={state.discountCode || undefined}
            discountAmount={state.discountAmount || undefined}
          />
        </div>
      </div>
    </div>
  );
}
