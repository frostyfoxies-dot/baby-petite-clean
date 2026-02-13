'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Category item type
 */
export interface CategoryItem {
  /**
   * Category ID
   */
  id: string;
  /**
   * Category name
   */
  name: string;
  /**
   * Category slug
   */
  slug: string;
  /**
   * Category description
   */
  description?: string;
  /**
   * Category image URL
   */
  image?: string;
  /**
   * Subcategories
   */
  children?: CategoryItem[];
}

/**
 * Category menu component props
 */
export interface CategoryMenuProps {
  /**
   * Categories to display
   */
  categories: CategoryItem[];
  /**
   * Callback when category is clicked
   */
  onCategoryClick?: (category: CategoryItem) => void;
  /**
   * Menu trigger label
   * @default "Categories"
   */
  label?: string;
  /**
   * Menu layout style
   * @default "dropdown"
   */
  layout?: 'dropdown' | 'mega' | 'sidebar';
  /**
   * Number of columns for mega menu
   * @default 4
   */
  columns?: number;
  /**
   * Whether to show category images
   * @default false
   */
  showImages?: boolean;
  /**
   * Whether to show category descriptions
   * @default false
   */
  showDescriptions?: boolean;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Category dropdown menu
 * 
 * @example
 * ```tsx
 * <CategoryMenu
 *   categories={categories}
 *   layout="mega"
 *   columns={4}
 *   showImages
 *   onCategoryClick={(cat) => router.push(`/category/${cat.slug}`)}
 * />
 * ```
 */
export function CategoryMenu({
  categories,
  onCategoryClick,
  label = 'Categories',
  layout = 'dropdown',
  columns = 4,
  showImages = false,
  showDescriptions = false,
  className,
}: CategoryMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveCategory(null);
    }
  };

  const handleCategoryClick = (category: CategoryItem) => {
    onCategoryClick?.(category);
    setIsOpen(false);
    setActiveCategory(null);
  };

  const activeCategoryData = categories.find((cat) => cat.id === activeCategory);

  return (
    <div
      ref={menuRef}
      className={cn('relative', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'gap-1',
          isOpen && 'bg-gray-100'
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 z-50 bg-white border border-gray-200 shadow-lg',
            layout === 'dropdown' && 'w-64 rounded-lg py-2',
            layout === 'mega' && 'w-screen max-w-6xl rounded-lg p-6',
            layout === 'sidebar' && 'fixed inset-y-0 left-0 w-80 rounded-none'
          )}
          role="menu"
        >
          {layout === 'dropdown' && (
            <DropdownLayout
              categories={categories}
              onCategoryClick={handleCategoryClick}
              showImages={showImages}
            />
          )}

          {layout === 'mega' && (
            <MegaLayout
              categories={categories}
              activeCategory={activeCategory}
              activeCategoryData={activeCategoryData}
              onCategoryHover={setActiveCategory}
              onCategoryClick={handleCategoryClick}
              columns={columns}
              showImages={showImages}
              showDescriptions={showDescriptions}
            />
          )}

          {layout === 'sidebar' && (
            <SidebarLayout
              categories={categories}
              onCategoryClick={handleCategoryClick}
              showImages={showImages}
              showDescriptions={showDescriptions}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dropdown layout component
 */
function DropdownLayout({
  categories,
  onCategoryClick,
  showImages,
}: {
  categories: CategoryItem[];
  onCategoryClick: (category: CategoryItem) => void;
  showImages: boolean;
}) {
  return (
    <ul className="space-y-1">
      {categories.map((category) => (
        <li key={category.id}>
          {category.children && category.children.length > 0 ? (
            <details className="group">
              <summary className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer list-none">
                <span className="flex items-center gap-2">
                  {showImages && category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  )}
                  {category.name}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
              </summary>
              <ul className="pl-4 mt-1 space-y-1">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/category/${child.slug}`}
                      onClick={() => onCategoryClick(child)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      role="menuitem"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <Link
              href={`/category/${category.slug}`}
              onClick={() => onCategoryClick(category)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50"
              role="menuitem"
            >
              {showImages && category.image && (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-6 h-6 rounded object-cover"
                />
              )}
              {category.name}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Mega menu layout component
 */
function MegaLayout({
  categories,
  activeCategory,
  activeCategoryData,
  onCategoryHover,
  onCategoryClick,
  columns,
  showImages,
  showDescriptions,
}: {
  categories: CategoryItem[];
  activeCategory: string | null;
  activeCategoryData?: CategoryItem;
  onCategoryHover: (id: string | null) => void;
  onCategoryClick: (category: CategoryItem) => void;
  columns: number;
  showImages: boolean;
  showDescriptions: boolean;
}) {
  return (
    <div className="flex gap-6">
      {/* Main categories */}
      <div className="w-1/4 border-r border-gray-200 pr-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
          Categories
        </h3>
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category.id}>
              <button
                onMouseEnter={() => onCategoryHover(category.id)}
                onClick={() => onCategoryClick(category)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-left',
                  activeCategory === category.id
                    ? 'bg-yellow text-gray-900'
                    : 'hover:bg-gray-50'
                )}
              >
                <span className="flex items-center gap-2">
                  {showImages && category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  )}
                  {category.name}
                </span>
                {category.children && category.children.length > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Subcategories */}
      <div className="flex-1">
        {activeCategoryData?.children && activeCategoryData.children.length > 0 ? (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              {activeCategoryData.name}
            </h3>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns - 1}, 1fr)` }}
            >
              {activeCategoryData.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  onClick={() => onCategoryClick(child)}
                  className="group block p-3 rounded-lg hover:bg-gray-50"
                >
                  {showImages && child.image && (
                    <img
                      src={child.image}
                      alt={child.name}
                      className="w-full aspect-video object-cover rounded-md mb-2"
                    />
                  )}
                  <p className="font-medium text-gray-900 group-hover:text-yellow-dark">
                    {child.name}
                  </p>
                  {showDescriptions && child.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {child.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Hover over a category to see subcategories</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sidebar layout component
 */
function SidebarLayout({
  categories,
  onCategoryClick,
  showImages,
  showDescriptions,
}: {
  categories: CategoryItem[];
  onCategoryClick: (category: CategoryItem) => void;
  showImages: boolean;
  showDescriptions: boolean;
}) {
  return (
    <div className="h-full overflow-y-auto py-6 px-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/category/${category.slug}`}
              onClick={() => onCategoryClick(category)}
              className="block p-3 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {showImages && category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  {showDescriptions && category.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
            {category.children && category.children.length > 0 && (
              <ul className="ml-6 mt-2 space-y-1">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/category/${child.slug}`}
                      onClick={() => onCategoryClick(child)}
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
