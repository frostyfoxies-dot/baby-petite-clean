/**
 * Category Schema
 *
 * Defines the structure for product categories in Sanity CMS.
 * Categories support hierarchical structure with parent/child relationships.
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'category',
  title: 'Category',
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
      name: 'hierarchy',
      title: 'Hierarchy',
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
      title: 'Category Name',
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
      description: 'Brief description of the category',
    }),
    
    // Media Group
    defineField({
      name: 'image',
      title: 'Category Image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: true,
        metadata: ['dimensions', 'lqip', 'palette'],
      },
    }),
    
    // Hierarchy Group
    defineField({
      name: 'parent',
      title: 'Parent Category',
      type: 'reference',
      group: 'hierarchy',
      to: [{ type: 'category' }],
      description: 'Select a parent category to create a hierarchy',
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
 * TypeScript type for Category document
 */
export interface CategoryDocument {
  _id: string;
  _type: 'category';
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
  parent?: {
    _id: string;
    name: string;
    slug: { current: string };
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: { asset: { _id: string; url: string } };
  };
  createdAt: string;
  updatedAt: string;
}
