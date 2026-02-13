'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Forgot password page component
 */
export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setEmailSent(true);
  };

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-yellow-dark" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot Password?
        </h1>
        <p className="text-gray-600">
          {emailSent
            ? 'Check your email for a reset link'
            : 'Enter your email to receive a password reset link'}
        </p>
      </div>

      {!emailSent ? (
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

          <Button type="submit" fullWidth loading={isSubmitting}>
            Send Reset Link
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            We've sent a password reset link to your email address.
          </p>
          <Button
            variant="outline"
            fullWidth
            onClick={() => setEmailSent(false)}
          >
            Try Another Email
          </Button>
        </div>
      )}

      <div className="mt-6">
        <Link href="/auth/signin" className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
