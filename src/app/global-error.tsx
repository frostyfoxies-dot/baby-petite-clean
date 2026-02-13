'use client';

import * as React from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle } from 'lucide-react';

/**
 * Global error boundary component for handling errors in the root layout
 * This is a special error boundary that wraps the entire app
 * Reports errors to Sentry for monitoring and debugging
 */
export default function GlobalError({
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
        component: 'GlobalErrorBoundary',
      },
      level: 'fatal',
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="mb-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Critical Error
                </h1>
                <p className="text-gray-600 mb-2">
                  A critical error has occurred. Our team has been notified.
                </p>
                <p className="text-sm text-gray-500">
                  Error ID: {error.digest}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={reset}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-yellow-dark text-white font-medium rounded-md hover:bg-yellow transition-colors"
                >
                  Try Again
                </button>

                <a
                  href="/"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Go to Homepage
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact our support team.
                </p>
                <a
                  href="mailto:support@kidspetite.com"
                  className="text-sm text-yellow-dark hover:underline mt-2 inline-block"
                >
                  support@kidspetite.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}