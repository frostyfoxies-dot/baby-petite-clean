/**
 * Banner Schema
 *
 * Defines the structure for hero banners and promotional content in Sanity CMS.
 * Banners are used for homepage hero sections and promotional displays.
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  groups: [
    {
      name: 'content',
      title: 'Content',
      default: true,
    },
    {
      name: 'media',
      title: 'Media',
    },
    {
      name: 'settings',
      title: 'Settings',
    },
  ],
  fields: [
    // Content Group
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'content',
      description: 'Optional subtitle displayed below the title',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
      rows: 2,
      description: 'Optional description text',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url',
      group: 'content',
      description: 'URL to navigate to when banner is clicked',
    }),
    defineField({
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
      group: 'content',
      description: 'Text for the call-to-action button',
    }),
    defineField({
      name: 'buttonStyle',
      title: 'Button Style',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'Outline', value: 'outline' },
          { title: 'Ghost', value: 'ghost' },
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
    
    // Media Group
    defineField({
      name: 'image',
      title: 'Desktop Image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: true,
        metadata: ['dimensions', 'lqip', 'palette'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile Image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: true,
        metadata: ['dimensions', 'lqip', 'palette'],
      },
      description: 'Optional separate image for mobile devices',
    }),
    
    // Settings Group
    defineField({
      name: 'alignment',
      title: 'Content Alignment',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'overlay',
      title: 'Overlay',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'Add a dark overlay for better text readability',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'Only active banners are displayed',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      group: 'settings',
      description: 'When this banner should become active',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      group: 'settings',
      description: 'When this banner should expire',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      group: 'settings',
      initialValue: 0,
      description: 'Higher priority banners appear first',
    }),
  ],
  orderings: [
    {
      title: 'Priority (High to Low)',
      name: 'priorityDesc',
      by: [{ field: 'priority', direction: 'desc' }],
    },
    {
      title: 'Newest First',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'image',
    },
  },
});

/**
 * TypeScript type for Banner document
 */
export interface BannerDocument {
  _id: string;
  _type: 'banner';
  title: string;
  subtitle?: string;
  description?: string;
  image: {
    asset: {
      _id: string;
      url: string;
      metadata?: {
        dimensions?: { width: number; height: number };
        lqip?: string;
        palette?: Record<string, unknown>;
      };
    };
  };
  mobileImage?: {
    asset: {
      _id: string;
      url: string;
      metadata?: {
        dimensions?: { width: number; height: number };
        lqip?: string;
        palette?: Record<string, unknown>;
      };
    };
  };
  link?: string;
  buttonText?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline' | 'ghost';
  alignment?: 'left' | 'center' | 'right';
  overlay?: boolean;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}
