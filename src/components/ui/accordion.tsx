'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

/**
 * Accordion context type
 */
interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

/**
 * Accordion component props
 */
export interface AccordionProps {
  /**
   * Type of accordion behavior
   * @default 'single'
   */
  type?: 'single' | 'multiple';
  /**
   * Default open items
   */
  defaultValue?: string | string[];
  /**
   * Controlled open items
   */
  value?: string | string[];
  /**
   * Callback when items change
   */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Children components
   */
  children: React.ReactNode;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Accordion item component props
 */
export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the accordion item
   */
  value: string;
}

/**
 * Accordion trigger component props
 */
export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

/**
 * Accordion content component props
 */
export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Collapsible accordion component
 * 
 * @example
 * ```tsx
 * <Accordion type="single" defaultValue="item1">
 *   <AccordionItem value="item1">
 *     <AccordionTrigger>Section 1</AccordionTrigger>
 *     <AccordionContent>Content for section 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item2">
 *     <AccordionTrigger>Section 2</AccordionTrigger>
 *     <AccordionContent>Content for section 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export function Accordion({
  type = 'single',
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [internalOpenItems, setInternalOpenItems] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const openItems = value !== undefined
    ? (Array.isArray(value) ? value : [value])
    : internalOpenItems;

  const toggleItem = (itemValue: string) => {
    let newOpenItems: string[];

    if (type === 'single') {
      newOpenItems = openItems.includes(itemValue) ? [] : [itemValue];
    } else {
      newOpenItems = openItems.includes(itemValue)
        ? openItems.filter((v) => v !== itemValue)
        : [...openItems, itemValue];
    }

    if (value === undefined) {
      setInternalOpenItems(newOpenItems);
    }
    onValueChange?.(type === 'single' ? newOpenItems[0] || '' : newOpenItems);
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('flex flex-col gap-2', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

/**
 * Accordion item container
 */
export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) throw new Error('AccordionItem must be used within Accordion');

    const isOpen = context.openItems.includes(value);

    return (
      <div
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'border border-gray-200 rounded-md overflow-hidden',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ value?: string; isOpen?: boolean }>, {
              value,
              isOpen,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';

/**
 * Accordion trigger button
 */
export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps & { value?: string; isOpen?: boolean }>(
  ({ className, children, value, isOpen, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    if (!context) throw new Error('AccordionTrigger must be used within Accordion');

    const handleClick = () => {
      if (value) {
        context.toggleItem(value);
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        onClick={handleClick}
        className={cn(
          // Base styles
          'flex items-center justify-between w-full',
          'px-4 py-3 text-sm font-medium text-left',
          'bg-white hover:bg-gray-50',
          'transition-colors duration-200',
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-inset',
          className
        )}
        {...props}
      >
        {children}
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

AccordionTrigger.displayName = 'AccordionTrigger';

/**
 * Accordion content panel
 */
export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps & { isOpen?: boolean }>(
  ({ className, children, isOpen, ...props }, ref) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'px-4 pb-3 pt-0 text-sm text-gray-600',
          'animate-accordion-down',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

AccordionContent.displayName = 'AccordionContent';
