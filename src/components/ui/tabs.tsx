'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Tabs context type
 */
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

/**
 * Tabs component props
 */
export interface TabsProps {
  /**
   * Default active tab
   */
  defaultValue: string;
  /**
   * Controlled active tab
   */
  value?: string;
  /**
   * Callback when tab changes
   */
  onValueChange?: (value: string) => void;
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
 * Tabs list component props
 */
export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Tabs trigger component props
 */
export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Value of the tab
   */
  value: string;
}

/**
 * Tabs content component props
 */
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Value of the tab
   */
  value: string;
}

/**
 * Tabs navigation component
 * 
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 * ```
 */
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = React.useState(defaultValue);
  
  const activeTab = value !== undefined ? value : internalActiveTab;
  
  const setActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalActiveTab(tab);
    }
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('flex flex-col', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/**
 * Tabs list container
 */
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          // Base styles
          'flex items-center gap-1',
          'border-b border-gray-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsList.displayName = 'TabsList';

/**
 * Tabs trigger button
 */
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        onClick={() => setActiveTab(value)}
        className={cn(
          // Base styles
          'px-4 py-2 text-sm font-medium',
          'border-b-2 -mb-px',
          'transition-colors duration-200',
          // Inactive state
          'text-gray-500 border-transparent',
          'hover:text-gray-700 hover:border-gray-300',
          // Active state
          isActive && 'text-gray-900 border-yellow',
          // Focus state
          'focus:outline-none focus:ring-2 focus:ring-yellow focus:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

/**
 * Tabs content panel
 */
export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    const { activeTab } = context;
    const isActive = activeTab === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        aria-labelledby={`tab-${value}`}
        tabIndex={0}
        className={cn('pt-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';
