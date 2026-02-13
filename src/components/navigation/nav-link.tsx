'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Navigation link component props
 */
export interface NavLinkProps extends Omit<React.ComponentProps<typeof Link>, 'href'> {
  /**
   * Link href
   */
  href: string;
  /**
   * Link label
   */
  children: React.ReactNode;
  /**
   * Whether to show active state
   * @default true
   */
  showActive?: boolean;
  /**
   * Custom active path (for partial matching)
   */
  activePath?: string;
  /**
   * Whether to show chevron for dropdown
   * @default false
   */
  showChevron?: boolean;
  /**
   * Whether the link is a dropdown trigger
   * @default false
   */
  isDropdown?: boolean;
  /**
   * Callback when dropdown is toggled
   */
  onDropdownToggle?: () => void;
  /**
   * Whether dropdown is open
   */
  dropdownOpen?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Navigation link with active state
 * 
 * @example
 * ```tsx
 * <NavLink href="/products" activePath="/products">
 *   Products
 * </NavLink>
 * 
 * <NavLink
 *   href="/categories"
 *   showChevron
 *   isDropdown
 *   dropdownOpen={isOpen}
 *   onDropdownToggle={() => setIsOpen(!isOpen)}
 * >
 *   Categories
 * </NavLink>
 * ```
 */
export function NavLink({
  href,
  children,
  showActive = true,
  activePath,
  showChevron = false,
  isDropdown = false,
  onDropdownToggle,
  dropdownOpen = false,
  className,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  
  // Determine if link is active
  const isActive = showActive && (
    pathname === href ||
    (activePath && pathname.startsWith(activePath)) ||
    (href !== '/' && pathname.startsWith(href))
  );

  const handleClick = (e: React.MouseEvent) => {
    if (isDropdown && onDropdownToggle) {
      e.preventDefault();
      onDropdownToggle();
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'relative flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors',
        'hover:text-gray-900',
        isActive
          ? 'text-gray-900'
          : 'text-gray-600',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
      {showChevron && (
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            dropdownOpen && 'rotate-180'
          )}
        />
      )}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow" />
      )}
    </Link>
  );
}
