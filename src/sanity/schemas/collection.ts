import { defineType, defineField, defineArrayMember } from 'sanity';
import { LayersIcon } from '@sanity/icons';

/**
 * Collection Schema
 * For grouping products into curated collections (e.g., "Summer Essentials", "New Arrivals")
 */
export const collection = defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  icon: LayersIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Collection Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Collection name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required().error('Slug is required'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'blockContent',
      description: 'Collection description with rich text support',
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'product' }],
          options: {
            filter: ({ document }) => ({
              filter: 'isActive == true',
            }),
          },
        }),
      ],
      description: 'Products included in this collection',
    }),
    defineField({
      name: 'image',
      title: 'Collection Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility',
        },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Only active collections are visible on the storefront',
      initialValue: true,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      description: 'Featured collections appear on the homepage',
      initialValue: false,
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When this collection should become visible (optional)',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When this collection should be hidden (optional)',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const startDate = (context.document as { startDate?: string })?.startDate;
          if (value && startDate && new Date(value) <= new Date(startDate)) {
            return 'End date must be after start date';
          }
          return true;
        }),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(1000),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Custom title for SEO. Falls back to collection name if empty.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      description: 'Meta description for search engines (recommended: 150-160 characters)',
      validation: (Rule) => Rule.max(160).warning('SEO descriptions should be under 160 characters'),
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
    {
      title: 'Recently Updated',
      name: 'updatedAtDesc',
      by: [{ field: '_updatedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'products',
      media: 'image',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      const productCount = Array.isArray(subtitle) ? subtitle.length : 0;
      return {
        title,
        subtitle: `${productCount} product${productCount !== 1 ? 's' : ''}`,
        media,
      };
    },
  },
});
