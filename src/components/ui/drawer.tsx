'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/**
 * Drawer position types
 */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * Drawer component props
 */
export interface DrawerProps {
  /**
   * Whether the drawer is open
   * @default false
   */
  isOpen: boolean;
  /**
   * Callback when drawer is closed
   */
  onClose: () => void;
  /**
   * Children components
   */
  children: React.ReactNode;
  /**
   * Position of the drawer
   * @default 'right'
   */
  position?: DrawerPosition;
  /**
   * Width of the drawer (for left/right position)
   * @default 'md'
   */
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * Height of the drawer (for top/bottom position)
   * @default 'md'
   */
  height?: 'sm' | 'md' | 'lg' | 'full';
  /**
   * Whether clicking backdrop closes the drawer
   * @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * Whether pressing Escape closes the drawer
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Title for the drawer header
   */
  title?: string;
}

/**
 * Drawer header component props
 */
export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Drawer content component props
 */
export interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Drawer footer component props
 */
export interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Slide-out drawer component for cart, filters, etc.
 * 
 * @example
 * ```tsx
 * <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Shopping Cart">
 *   <DrawerContent>
 *     <p>Cart items go here</p>
 *   </DrawerContent>
 *   <DrawerFooter>
 *     <Button>Checkout</Button>
 *   </DrawerFooter>
 * </Drawer>
 * ```
 */
export function Drawer({
  isOpen,
  onClose,
  children,
  position = 'right',
  width = 'md',
  height = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  title,
}: DrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus trap
  React.useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    drawerRef.current?.focus();

    return () => {
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const widthStyles = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96',
    xl: 'w-[32rem]',
    full: 'w-full',
  };

  const heightStyles = {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-96',
    full: 'h-full',
  };

  const positionStyles = {
    left: {
      container: 'left-0 top-0 bottom-0',
      drawer: 'motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-300',
      width: widthStyles[width],
    },
    right: {
      container: 'right-0 top-0 bottom-0',
      drawer: 'motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-300',
      width: widthStyles[width],
    },
    top: {
      container: 'top-0 left-0 right-0',
      drawer: 'motion-safe:animate-in motion-safe:slide-in-from-top motion-safe:duration-300',
      height: heightStyles[height],
    },
    bottom: {
      container: 'bottom-0 left-0 right-0',
      drawer: 'motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300',
      height: heightStyles[height],
    },
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          // Base styles
          'fixed bg-white shadow-xl',
          // Position
          positionStyles[position].container,
          // Animation
          positionStyles[position].drawer,
          // Width/Height
          positionStyles[position].width,
          positionStyles[position].height
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className={cn(
                'p-1 rounded-sm',
                'text-gray-400 hover:text-gray-600',
                'hover:bg-gray-100',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
              )}
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Drawer header section
 */
export function DrawerHeader({ className, children, ...props }: DrawerHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 px-4 py-3 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Drawer content section
 */
export function DrawerContent({ className, children, ...props }: DrawerContentProps) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto p-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Drawer footer section
 */
export function DrawerFooter({ className, children, ...props }: DrawerFooterProps) {
  return (
    <div
      className={cn('flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50', className)}
      {...props}
    >
      {children}
    </div>
  );
}
