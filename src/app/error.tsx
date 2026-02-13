'use client';

import * as React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

/**
 * Error boundary component for handling errors in the app
 * Reports errors to Sentry for monitoring and debugging
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report error to Sentry
  React.useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        errorDigest: error.digest,
        component: 'ErrorBoundary',
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-gray-600 mb-2">
            We're sorry, but an unexpected error occurred.
          </p>
          <p className="text-sm text-gray-500">
            Error ID: {error.digest}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={reset}
            fullWidth
            size="lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </Button>

          <Link href="/">
            <Button variant="outline" fullWidth size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Still having trouble?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@kidspetite.com"
              className="text-sm text-yellow-dark hover:underline"
            >
              Contact Support
            </a>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <Link
              href="/faq"
              className="text-sm text-yellow-dark hover:underline"
            >
              Visit FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}