'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUserStore, type User } from '@/store/user-store';
import { useUIStore } from '@/store/ui-store';
import {
  signIn as signInAction,
  signUp as signUpAction,
  signOut as signOutAction,
  resetPassword as resetPasswordAction,
  type SignInInput,
  type SignUpInput,
} from '@/actions/auth';

/**
 * Authentication hook return type
 */
interface UseAuthReturn {
  /** Current authenticated user or null */
  user: User | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication state is being loaded */
  isLoading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Sign up with email, password, and name */
  signUp: (data: SignUpInput) => Promise<{ success: boolean; error?: string; userId?: string }>;
  /** Sign out the current user */
  signOut: () => Promise<{ success: boolean; error?: string }>;
  /** Request a password reset email */
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Hook for authentication state and actions
 *
 * Provides a unified interface for user authentication including sign in,
 * sign up, sign out, and password reset functionality. Integrates with
 * the user store for state management.
 *
 * @returns Authentication state and actions
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { signIn, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     const result = await signIn(email, password);
 *     if (result.success) {
 *       router.push('/account');
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       // form fields
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated, setUser, clearUser } = useUserStore();
  const { setIsLoading, addToast } = useUIStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data?.user) {
            setUser({
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              role: data.user.role || 'CUSTOMER',
              avatar: data.user.image,
            });
          } else {
            clearUser();
          }
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        clearUser();
      } finally {
        setIsInitialLoading(false);
      }
    };

    checkAuth();
  }, [setUser, clearUser]);

  /**
   * Sign in with email and password
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signInAction({ email, password });

      if (result.success) {
        // Fetch user data after successful sign in
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data?.user) {
            setUser({
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              role: data.user.role || 'CUSTOMER',
              avatar: data.user.image,
            });
          }
        }
        addToast({
          type: 'success',
          title: 'Welcome back!',
          message: 'You have successfully signed in.',
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, addToast]);

  /**
   * Sign up with email, password, and name
   */
  const signUp = useCallback(async (data: SignUpInput) => {
    setIsLoading(true);
    try {
      const result = await signUpAction(data);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Account created!',
          message: 'Please check your email to verify your account.',
          duration: 7000,
        });
      }

      return {
        success: result.success,
        error: result.error,
        userId: result.data?.userId,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, addToast]);

  /**
   * Sign out the current user
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await signOutAction();

      if (result.success) {
        clearUser();
        addToast({
          type: 'info',
          title: 'Signed out',
          message: 'You have been signed out successfully.',
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [clearUser, setIsLoading, addToast]);

  /**
   * Request a password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const result = await resetPasswordAction({ email });

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Email sent',
          message: 'If an account exists with that email, you will receive a password reset link.',
          duration: 7000,
        });
      }

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, addToast]);

  return {
    user,
    isAuthenticated,
    isLoading: isInitialLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}

export default useAuth;
