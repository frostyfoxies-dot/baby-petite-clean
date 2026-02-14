'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

/**
 * Sign up page component
 */
export default function SignUpPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) return;

    setIsSubmitting(true);
    // Simulate sign up
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    router.push('/auth/verify-email');
  };

  const handleSocialSignUp = async (provider: string) => {
    console.log('Social sign up:', provider);
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Account
        </h1>
        <p className="text-gray-600">
          Join Baby Petite today
        </p>
      </div>

      {/* Social login */}
      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => handleSocialSignUp('google')}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => handleSocialSignUp('facebook')}
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

      {/* Sign up form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-2">
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              required
              leftIcon={<User className="w-4 h-4" />}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-2">
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              required
            />
          </div>
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>
        </div>

        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          checked={agreedToTerms}
          onChange={setAgreedToTerms}
        />

        <Button type="submit" fullWidth loading={isSubmitting} disabled={!agreedToTerms}>
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-yellow-dark hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
