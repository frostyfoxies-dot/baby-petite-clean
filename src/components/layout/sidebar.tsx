'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

/**
 * Sidebar section type
 */
export interface SidebarSection {
  /**
   * Section title
   */
  title: string;
  /**
   * Section type
   */
  type: 'links' | 'checkboxes' | 'range';
  /**
   * Links (for 'links' type)
   */
  links?: Array<{
    label: string;
    href: string;
    count?: number;
    active?: boolean;
  }>;
  /**
   * Checkbox options (for 'checkboxes' type)
   */
  checkboxes?: Array<{
    label: string;
    value: string;
    checked: boolean;
    count?: number;
  }>;
  /**
   * Range config (for 'range' type)
   */
  range?: {
    min: number;
    max: number;
    value: [number, number];
    formatValue?: (value: number) => string;
  };
  /**
   * Callback when checkbox changes
   */
  onCheckboxChange?: (value: string, checked: boolean) => void;
  /**
   * Callback when range changes
   */
  onRangeChange?: (value: [number, number]) => void;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  /**
   * Sidebar title
   */
  title?: string;
  /**
   * Sidebar sections
   */
  sections: SidebarSection[];
  /**
   * Whether the sidebar is collapsible
   * @default false
   */
  collapsible?: boolean;
  /**
   * Whether the sidebar is open
   * @default true
   */
  isOpen?: boolean;
  /**
   * Callback when sidebar is toggled
   */
  onToggle?: () => void;
  /**
   * Callback when clear filters is clicked
   */
  onClearFilters?: () => void;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Sidebar for filters, categories, and navigation
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   title="Filters"
 *   sections={[
 *     {
 *       title: 'Categories',
 *       type: 'links',
 *       links: [
 *         { label: 'Dresses', href: '/dresses', count: 24 },
 *         { label: 'Tops', href: '/tops', count: 18 }
 *       ]
 *     },
 *     {
 *       title: 'Price',
 *       type: 'range',
 *       range: { min: 0, max: 100, value: [0, 50] }
 *     }
 *   ]}
 * />
 * ```
 */
export function Sidebar({
  title,
  sections,
  collapsible = false,
  isOpen = true,
  onToggle,
  onClearFilters,
  className,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(sections.map((s) => s.title))
  );

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const isExpanded = (sectionTitle: string) => expandedSections.has(sectionTitle);

  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200',
        'flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        {title && (
          <h2 className="text-sm font-semibold text-gray-900">
            {title}
          </h2>
        )}
        <div className="flex items-center gap-2">
          {onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={cn(
                  'flex items-center justify-between w-full',
                  'text-sm font-medium text-gray-900',
                  'hover:text-gray-700',
                  'transition-colors duration-200'
                )}
              >
                {section.title}
                {isExpanded(section.title) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Section content */}
              {isExpanded(section.title) && (
                <div className="space-y-2">
                  {section.type === 'links' && section.links && (
                    <ul className="space-y-1">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              'flex items-center justify-between',
                              'text-sm py-1.5 px-2 rounded-md',
                              'transition-colors duration-200',
                              link.active
                                ? 'bg-yellow/10 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <span>{link.label}</span>
                            {link.count !== undefined && (
                              <span className="text-xs text-gray-400">
                                {link.count}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.type === 'checkboxes' && section.checkboxes && (
                    <div className="space-y-2">
                      {section.checkboxes.map((checkbox) => (
                        <Checkbox
                          key={checkbox.value}
                          label={checkbox.label}
                          checked={checkbox.checked}
                          onChange={(checked) =>
                            section.onCheckboxChange?.(checkbox.value, checked)
                          }
                        >
                          {checkbox.count !== undefined && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({checkbox.count})
                            </span>
                          )}
                        </Checkbox>
                      ))}
                    </div>
                  )}

                  {section.type === 'range' && section.range && (
                    <div className="space-y-3">
                      <Slider
                        min={section.range.min}
                        max={section.range.max}
                        value={section.range.value[1]}
                        onChange={(value) =>
                          section.onRangeChange?.([section.range!.min, value])
                        }
                        formatValue={section.range.formatValue}
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {section.range.formatValue
                            ? section.range.formatValue(section.range.min)
                            : section.range.min}
                        </span>
                        <span>
                          {section.range.formatValue
                            ? section.range.formatValue(section.range.value[1])
                            : section.range.value[1]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
