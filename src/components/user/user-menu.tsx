'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { User, Settings, LogOut, Heart, Package, MapPin, CreditCard } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

/**
 * User menu item type
 */
export interface UserMenuItem {
  /**
   * Item ID
   */
  id: string;
  /**
   * Item label
   */
  label: string;
  /**
   * Item href
   */
  href?: string;
  /**
   * Item icon
   */
  icon?: React.ReactNode;
  /**
   * Callback when clicked
   */
  onClick?: () => void;
  /**
   * Whether the item is destructive
   */
  destructive?: boolean;
}

/**
 * User menu component props
 */
export interface UserMenuProps {
  /**
   * User name
   */
  userName?: string;
  /**
   * User email
   */
  userEmail?: string;
  /**
   * User avatar URL
   */
  avatarUrl?: string;
  /**
   * Menu items
   */
  items?: UserMenuItem[];
  /**
   * Callback when sign out is clicked
   */
  onSignOut?: () => void;
  /**
   * Whether the menu is open
   */
  isOpen?: boolean;
  /**
   * Callback when menu is toggled
   */
  onToggle?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * User dropdown menu
 * 
 * @example
 * ```tsx
 * <UserMenu
 *   userName="John Doe"
 *   userEmail="john@example.com"
 *   avatarUrl="/avatar.jpg"
 *   items={[
 *     { id: 'profile', label: 'Profile', href: '/account/profile', icon: <User /> },
 *     { id: 'orders', label: 'Orders', href: '/account/orders', icon: <Package /> }
 *   ]}
 *   onSignOut={() => signOut()}
 * />
 * ```
 */
export function UserMenu({
  userName,
  userEmail,
  avatarUrl,
  items,
  onSignOut,
  isOpen = false,
  onToggle,
  className,
}: UserMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggle?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const defaultItems: UserMenuItem[] = [
    { id: 'profile', label: 'Profile', href: '/account/profile', icon: <User className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', href: '/account/orders', icon: <Package className="w-4 h-4" /> },
    { id: 'addresses', label: 'Addresses', href: '/account/addresses', icon: <MapPin className="w-4 h-4" /> },
    { id: 'wishlist', label: 'Wishlist', href: '/account/wishlist', icon: <Heart className="w-4 h-4" /> },
    { id: 'payment', label: 'Payment Methods', href: '/account/payment', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', href: '/account/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const menuItems = items || defaultItems;

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 p-1.5 rounded-md',
          'hover:bg-gray-100',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar
          src={avatarUrl}
          fallback={userName || userEmail || 'U'}
          size="sm"
        />
        {userName && (
          <span className="text-sm font-medium text-gray-900 hidden sm:block">
            {userName}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {userName || 'User'}
            </p>
            {userEmail && (
              <p className="text-xs text-gray-500 mt-0.5">
                {userEmail}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-sm',
                      'hover:bg-gray-50',
                      'transition-colors duration-200',
                      item.destructive && 'text-red-600 hover:bg-red-50'
                    )}
                  >
                    {item.icon && (
                      <span className="text-gray-400">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      item.onClick?.();
                      onToggle?.();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
                      'hover:bg-gray-50',
                      'transition-colors duration-200',
                      item.destructive && 'text-red-600 hover:bg-red-50'
                    )}
                  >
                    {item.icon && (
                      <span className="text-gray-400">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Sign out */}
          {onSignOut && (
            <>
              <Separator />
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onToggle?.();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm text-left',
                    'text-red-600 hover:bg-red-50',
                    'transition-colors duration-200'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
