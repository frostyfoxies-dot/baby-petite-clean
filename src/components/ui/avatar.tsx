'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

/**
 * Avatar size types
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Avatar component props
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Image source URL
   */
  src?: string | null;
  /**
   * Alt text for the image
   */
  alt?: string;
  /**
   * Fallback text (initials)
   */
  fallback?: string;
  /**
   * Size of the avatar
   * @default 'md'
   */
  size?: AvatarSize;
  /**
   * Whether the avatar is clickable
   * @default false
   */
  clickable?: boolean;
  /**
   * Callback when avatar is clicked
   */
  onClick?: () => void;
}

/**
 * Avatar group component props
 */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum number of avatars to show
   * @default 5
   */
  max?: number;
  /**
   * Children avatar components
   */
  children: React.ReactNode;
}

/**
 * User avatar component with fallback
 * 
 * @example
 * ```tsx
 * <Avatar src="/avatar.jpg" alt="John Doe" />
 * <Avatar fallback="JD" />
 * <Avatar fallback="AB" size="lg" />
 * ```
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      src,
      alt = '',
      fallback,
      size = 'md',
      clickable = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const sizeStyles: Record<AvatarSize, string> = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg',
    };

    const handleImageError = () => {
      setImageError(true);
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    const getInitials = (text: string): string => {
      return text
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const displayFallback = fallback || getInitials(alt);

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'rounded-full bg-gray-100 text-gray-600 font-medium',
          'overflow-hidden',
          // Size
          sizeStyles[size],
          // Clickable
          clickable && 'cursor-pointer hover:ring-2 hover:ring-yellow hover:ring-offset-2',
          // Transition
          'transition-all duration-200',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {src && !imageError ? (
          <>
            <img
              src={src}
              alt={alt}
              className={cn(
                'absolute inset-0 w-full h-full object-cover',
                !imageLoaded && 'opacity-0'
              )}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {!imageLoaded && (
              <User className={cn('w-1/2 h-1/2 text-gray-400')} />
            )}
          </>
        ) : (
          <span className="select-none">{displayFallback}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Avatar group for displaying multiple avatars
 * 
 * @example
 * ```tsx
 * <AvatarGroup max={3}>
 *   <Avatar src="/avatar1.jpg" alt="User 1" />
 *   <Avatar src="/avatar2.jpg" alt="User 2" />
 *   <Avatar src="/avatar3.jpg" alt="User 3" />
 *   <Avatar src="/avatar4.jpg" alt="User 4" />
 *   <Avatar src="/avatar5.jpg" alt="User 5" />
 * </AvatarGroup>
 * ```
 */
export function AvatarGroup({ className, max = 5, children, ...props }: AvatarGroupProps) {
  const avatars = React.Children.toArray(children).filter(
    (child): child is React.ReactElement => React.isValidElement(child)
  );

  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = Math.max(0, avatars.length - max);

  return (
    <div className={cn('flex items-center', className)} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'relative',
            index > 0 && '-ml-2',
            'ring-2 ring-white'
          )}
        >
          {avatar}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative -ml-2',
            'flex items-center justify-center',
            'w-10 h-10 rounded-full',
            'bg-gray-100 text-gray-600 text-sm font-medium',
            'ring-2 ring-white'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

AvatarGroup.displayName = 'AvatarGroup';
