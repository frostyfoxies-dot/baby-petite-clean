'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Container size types
 */
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Container component props
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the container
   * @default 'lg'
   */
  size?: ContainerSize;
  /**
   * Whether to center the content
   * @default true
   */
  centered?: boolean;
  /**
   * Whether to add horizontal padding
   * @default true
   */
  padded?: boolean;
}

/**
 * Responsive container wrapper
 * 
 * @example
 * ```tsx
 * <Container>
 *   <h1>Page Title</h1>
 *   <p>Page content goes here</p>
 * </Container>
 * 
 * <Container size="sm">
 *   <p>Narrower content</p>
 * </Container>
 * 
 * <Container size="full" padded={false}>
 *   <p>Full width content</p>
 * </Container>
 * ```
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      size = 'lg',
      centered = true,
      padded = true,
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<ContainerSize, string> = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'w-full',
          // Centering
          centered && 'mx-auto',
          // Size
          sizeStyles[size],
          // Padding
          padded && 'px-4 sm:px-6 lg:px-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

/**
 * Section component for page sections
 */
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Size of the section container
   * @default 'lg'
   */
  size?: ContainerSize;
  /**
   * Vertical padding
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Background color
   * @default 'white'
   */
  background?: 'white' | 'gray' | 'off-white';
}

/**
 * Page section wrapper with consistent spacing
 * 
 * @example
 * ```tsx
 * <Section>
 *   <h2>Section Title</h2>
 *   <p>Section content</p>
 * </Section>
 * 
 * <Section background="gray" padding="lg">
 *   <h2>Featured Section</h2>
 * </Section>
 * ```
 */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      className,
      size = 'lg',
      padding = 'md',
      background = 'white',
      children,
      ...props
    },
    ref
  ) => {
    const paddingStyles: Record<NonNullable<SectionProps['padding']>, string> = {
      none: 'py-0',
      sm: 'py-6',
      md: 'py-8',
      lg: 'py-12',
      xl: 'py-16',
    };

    const backgroundStyles: Record<NonNullable<SectionProps['background']>, string> = {
      white: 'bg-white',
      gray: 'bg-gray-50',
      'off-white': 'bg-[#FAFAFA]',
    };

    return (
      <section
        ref={ref}
        className={cn(
          // Background
          backgroundStyles[background],
          // Padding
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        <Container size={size}>
          {children}
        </Container>
      </section>
    );
  }
);

Section.displayName = 'Section';
