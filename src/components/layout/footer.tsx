'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SecurityBadges } from '@/components/ui/security-badges';

/**
 * Footer link group type
 */
export interface FooterLinkGroup {
  /**
   * Group title
   */
  title: string;
  /**
   * Links in the group
   */
  links: Array<{
    label: string;
    href: string;
  }>;
}

/**
 * Social link type
 */
export interface SocialLink {
  /**
   * Platform name
   */
  platform: 'facebook' | 'instagram' | 'twitter' | 'email';
  /**
   * URL
   */
  href: string;
  /**
   * Label for accessibility
   */
  label: string;
}

/**
 * Footer component props
 */
export interface FooterProps {
  /**
   * Logo text or component
   */
  logo?: React.ReactNode;
  /**
   * Footer link groups
   */
  linkGroups?: FooterLinkGroup[];
  /**
   * Social media links
   */
  socialLinks?: SocialLink[];
  /**
   * Whether to show newsletter signup
   * @default true
   */
  showNewsletter?: boolean;
  /**
   * Callback when newsletter is submitted
   */
  onNewsletterSubmit?: (email: string) => void;
  /**
   * Copyright text
   */
  copyright?: string;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Site footer with links, newsletter signup, and social icons
 * 
 * @example
 * ```tsx
 * <Footer
 *   logo="Baby Petite"
 *   linkGroups={[
 *     {
 *       title: 'Shop',
 *       links: [
 *         { label: 'All Products', href: '/shop' },
 *         { label: 'New Arrivals', href: '/new' }
 *       ]
 *     }
 *   ]}
 *   socialLinks={[
 *     { platform: 'instagram', href: 'https://instagram.com', label: 'Instagram' }
 *   ]}
 * />
 * ```
 */
export function Footer({
  logo = 'Baby Petite',
  linkGroups = [],
  socialLinks = [],
  showNewsletter = true,
  onNewsletterSubmit,
  copyright = `© ${new Date().getFullYear()} Baby Petite. All rights reserved.`,
  className,
}: FooterProps) {
  const [email, setEmail] = React.useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && onNewsletterSubmit) {
      onNewsletterSubmit(email.trim());
      setEmail('');
    }
  };

  const socialIcons: Record<SocialLink['platform'], React.ReactNode> = {
    facebook: <Facebook className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
    email: <Mail className="w-5 h-5" />,
  };

  return (
    <footer
      className={cn(
        'bg-gray-50 border-t border-gray-200',
        className
      )}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="space-y-4">
            <span className="text-lg font-semibold text-gray-900">
              {logo}
            </span>
            <p className="text-sm text-gray-600">
              Adorable children's clothing for every occasion.
            </p>
            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={cn(
                      'p-2 rounded-md',
                      'text-gray-600 hover:text-gray-900',
                      'hover:bg-gray-200',
                      'transition-colors duration-200'
                    )}
                  >
                    {socialIcons[social.platform]}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link groups */}
          {linkGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'text-sm text-gray-600',
                        'hover:text-gray-900',
                        'transition-colors duration-200'
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          {showNewsletter && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Newsletter
              </h3>
              <p className="text-sm text-gray-600">
                Subscribe for exclusive offers and new arrivals.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" fullWidth size="sm">
                  Subscribe
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {copyright}
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                href="/shipping"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Shipping Info
              </Link>
            </div>
          </div>
          
          {/* Security badges */}
          <div className="mt-6 flex justify-center">
            <SecurityBadges 
              variant="minimal" 
              size="sm" 
              badges={['ssl', 'pci', 'norton', 'moneyback']}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
