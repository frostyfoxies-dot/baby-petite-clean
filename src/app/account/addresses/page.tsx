import { requireAuth } from '@/lib/session';
import { getUserAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/actions/addresses';
import AddressesClient from './addresses-client';

/**
 * Account addresses page - Server Component
 * Fetches user addresses and passes to client component
 */
export default async function AccountAddressesPage() {
  // Require authentication
  await requireAuth();

  // Get user addresses
  const addressesResult = await getUserAddresses();
  const addresses = addressesResult.success ? addressesResult.data.addresses : [];

  return <AddressesClient initialAddresses={addresses} />;
}
