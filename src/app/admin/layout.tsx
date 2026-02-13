import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/session';
import { Sidebar } from '@/components/admin/sidebar';
import { Menu, Bell, User } from 'lucide-react';
import Link from 'next/link';

/**
 * Admin layout component
 * 
 * Provides the admin interface structure with:
 * - Collapsible sidebar navigation
 * - Header with user info
 * - Responsive design
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Require admin role
  const user = await requireAdmin('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-10">
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page title - visible on mobile */}
          <h1 className="md:hidden text-lg font-semibold text-gray-900">
            Admin
          </h1>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button
              type="button"
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
              <Link
                href="/account"
                className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-900" />
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay - would need client component for interactivity */}
    </div>
  );
}
