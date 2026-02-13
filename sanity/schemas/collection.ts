/**
 * Collection Schema
 *
 * Defines the structure for product collections in Sanity CMS.
 * Collections are curated groups of products (e.g., "Summer Sale", "New Arrivals").
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'collection',
  title: 'Collection',
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
    {
      name: 'seo',
      title: 'SEO',
    },
  ],
  fields: [
    // Content Group
    defineField({
      name: 'name',
      title: 'Collection Name',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().min(2).max(50),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'name',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
      rows: 3,
      description: 'Brief description of the collection',
    }),
    
    // Media Group
    defineField({
      name: 'image',
      title: 'Collection Image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: true,
        metadata: ['dimensions', 'lqip', 'palette'],
      },
    }),
    
    // Settings Group
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'Only active collections are displayed on the storefront',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      group: 'settings',
      description: 'When this collection should become active (optional)',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      group: 'settings',
      description: 'When this collection should expire (optional)',
    }),
    
    // SEO Group
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'title',
          title: 'Meta Title',
          type: 'string',
          description: 'Override the default page title for SEO',
        }),
        defineField({
          name: 'description',
          title: 'Meta Description',
          type: 'text',
          rows: 2,
          description: 'Override the default meta description',
        }),
        defineField({
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            layout: 'tags',
          },
        }),
        defineField({
          name: 'ogImage',
          title: 'Open Graph Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
    {
      title: 'Name Z-A',
      name: 'nameDesc',
      by: [{ field: 'name', direction: 'desc' }],
    },
    {
      title: 'Newest First',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description',
      media: 'image',
    },
  },
});

/**
 * TypeScript type for Collection document
 */
export interface CollectionDocument {
  _id: string;
  _type: 'collection';
  name: string;
  slug: { current: string };
  description?: string;
  image?: {
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
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: { asset: { _id: string; url: string } };
  };
  createdAt: string;
  updatedAt: string;
}
