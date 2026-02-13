'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Lock, CreditCard, RotateCcw, CheckCircle } from 'lucide-react';

/**
 * Security badge type
 */
export type SecurityBadgeType = 'ssl' | 'pci' | 'norton' | 'moneyback';

/**
 * Security badge size
 */
export type SecurityBadgeSize = 'sm' | 'md' | 'lg';

/**
 * Security badges variant
 */
export type SecurityBadgesVariant = 'full' | 'compact' | 'minimal';

/**
 * Individual security badge props
 */
export interface SecurityBadgeProps {
  /**
   * Type of security badge
   */
  type: SecurityBadgeType;
  /**
   * Size of the badge
   * @default 'md'
   */
  size?: SecurityBadgeSize;
  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Security badges container props
 */
export interface SecurityBadgesProps {
  /**
   * Variant of the badges container
   * @default 'full'
   */
  variant?: SecurityBadgesVariant;
  /**
   * Size of the badges
   * @default 'md'
   */
  size?: SecurityBadgeSize;
  /**
   * Whether to show labels
   * @default true
   */
  showLabels?: boolean;
  /**
   * Layout direction
   * @default 'horizontal'
   */
  layout?: 'horizontal' | 'vertical';
  /**
   * Badge types to show
   * @default ['ssl', 'pci', 'norton', 'moneyback']
   */
  badges?: SecurityBadgeType[];
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Badge configuration
 * Defined outside component to prevent recreation on each render
 * Icons are component references, not JSX elements
 */
const BADGE_CONFIG: Record<SecurityBadgeType, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}> = {
  ssl: {
    icon: Lock,
    label: 'SSL Secured',
    description: 'Your connection is encrypted and secure',
  },
  pci: {
    icon: CreditCard,
    label: 'PCI Compliant',
    description: 'We meet the highest security standards for payment processing',
  },
  norton: {
    icon: Shield,
    label: 'Norton Secured',
    description: 'Your purchase is protected by Norton Security',
  },
  moneyback: {
    icon: RotateCcw,
    label: 'Money-Back Guarantee',
    description: '30-day money-back guarantee on all purchases',
  },
};

/**
 * Size classes for badges
 * Defined outside component to prevent recreation on each render
 */
const SIZE_CLASSES: Record<SecurityBadgeSize, {
  container: string;
  icon: string;
  label: string;
}> = {
  sm: {
    container: 'gap-1.5 px-2 py-1',
    icon: 'w-4 h-4',
    label: 'text-xs',
  },
  md: {
    container: 'gap-2 px-3 py-2',
    icon: 'w-5 h-5',
    label: 'text-sm',
  },
  lg: {
    container: 'gap-2.5 px-4 py-2.5',
    icon: 'w-6 h-6',
    label: 'text-base',
  },
};

/**
 * Tooltip component for badge hover
 * Memoized to prevent unnecessary re-renders
 */
const BadgeTooltip = React.memo(function BadgeTooltip({ 
  children, 
  content 
}: { 
  children: React.ReactNode; 
  content: string;
}) {
  const [isVisible, setIsVisible] = React.useState(false);

  // Memoize event handlers
  const handleMouseEnter = React.useCallback(() => setIsVisible(true), []);
  const handleMouseLeave = React.useCallback(() => setIsVisible(false), []);
  const handleFocus = React.useCallback(() => setIsVisible(true), []);
  const handleBlur = React.useCallback(() => setIsVisible(false), []);

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'px-3 py-2 rounded-md',
            'bg-gray-900 text-white text-xs',
            'shadow-lg whitespace-nowrap',
            // Use GPU-accelerated animations
            'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150',
            'transform-gpu'
          )}
          role="tooltip"
        >
          {content}
          <div 
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2',
              'border-4 border-transparent border-t-gray-900'
            )} 
          />
        </div>
      )}
    </div>
  );
});

/**
 * Individual security badge component
 * Memoized to prevent unnecessary re-renders
 * 
 * @example
 * ```tsx
 * <SecurityBadge type="ssl" size="md" />
 * ```
 */
const SecurityBadge = React.memo(function SecurityBadge({
  type,
  size = 'md',
  showLabel = true,
  className,
}: SecurityBadgeProps) {
  const config = BADGE_CONFIG[type];
  const sizeClass = SIZE_CLASSES[size];
  const Icon = config.icon;

  // Memoize aria-label
  const ariaLabel = React.useMemo(
    () => `${config.label}: ${config.description}`,
    [config.label, config.description]
  );

  return (
    <BadgeTooltip content={config.description}>
      <div
        className={cn(
          'inline-flex items-center rounded-md',
          'bg-gray-50 border border-gray-200',
          'transition-colors hover:bg-gray-100',
          'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
          sizeClass.container,
          className
        )}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
        aria-describedby="tooltip-content"
      >
        <div className={cn('text-green-600', sizeClass.icon)}>
          <Icon className="w-full h-full" aria-hidden="true" />
        </div>
        {showLabel && (
          <span className={cn('font-medium text-gray-700', sizeClass.label)}>
            {config.label}
          </span>
        )}
      </div>
    </BadgeTooltip>
  );
});

/**
 * SSL Badge component
 */
const SSLBadge = React.memo(function SSLBadge(props: Omit<SecurityBadgeProps, 'type'>) {
  return <SecurityBadge {...props} type="ssl" />;
});

/**
 * PCI Badge component
 */
const PCIBadge = React.memo(function PCIBadge(props: Omit<SecurityBadgeProps, 'type'>) {
  return <SecurityBadge {...props} type="pci" />;
});

/**
 * Norton Secured Badge component
 */
const NortonBadge = React.memo(function NortonBadge(props: Omit<SecurityBadgeProps, 'type'>) {
  return <SecurityBadge {...props} type="norton" />;
});

/**
 * Money-Back Guarantee Badge component
 */
const MoneyBackBadge = React.memo(function MoneyBackBadge(props: Omit<SecurityBadgeProps, 'type'>) {
  return <SecurityBadge {...props} type="moneyback" />;
});

/**
 * Compact badge icon component
 * Used in compact variant to render just the icon
 */
const CompactBadgeIcon = React.memo(function CompactBadgeIcon({
  type,
  size,
}: {
  type: SecurityBadgeType;
  size: SecurityBadgeSize;
}) {
  const config = BADGE_CONFIG[type];
  const sizeClass = SIZE_CLASSES[size];
  const Icon = config.icon;

  return (
    <BadgeTooltip content={config.description}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-md',
          'bg-gray-50 border border-gray-200',
          'transition-colors hover:bg-gray-100',
          'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
          sizeClass.icon
        )}
        tabIndex={0}
        role="img"
        aria-label={`${config.label}: ${config.description}`}
      >
        <div className="text-green-600 w-3/4 h-3/4">
          <Icon className="w-full h-full" aria-hidden="true" />
        </div>
      </div>
    </BadgeTooltip>
  );
});

/**
 * Security badges container component
 * Displays a group of security badges for trust signals
 * 
 * Performance optimizations:
 * - React.memo on all components
 * - Memoized callbacks and computed values
 * - Static configuration objects defined outside components
 * - Efficient list rendering with stable keys
 * 
 * @example
 * ```tsx
 * <SecurityBadges variant="full" size="md" />
 * ```
 */
const SecurityBadges = React.memo(function SecurityBadges({
  variant = 'full',
  size = 'md',
  showLabels = true,
  layout = 'horizontal',
  badges = ['ssl', 'pci', 'norton', 'moneyback'],
  className,
}: SecurityBadgesProps) {
  const sizeClass = SIZE_CLASSES[size];

  // Compact variant - smaller badges with icons only
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2',
          className
        )}
        role="group"
        aria-label="Security badges"
      >
        {badges.map((type) => (
          <CompactBadgeIcon key={type} type={type} size={size} />
        ))}
      </div>
    );
  }

  // Minimal variant - just icons with a single label
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-3',
          className
        )}
        role="group"
        aria-label="Security badges"
      >
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {badges.map((type) => {
            const Icon = BADGE_CONFIG[type].icon;
            return (
              <div
                key={type}
                className={cn('text-green-600', sizeClass.icon)}
              >
                <Icon className="w-full h-full" aria-hidden="true" />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
          <span className={cn('text-gray-600', sizeClass.label)}>
            Secure Checkout
          </span>
        </div>
      </div>
    );
  }

  // Full variant - complete badges with icons and labels
  return (
    <div
      className={cn(
        'flex flex-wrap',
        layout === 'vertical' ? 'flex-col gap-2' : 'items-center gap-3',
        className
      )}
      role="group"
      aria-label="Security badges"
    >
      {badges.map((type) => (
        <SecurityBadge
          key={type}
          type={type}
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  );
});

/**
 * Payment security badges - optimized for checkout pages
 */
const PaymentSecurityBadges = React.memo(function PaymentSecurityBadges({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Lock className="w-4 h-4 text-green-600" />
        <span>Your payment is secured with 256-bit SSL encryption</span>
      </div>
      <SecurityBadges
        variant="compact"
        size="sm"
        badges={['ssl', 'pci', 'norton']}
      />
    </div>
  );
});

export { 
  SecurityBadge, 
  SecurityBadges, 
  SSLBadge, 
  PCIBadge, 
  NortonBadge, 
  MoneyBackBadge,
  PaymentSecurityBadges,
  BADGE_CONFIG,
  SIZE_CLASSES 
};
export default SecurityBadges;
export type { SecurityBadgeType, SecurityBadgeSize, SecurityBadgesVariant, SecurityBadgeProps, SecurityBadgesProps };
