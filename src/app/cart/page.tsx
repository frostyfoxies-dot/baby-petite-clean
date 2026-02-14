import { getCart } from '@/actions/cart';
import { CartContent } from '@/components/cart/cart-content';

/**
 * Force dynamic rendering - cart requires cookies/session access
 */
export const dynamic = 'force-dynamic';

/**
 * Cart page component
 * Server component that fetches cart data and passes it to the client component
 */
export default async function CartPage() {
  const result = await getCart();
  
  // Default empty state
  const initialCart = result.success && result.data ? result.data : {
    id: '',
    items: [],
    itemCount: 0,
    subtotal: 0,
  };

  return <CartContent initialCart={initialCart} />;
}
