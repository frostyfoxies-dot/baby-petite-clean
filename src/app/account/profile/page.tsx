import { requireAuth } from '@/lib/session';
import { getUserProfile } from '@/actions/user';
import ProfileClient from './profile-client';

/**
 * Account profile page - Server Component
 * Fetches user profile data and passes to client component
 */
export default async function AccountProfilePage() {
  // Require authentication
  const user = await requireAuth();

  // Get user profile
  const profileResult = await getUserProfile();
  
  if (!profileResult.success || !profileResult.data) {
    // Return a minimal profile with the session user data
    return (
      <ProfileClient
        profile={{
          id: user.id,
          email: user.email,
          firstName: null,
          lastName: null,
          phone: null,
          avatar: null,
          emailVerified: user.emailVerified,
          createdAt: new Date(),
        }}
      />
    );
  }

  return <ProfileClient profile={profileResult.data} />;
}
