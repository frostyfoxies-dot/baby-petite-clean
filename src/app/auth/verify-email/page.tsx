'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Email verification page component
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    setIsVerifying(true);
    // Simulate email verification
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsVerifying(false);
    setIsVerified(true);
  };

  const handleResendEmail = async () => {
    // Simulate resending email
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  if (isVerifying) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mail className="w-8 h-8 text-yellow-dark" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifying Your Email...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h1>
          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
          <Link href="/auth/signin">
            <Button fullWidth>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-yellow-dark" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Email
        </h1>
        <p className="text-gray-600">
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
          <p className="font-medium mb-1">Didn't receive the email?</p>
          <p className="text-xs">
            Check your spam folder or request a new verification link.
          </p>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleResendEmail}
        >
          Resend Verification Email
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already verified?{' '}
        <Link href="/auth/signin" className="text-yellow-dark hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
