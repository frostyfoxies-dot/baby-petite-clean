/**
 * Page Content Schema
 *
 * Defines the structure for custom page content in Sanity CMS.
 * Used for creating custom pages with flexible content blocks.
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pageContent',
  title: 'Page Content',
  type: 'document',
  groups: [
    {
      name: 'content',
      title: 'Content',
      default: true,
    },
    {
      name: 'seo',
      title: 'SEO',
    },
  ],
  fields: [
    // Content Group
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      group: 'content',
      of: [
        { type: 'block' },
        {
          type: 'imageBlock',
          title: 'Image Block',
        },
        {
          type: 'productGrid',
          title: 'Product Grid',
        },
        {
          type: 'heroBlock',
          title: 'Hero Block',
        },
        {
          type: 'textBlock',
          title: 'Text Block',
        },
      ],
      description: 'Add content blocks to build your page',
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
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
    },
  },
});

/**
 * Image Block - Reusable image component
 */
export const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Image Block',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['lqip', 'palette'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alternative Text',
      type: 'string',
      description: 'Describe the image for accessibility',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'caption',
      media: 'image',
    },
  },
});

/**
 * Product Grid - Display a grid of products
 */
export const productGrid = defineType({
  name: 'productGrid',
  title: 'Product Grid',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      options: {
        list: [
          { title: '2 Columns', value: 2 },
          { title: '3 Columns', value: 3 },
          { title: '4 Columns', value: 4 },
        ],
      },
      initialValue: 4,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Product Grid',
        subtitle: 'Product grid section',
      };
    },
  },
});

/**
 * Hero Block - Full-width hero section
 */
export const heroBlock = defineType({
  name: 'heroBlock',
  title: 'Hero Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Background Image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['lqip', 'palette'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    }),
    defineField({
      name: 'buttonLink',
      title: 'Button Link',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
  },
});

/**
 * Text Block - Rich text section
 */
export const textBlock = defineType({
  name: 'textBlock',
  title: 'Text Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'alignment',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
      },
      initialValue: 'left',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({ title }) {
      return {
        title: title || 'Text Block',
        subtitle: 'Rich text section',
      };
    },
  },
});

/**
 * TypeScript type for Page Content document
 */
export interface PageContentDocument {
  _id: string;
  _type: 'pageContent';
  title: string;
  slug: { current: string };
  content?: Array<{
    _type: string;
    _key: string;
    // Block content
    children?: Array<{ text: string }>;
    // Image block
    image?: { asset: { _id: string; url: string } };
    alt?: string;
    caption?: string;
    // Product grid
    title?: string;
    products?: Array<{ _id: string; name: string }>;
    columns?: number;
    // Hero block
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    // Text block
    alignment?: 'left' | 'center' | 'right';
  }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: { asset: { _id: string; url: string } };
  };
  createdAt: string;
  updatedAt: string;
}
