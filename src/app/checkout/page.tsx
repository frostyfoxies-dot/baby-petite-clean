import { redirect } from 'next/navigation';
import { getCart } from '@/actions/cart';
import { GuestCheckoutChoice } from '@/components/checkout/guest-checkout-choice';

/**
 * Checkout index page - validates cart and shows guest/sign-in choice
 * 
 * This page serves as the entry point for checkout, allowing users
 * to choose between guest checkout and signing in for member benefits.
 */
export default async function CheckoutPage() {
  // Load cart data to validate it's not empty
  const cartResult = await getCart();
  
  // If cart is empty or doesn't exist, redirect to cart page
  if (!cartResult.success || !cartResult.data || cartResult.data.items.length === 0) {
    redirect('/cart');
  }
  
  // Show guest/sign-in choice instead of redirecting
  // This improves UX by making guest checkout more visible
  return (
    <div className="min-h-screen bg-gray-50">
      <GuestCheckoutChoice />
    </div>
  );
}
