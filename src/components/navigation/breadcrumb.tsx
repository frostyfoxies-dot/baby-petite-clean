'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb item type
 */
export interface BreadcrumbItem {
  /**
   * Item label
   */
  label: string;
  /**
   * Item href (optional for current page)
   */
  href?: string;
  /**
   * Item icon
   */
  icon?: React.ReactNode;
}

/**
 * Breadcrumb component props
 */
export interface BreadcrumbProps {
  /**
   * Breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * Whether to show home icon
   * @default true
   */
  showHome?: boolean;
  /**
   * Home link href
   * @default "/"
   */
  homeHref?: string;
  /**
   * Maximum items to show before truncating
   */
  maxItems?: number;
  /**
   * Separator component
   */
  separator?: React.ReactNode;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Breadcrumb navigation
 * 
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Clothing', href: '/products/clothing' },
 *     { label: 'Baby Onesies' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  showHome = true,
  homeHref = '/',
  maxItems,
  separator = <ChevronRight className="w-4 h-4" />,
  className,
}: BreadcrumbProps) {
  // Handle truncation
  const shouldTruncate = maxItems && items.length > maxItems;
  const visibleItems = shouldTruncate
    ? [items[0], ...items.slice(-(maxItems - 1))]
    : items;
  const hiddenItems = shouldTruncate
    ? items.slice(1, -(maxItems - 1))
    : [];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm text-gray-500', className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {/* Home link */}
        {showHome && (
          <>
            <li>
              <Link
                href={homeHref}
                className="hover:text-gray-900 transition-colors"
                aria-label="Home"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
            <li className="flex items-center" aria-hidden="true">
              {separator}
            </li>
          </>
        )}

        {/* Breadcrumb items */}
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isHiddenGroup = shouldTruncate && index === 1;

          return (
            <React.Fragment key={index}>
              {/* Hidden items dropdown */}
              {isHiddenGroup && hiddenItems.length > 0 && (
                <>
                  <li className="group relative">
                    <button
                      className="px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label={`Show ${hiddenItems.length} more items`}
                    >
                      •••
                    </button>
                    <ul className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      {hiddenItems.map((hiddenItem, hiddenIndex) => (
                        <li key={hiddenIndex}>
                          {hiddenItem.href ? (
                            <Link
                              href={hiddenItem.href}
                              className="block px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                            >
                              {hiddenItem.label}
                            </Link>
                          ) : (
                            <span className="block px-3 py-1.5 text-gray-500">
                              {hiddenItem.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="flex items-center" aria-hidden="true">
                    {separator}
                  </li>
                </>
              )}

              {/* Regular item */}
              {!isHiddenGroup && (
                <>
                  <li>
                    {item.href && !isLast ? (
                      <Link
                        href={item.href}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          isLast ? 'text-gray-900 font-medium' : ''
                        )}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {item.icon}
                        {item.label}
                      </span>
                    )}
                  </li>
                  {!isLast && (
                    <li className="flex items-center" aria-hidden="true">
                      {separator}
                    </li>
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
