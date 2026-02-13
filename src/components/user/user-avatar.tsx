'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';
import { Avatar as BaseAvatar } from '@/components/ui/avatar';

/**
 * User avatar component props
 */
export interface UserAvatarProps {
  /**
   * Avatar image URL
   */
  src?: string | null;
  /**
   * User name for fallback
   */
  name?: string;
  /**
   * Avatar size
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether the avatar is clickable
   * @default false
   */
  clickable?: boolean;
  /**
   * Callback when avatar is clicked
   */
  onClick?: () => void;
  /**
   * Whether to show edit overlay on hover
   * @default false
   */
  showEditOverlay?: boolean;
  /**
   * Callback when edit is clicked
   */
  onEdit?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * User avatar with initials fallback
 * 
 * @example
 * ```tsx
 * <UserAvatar
 *   name="John Doe"
 *   src="/avatar.jpg"
 *   size="lg"
 *   clickable
 *   onClick={() => router.push('/account/profile')}
 * />
 * ```
 */
export function UserAvatar({
  src,
  name,
  size = 'md',
  clickable = false,
  onClick,
  showEditOverlay = false,
  onEdit,
  className,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (text: string): string => {
    return text
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayFallback = name ? getInitials(name) : 'U';

  const sizeStyles = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-lg',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={!clickable}
        className={cn(
          'relative',
          clickable && 'cursor-pointer',
          !clickable && 'cursor-default'
        )}
      >
        <BaseAvatar
          src={imageError ? null : src}
          fallback={displayFallback}
          size={size}
          clickable={clickable}
        />
      </button>

      {/* Edit overlay */}
      {showEditOverlay && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/50 rounded-full opacity-0 hover:opacity-100',
            'transition-opacity duration-200',
            'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
          )}
          aria-label="Change avatar"
        >
          <Camera className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
