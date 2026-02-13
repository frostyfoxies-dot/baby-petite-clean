'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/**
 * Dialog context type
 */
interface DialogContextType {
  isOpen: boolean;
  onClose: () => void;
}

const DialogContext = React.createContext<DialogContextType | null>(null);

/**
 * Dialog component props
 */
export interface DialogProps {
  /**
   * Whether the dialog is open
   * @default false
   */
  isOpen: boolean;
  /**
   * Callback when dialog is closed
   */
  onClose: () => void;
  /**
   * Children components
   */
  children: React.ReactNode;
  /**
   * Whether clicking backdrop closes the dialog
   * @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * Whether pressing Escape closes the dialog
   * @default true
   */
  closeOnEscape?: boolean;
}

/**
 * Dialog header component props
 */
export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Dialog title component props
 */
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * Dialog description component props
 */
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Dialog content component props
 */
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width of the dialog
   * @default 'md'
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Dialog footer component props
 */
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Modal dialog component with backdrop
 * 
 * @example
 * ```tsx
 * <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description</DialogDescription>
 *     </DialogHeader>
 *     <p>Dialog content goes here</p>
 *     <DialogFooter>
 *       <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export function Dialog({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
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

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the dialog
    dialogRef.current?.focus();

    return () => {
      // Restore focus when dialog closes
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Prevent body scroll when dialog is open
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

  if (!isOpen) return null;

  return (
    <DialogContext.Provider value={{ isOpen, onClose }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Dialog */}
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full"
        >
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
}

/**
 * Dialog header section
 */
export function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Dialog title heading
 */
export function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  return (
    <h2
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * Dialog description text
 */
export function DialogDescription({ className, children, ...props }: DialogDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-gray-500', className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Dialog content wrapper
 */
export function DialogContent({
  className,
  maxWidth = 'md',
  children,
  ...props
}: DialogContentProps) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within Dialog');

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        // Base styles
        'bg-white border border-gray-200 rounded-lg shadow-xl',
        // Animation
        'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200',
        // Max width
        maxWidthStyles[maxWidth],
        className
      )}
      {...props}
    >
      {/* Close button */}
      <button
        onClick={context.onClose}
        className={cn(
          'absolute top-4 right-4 p-1 rounded-sm',
          'text-gray-400 hover:text-gray-600',
          'hover:bg-gray-100',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2'
        )}
        aria-label="Close dialog"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Dialog footer section
 */
export function DialogFooter({ className, children, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 pt-4 mt-4 border-t border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
}
