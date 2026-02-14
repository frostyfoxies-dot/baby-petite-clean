'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Single breadcrumb item
 */
export interface BreadcrumbItem {
  /**
   * Display label for the breadcrumb
   */
  label: string;
  /**
   * URL path (optional for current page)
   */
  href?: string;
}

/**
 * Props for the Breadcrumbs component
 */
export interface BreadcrumbsProps {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * Whether to show the home icon
   * @default true
   */
  showHome?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Props for BreadcrumbsServer component (for server-side rendering)
 */
export interface BreadcrumbsServerProps extends BreadcrumbsProps {
  /**
   * The full URL for generating absolute schema URLs
   */
  baseUrl?: string;
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD structured data
 * Pure function - optimized for performance
 * 
 * @param items - Breadcrumb items
 * @param showHome - Whether home is included
 * @param baseUrl - Base URL for the site
 * @returns JSON-LD script content
 */
function generateBreadcrumbSchema(
  items: BreadcrumbItem[],
  showHome: boolean,
  baseUrl: string
): object {
  // Pre-allocate array with known size for better performance
  const totalItems = showHome ? items.length + 1 : items.length;
  const schemaItems: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }> = new Array(totalItems);
  
  let position = 0;
  
  if (showHome) {
    schemaItems[position] = {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    };
    position++;
  }
  
  // Add each breadcrumb item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemPosition = showHome ? i + 2 : i + 1;
    
    const schemaItem: {
      '@type': 'ListItem';
      position: number;
      name: string;
      item?: string;
    } = {
      '@type': 'ListItem',
      position: itemPosition,
      name: item.label,
    };
    
    // Only include item property if href exists (not for current page)
    if (item.href) {
      schemaItem.item = item.href.startsWith('http') 
        ? item.href 
        : `${baseUrl}${item.href}`;
    }
    
    schemaItems[position] = schemaItem;
    position++;
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems,
  };
}

/**
 * Individual breadcrumb item component
 * Memoized to prevent unnecessary re-renders
 */
const BreadcrumbLink = React.memo(function BreadcrumbLink({
  item,
  isLast,
  isHome,
}: {
  item: BreadcrumbItem;
  isLast: boolean;
  isHome: boolean;
}) {
  // Memoize classes
  const linkClasses = React.useMemo(
    () =>
      cn(
        'flex items-center gap-1 hover:text-gray-900 transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded',
        isHome && 'text-gray-600'
      ),
    [isHome]
  );

  const textClasses = React.useMemo(
    () =>
      cn(
        'flex items-center gap-1',
        isLast ? 'text-gray-900 font-medium' : '',
        isHome && !isLast && 'text-gray-600'
      ),
    [isLast, isHome]
  );

  if (item.href && !isLast) {
    return (
      <Link
        href={item.href}
        className={linkClasses}
        aria-current={isLast ? 'page' : undefined}
      >
        {isHome && <Home className="w-4 h-4" aria-hidden="true" />}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <span
      className={textClasses}
      aria-current={isLast ? 'page' : undefined}
    >
      {isHome && <Home className="w-4 h-4" aria-hidden="true" />}
      <span>{item.label}</span>
    </span>
  );
});

/**
 * Breadcrumbs component with Schema.org structured data
 * 
 * Displays a navigation breadcrumb trail with proper semantic markup
 * and JSON-LD structured data for SEO.
 * 
 * Performance optimizations:
 * - React.memo on all components
 * - Memoized schema generation
 * - Pre-allocated arrays for known sizes
 * - Efficient list rendering with stable keys
 * - Memoized class computations
 * 
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Baby Clothes', href: '/category/baby' },
 *     { label: 'Cute Onesie' } // Current page, no href
 *   ]}
 * />
 * ```
 */
const Breadcrumbs = React.memo(function Breadcrumbs({
  items,
  showHome = true,
  className,
}: BreadcrumbsProps) {
  // Memoize base URL
  const baseUrl = React.useMemo(
    () => process.env.NEXT_PUBLIC_SITE_URL || 'https://babypetite.com',
    []
  );
  
  // Generate Schema.org JSON-LD - memoized
  const schema = React.useMemo(
    () => generateBreadcrumbSchema(items, showHome, baseUrl),
    [items, showHome, baseUrl]
  );
  
  // Combine home with items for display - memoized
  const displayItems = React.useMemo(
    () => (showHome ? [{ label: 'Home', href: '/' }, ...items] : items),
    [items, showHome]
  );

  // Memoize JSON string to prevent recalculation
  const schemaJson = React.useMemo(
    () => JSON.stringify(schema),
    [schema]
  );
  
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      
      {/* Visible Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className={cn('flex items-center text-sm text-gray-500', className)}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isHome = showHome && index === 0;
            
            return (
              <li key={`${item.label}-${index}`} className="flex items-center">
                {/* Separator (except for first item) */}
                {index > 0 && (
                  <ChevronRight
                    className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                
                <BreadcrumbLink
                  item={item}
                  isLast={isLast}
                  isHome={isHome}
                />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
});

/**
 * Server-side Breadcrumbs component
 * 
 * Use this in Server Components when you need to control the base URL
 * 
 * @example
 * ```tsx
 * <BreadcrumbsServer
 *   baseUrl="https://babypetite.com"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Current Item' }
 *   ]}
 * />
 * ```
 */
const BreadcrumbsServer = React.memo(function BreadcrumbsServer({
  items,
  showHome = true,
  baseUrl,
  className,
}: BreadcrumbsServerProps) {
  const siteUrl = React.useMemo(
    () => baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://babypetite.com',
    [baseUrl]
  );
  
  // Generate Schema.org JSON-LD - memoized
  const schema = React.useMemo(
    () => generateBreadcrumbSchema(items, showHome, siteUrl),
    [items, showHome, siteUrl]
  );
  
  // Combine home with items for display - memoized
  const displayItems = React.useMemo(
    () => (showHome ? [{ label: 'Home', href: '/' }, ...items] : items),
    [items, showHome]
  );

  // Memoize JSON string
  const schemaJson = React.useMemo(
    () => JSON.stringify(schema),
    [schema]
  );
  
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaJson }}
      />
      
      {/* Visible Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className={cn('flex items-center text-sm text-gray-500', className)}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isHome = showHome && index === 0;
            
            return (
              <li key={`${item.label}-${index}`} className="flex items-center">
                {/* Separator (except for first item) */}
                {index > 0 && (
                  <ChevronRight
                    className="w-4 h-4 mx-1 text-gray-400 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                
                <BreadcrumbLink
                  item={item}
                  isLast={isLast}
                  isHome={isHome}
                />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
});

export { Breadcrumbs, BreadcrumbsServer, generateBreadcrumbSchema };
export default Breadcrumbs;
export type { BreadcrumbItem, BreadcrumbsProps, BreadcrumbsServerProps };
