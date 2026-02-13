import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User interface representing an authenticated user
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  avatar?: string;
}

/**
 * User store interface with state, actions, and computed values
 */
interface UserStore {
  // State
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;

  // Computed
  getDisplayName: () => string;
  getInitials: () => string;
  isAdmin: () => boolean;
  isStaff: () => boolean;
}

/**
 * User store using Zustand with persistence
 * Manages user authentication state and user data
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,

      /**
       * Set the current user
       * Updates authentication state based on user presence
       */
      setUser: (user) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },

      /**
       * Update user properties
       * Merges updates with existing user data
       */
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      /**
       * Clear user data and set authentication to false
       */
      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      /**
       * Get the user's display name
       * @returns First and last name combined
       */
      getDisplayName: () => {
        const { user } = get();
        if (!user) return '';
        return `${user.firstName} ${user.lastName}`.trim();
      },

      /**
       * Get the user's initials
       * @returns First letter of first and last name
       */
      getInitials: () => {
        const { user } = get();
        if (!user) return '';
        const firstInitial = user.firstName.charAt(0).toUpperCase();
        const lastInitial = user.lastName.charAt(0).toUpperCase();
        return `${firstInitial}${lastInitial}`;
      },

      /**
       * Check if user has admin role
       * @returns True if user is an admin
       */
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'ADMIN';
      },

      /**
       * Check if user has staff or admin role
       * @returns True if user is staff or admin
       */
      isStaff: () => {
        const { user } = get();
        return user?.role === 'STAFF' || user?.role === 'ADMIN';
      },
    }),
    {
      name: 'kids-petite-user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
