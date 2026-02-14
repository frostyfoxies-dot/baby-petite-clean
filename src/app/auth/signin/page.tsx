'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';

/**
 * Sign in page component
 */
export default function SignInPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate sign in
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    router.push('/account');
  };

  const handleSocialSignIn = async (provider: string) => {
    console.log('Social sign in:', provider);
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-600">
          Sign in to your account
        </p>
      </div>

      {/* Social login */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => handleSocialSignIn('google')}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => handleSocialSignIn('facebook')}
        >
          Continue with Facebook
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            or continue with email
          </span>
        </div>
      </div>

      {/* Sign in form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
            Email
          </label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-sm text-yellow-dark hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 text-yellow border-gray-300 rounded focus:ring-yellow"
          />
          <span className="text-sm text-gray-700">
            Remember me
          </span>
        </label>

        <Button type="submit" fullWidth loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-yellow-dark hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </div>
  );
}
