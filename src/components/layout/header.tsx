'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, ShoppingBag, Menu, X, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchAutocomplete } from '@/components/search/search-autocomplete';

/**
 * Navigation link type
 */
export interface NavLink {
  /**
   * Display label
   */
  label: string;
  /**
   * URL path
   */
  href: string;
  /**
   * Whether the link is active
   */
  active?: boolean;
}

/**
 * Header component props
 */
export interface HeaderProps {
  /**
   * Logo text or component
   */
  logo?: React.ReactNode;
  /**
   * Navigation links
   */
  navLinks?: NavLink[];
  /**
   * Cart item count
   */
  cartCount?: number;
  /**
   * Whether user is logged in
   */
  isLoggedIn?: boolean;
  /**
   * User name or email
   */
  userName?: string;
  /**
   * Callback when search is submitted
   */
  onSearch?: (query: string) => void;
  /**
   * Callback when cart is clicked
   */
  onCartClick?: () => void;
  /**
   * Callback when user menu is clicked
   */
  onUserClick?: () => void;
  /**
   * Callback when wishlist is clicked
   */
  onWishlistClick?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Site header with logo, navigation, search, cart, and user menu
 * 
 * @example
 * ```tsx
 * <Header
 *   logo={<span className="font-bold">Baby Petite</span>}
 *   navLinks={[
 *     { label: 'Shop', href: '/shop' },
 *     { label: 'Categories', href: '/categories' },
 *     { label: 'Registry', href: '/registry' }
 *   ]}
 *   cartCount={3}
 *   isLoggedIn={true}
 *   userName="John"
 * />
 * ```
 */
export function Header({
  logo = 'Baby Petite',
  navLinks = [],
  cartCount = 0,
  isLoggedIn = false,
  userName,
  onSearch,
  onCartClick,
  onUserClick,
  onWishlistClick,
  className,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        'bg-white border-b border-gray-200',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-lg font-semibold text-gray-900">
              {logo}
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-200',
                  link.active
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search bar - desktop with autocomplete */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <SearchAutocomplete
              placeholder="Search products..."
              onSearch={handleSearch}
              inputClassName="h-9"
              minChars={2}
              maxSuggestions={8}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onWishlistClick}
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="relative"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge
                  variant="primary"
                  className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Button>

            {/* User */}
            {isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUserClick}
                aria-label="User account"
              >
                <User className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-gray-200 py-4">
            {/* Mobile search with autocomplete */}
            <div className="mb-4">
              <SearchAutocomplete
                placeholder="Search products..."
                onSearch={handleSearch}
                isMobile={true}
                minChars={2}
                maxSuggestions={6}
              />
            </div>

            {/* Mobile navigation */}
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md',
                    'transition-colors duration-200',
                    link.active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile user section */}
            {isLoggedIn && userName && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="px-3 text-sm text-gray-600">
                  Signed in as <span className="font-medium text-gray-900">{userName}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
