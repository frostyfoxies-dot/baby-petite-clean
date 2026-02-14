'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Import,
  Users,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * Navigation item definition
 */
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

/**
 * Navigation items for the admin sidebar
 */
const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Import Products', href: '/admin/import', icon: Import },
  { name: 'Suppliers', href: '/admin/suppliers', icon: Users },
  { name: 'Fulfillment', href: '/admin/fulfillment', icon: Package, badge: 0 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

/**
 * Props for the Sidebar component
 */
export interface SidebarProps {
  /** Optional pending orders count for badge */
  pendingOrdersCount?: number;
}

/**
 * Sidebar Component
 * 
 * Navigation sidebar for the admin interface.
 * Collapsible on desktop, hidden on mobile with hamburger menu.
 * 
 * @example
 * ```tsx
 * <Sidebar pendingOrdersCount={5} />
 * ```
 */
export function Sidebar({ pendingOrdersCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Update badge count for fulfillment
  const navWithBadge = navigation.map(item => 
    item.name === 'Fulfillment' ? { ...item, badge: pendingOrdersCount } : item
  );

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo / Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Admin</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navWithBadge.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-yellow text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Baby Petite Admin v2.2
          </div>
        </div>
      )}
    </aside>
  );
}
