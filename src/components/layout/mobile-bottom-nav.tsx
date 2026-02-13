'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cart-store';

/**
 * Navigation item configuration
 */
interface NavItem {
  /**
   * Display label
   */
  label: string;
  /**
   * URL path
   */
  href: string;
  /**
   * Icon component
   */
  icon: React.ComponentType<{ className?: string }>;
  /**
   * Whether to show badge count
   */
  showBadge?: boolean;
}

/**
 * Default navigation items
 * Defined outside component to prevent recreation on each render
 */
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Cart',
    href: '/cart',
    icon: ShoppingCart,
    showBadge: true,
  },
  {
    label: 'Account',
    href: '/account',
    icon: User,
  },
];

/**
 * Props for MobileBottomNav component
 */
export interface MobileBottomNavProps {
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Custom navigation items (overrides defaults)
   */
  items?: NavItem[];
}

/**
 * Props for MobileNavItem component
 */
export interface MobileNavItemProps {
  /**
   * Navigation item data
   */
  item: NavItem;
  /**
   * Whether this item is active
   */
  isActive: boolean;
  /**
   * Badge count (for cart)
   */
  badgeCount?: number;
}

/**
 * Individual mobile navigation item
 * Memoized to prevent unnecessary re-renders
 * 
 * @example
 * ```tsx
 * <MobileNavItem
 *   item={{ label: 'Home', href: '/', icon: Home }}
 *   isActive={true}
 * />
 * ```
 */
const MobileNavItem = React.memo(function MobileNavItem({
  item,
  isActive,
  badgeCount = 0,
}: MobileNavItemProps) {
  const Icon = item.icon;
  const showBadge = item.showBadge && badgeCount > 0;
  
  // Memoize aria-label to prevent string recreation
  const ariaLabel = React.useMemo(
    () => (item.label === 'Cart' && showBadge ? `${item.label}, ${badgeCount} items` : item.label),
    [item.label, showBadge, badgeCount]
  );

  // Memoize badge display text
  const badgeText = React.useMemo(
    () => (badgeCount > 99 ? '99+' : badgeCount),
    [badgeCount]
  );
  
  return (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center',
        'min-w-[44px] min-h-[44px] px-3 py-1',
        'rounded-lg',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        // Use CSS transforms for GPU-accelerated transitions
        'transition-colors duration-150',
        isActive
          ? 'text-primary-600'
          : 'text-gray-600 hover:text-gray-900'
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-label={ariaLabel}
    >
      <div className="relative">
        <Icon className="w-6 h-6" aria-hidden="true" />
        {showBadge && (
          <span
            className={cn(
              'absolute -top-2 -right-2',
              'flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1',
              'text-xs font-medium text-white',
              'bg-primary-600 rounded-full',
              // Use GPU-accelerated animations
              'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in motion-safe:duration-200',
              // Use transform for GPU acceleration
              'transform-gpu'
            )}
            aria-hidden="true"
          >
            {badgeText}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium mt-0.5">
        {item.label}
      </span>
    </Link>
  );
});

/**
 * MobileBottomNav component
 * 
 * A fixed bottom navigation bar for mobile devices.
 * Shows below the md breakpoint and includes:
 * - Home, Search, Cart, Account navigation
 * - Cart item count badge
 * - Active state highlighting
 * - 44x44px minimum touch targets
 * - iOS safe area inset support
 * 
 * Performance optimizations:
 * - React.memo to prevent unnecessary re-renders
 * - Memoized callbacks and computed values
 * - CSS transforms for GPU-accelerated animations
 * - Optimized selector usage with Zustand
 * - Stable item keys for list rendering
 * 
 * @example
 * ```tsx
 * <MobileBottomNav />
 * ```
 */
const MobileBottomNav = React.memo(function MobileBottomNav({
  className,
  items = NAV_ITEMS,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  
  // Use optimized selector - only subscribe to the specific data we need
  // This prevents re-renders when other parts of the cart store change
  const cartCount = useCartStore(
    React.useCallback((state) => state.getTotalItems(), [])
  );
  
  // Memoize the isActive function to prevent recreation
  const getIsActive = React.useCallback(
    (href: string): boolean => {
      if (href === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(href);
    },
    [pathname]
  );

  // Memoize the items with their active state to prevent recalculation
  const navItemsWithState = React.useMemo(
    () => items.map((item) => ({
      item,
      isActive: getIsActive(item.href),
    })),
    [items, getIsActive]
  );
  
  return (
    <nav
      className={cn(
        // Fixed positioning at bottom
        'fixed bottom-0 left-0 right-0 z-50',
        // Hide on desktop (md breakpoint and up)
        'md:hidden',
        // Background and border
        'bg-white border-t border-gray-200',
        // Safe area inset for iOS devices
        'pb-[env(safe-area-inset-bottom)]',
        // Use GPU-accelerated properties
        'transform-gpu',
        className
      )}
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around h-14">
        {navItemsWithState.map(({ item, isActive }) => (
          <li key={item.href}>
            <MobileNavItem
              item={item}
              isActive={isActive}
              badgeCount={item.showBadge ? cartCount : 0}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
});

/**
 * Wrapper component that adds bottom padding to prevent content
 * from being hidden behind the mobile bottom nav.
 * 
 * Use this on pages that don't have their own bottom padding.
 * 
 * @example
 * ```tsx
 * <MobileBottomNavSpacer>
 *   <YourPageContent />
 * </MobileBottomNavSpacer>
 * ```
 */
const MobileBottomNavSpacer = React.memo(function MobileBottomNavSpacer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('pb-16 md:pb-0', className)}>
      {children}
    </div>
  );
});

export { MobileBottomNav, MobileBottomNavSpacer, MobileNavItem };
export default MobileBottomNav;
export type { NavItem, MobileBottomNavProps, MobileNavItemProps };
