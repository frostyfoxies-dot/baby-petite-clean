import Link from 'next/link';
import { requireAuth } from '@/lib/session';
import { getWishlist } from '@/actions/wishlist';
import WishlistClient from './wishlist-client';

/**
 * Force dynamic rendering to avoid session errors during build
 */
export const dynamic = 'force-dynamic';

/**
 * Account wishlist page - Server Component
 * Fetches user's wishlist and passes to client component
 */
export default async function AccountWishlistPage() {
  // Require authentication
  await requireAuth();

  // Get user's wishlist
  const wishlistResult = await getWishlist();
  const wishlistItems = wishlistResult.success && wishlistResult.data ? wishlistResult.data.items : [];

  return <WishlistClient initialItems={wishlistItems} />;
}
