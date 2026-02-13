import { ReactNode } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

/**
 * Auth layout component
 */
export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-yellow-dark" />
            <span className="text-lg font-semibold text-gray-900">
              Kids Petite
            </span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Kids Petite. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
