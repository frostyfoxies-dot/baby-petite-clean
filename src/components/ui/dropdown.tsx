'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Dropdown context type
 */
interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
}

const DropdownContext = React.createContext<DropdownContextType | null>(null);

/**
 * Dropdown component props
 */
export interface DropdownProps {
  /**
   * Children components
   */
  children: React.ReactNode;
  /**
   * Default selected item
   */
  defaultValue?: string;
  /**
   * Controlled selected item
   */
  value?: string;
  /**
   * Callback when selection changes
   */
  onValueChange?: (value: string) => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Dropdown trigger component props
 */
export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Placeholder text when no item is selected
   */
  placeholder?: string;
}

/**
 * Dropdown menu component props
 */
export interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alignment of the menu
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end';
  /**
   * Width of the menu
   * @default 'auto'
   */
  width?: 'auto' | 'full';
}

/**
 * Dropdown item component props
 */
export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Value of the item
   */
  value: string;
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
}

/**
 * Dropdown separator component props
 */
export interface DropdownSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Dropdown label component props
 */
export interface DropdownLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Dropdown menu component
 * 
 * @example
 * ```tsx
 * <Dropdown>
 *   <DropdownTrigger placeholder="Select option" />
 *   <DropdownMenu>
 *     <DropdownLabel>Options</DropdownLabel>
 *     <DropdownItem value="option1">Option 1</DropdownItem>
 *     <DropdownItem value="option2">Option 2</DropdownItem>
 *     <DropdownSeparator />
 *     <DropdownItem value="option3">Option 3</DropdownItem>
 *   </DropdownMenu>
 * </Dropdown>
 * ```
 */
export function Dropdown({
  children,
  defaultValue,
  value,
  onValueChange,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalSelectedItem, setSelectedItem] = React.useState<string | null>(defaultValue || null);
  
  const selectedItem = value !== undefined ? value : internalSelectedItem;
  
  const handleSetSelectedItem = (item: string | null) => {
    if (value === undefined) {
      setSelectedItem(item);
    }
    if (item && onValueChange) {
      onValueChange(item);
    }
  };

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, selectedItem, setSelectedItem: handleSetSelectedItem }}>
      <div className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

/**
 * Dropdown trigger button
 */
export const DropdownTrigger = React.forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ className, placeholder = 'Select...', children, ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    if (!context) throw new Error('DropdownTrigger must be used within Dropdown');

    const { isOpen, setIsOpen, selectedItem } = context;

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          // Base styles
          'inline-flex items-center justify-between gap-2 w-full',
          'px-3 py-2 text-sm',
          'bg-white border border-gray-200 rounded-md',
          'text-gray-900',
          'transition-colors duration-200',
          // Focus states
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:border-transparent',
          // Hover
          'hover:border-gray-300',
          className
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        {...props}
      >
        {children || selectedItem || placeholder}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
    );
  }
);

DropdownTrigger.displayName = 'DropdownTrigger';

/**
 * Dropdown menu container
 */
export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, align = 'start', width = 'auto', children, ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    if (!context) throw new Error('DropdownMenu must be used within Dropdown');

    const { isOpen, setIsOpen } = context;
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, setIsOpen]);

    // Close on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, setIsOpen]);

    if (!isOpen) return null;

    const alignStyles = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    };

    return (
      <div
        ref={(node) => {
          // Handle both refs
          (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        role="listbox"
        className={cn(
          // Base styles
          'absolute top-full mt-1 z-50',
          'bg-white border border-gray-200 rounded-md shadow-lg',
          'py-1',
          // Animation
          'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150',
          // Alignment
          alignStyles[align],
          // Width
          width === 'full' ? 'w-full' : 'min-w-[180px]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

/**
 * Dropdown item button
 */
export const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const context = React.useContext(DropdownContext);
    if (!context) throw new Error('DropdownItem must be used within Dropdown');

    const { selectedItem, setSelectedItem, setIsOpen } = context;
    const isSelected = selectedItem === value;

    const handleClick = () => {
      if (!disabled) {
        setSelectedItem(value);
        setIsOpen(false);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          // Base styles
          'w-full px-3 py-2 text-sm text-left',
          'transition-colors duration-150',
          // States
          'hover:bg-gray-50',
          'focus:outline-none focus:bg-gray-50',
          // Selected
          isSelected && 'bg-yellow/10 text-gray-900',
          // Disabled
          disabled && 'text-gray-400 cursor-not-allowed hover:bg-transparent',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

/**
 * Dropdown separator
 */
export function DropdownSeparator({ className, ...props }: DropdownSeparatorProps) {
  return (
    <div
      className={cn('h-px bg-gray-200 my-1', className)}
      {...props}
    />
  );
}

/**
 * Dropdown label
 */
export function DropdownLabel({ className, children, ...props }: DropdownLabelProps) {
  return (
    <div
      className={cn('px-3 py-1.5 text-xs font-medium text-gray-500', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const DropdownContent = DropdownMenu;
