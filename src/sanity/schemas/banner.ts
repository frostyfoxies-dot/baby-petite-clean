import { defineType, defineField } from 'sanity';
import { PresentationIcon } from '@sanity/icons';

/**
 * Banner/Hero Schema
 * For promotional banners and hero sections across the site
 */
export const banner = defineType({
  name: 'banner',
  title: 'Banner',
  type: 'document',
  icon: PresentationIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().error('Banner title is required'),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Optional subtitle or tagline',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Additional description text',
    }),
    defineField({
      name: 'image',
      title: 'Banner Image',
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
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required().error('Banner image is required'),
    }),
    defineField({
      name: 'mobileImage',
      title: 'Mobile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
      description: 'Optional separate image for mobile devices',
    }),
    defineField({
      name: 'linkUrl',
      title: 'Link URL',
      type: 'string',
      description: 'URL to navigate to when banner is clicked',
    }),
    defineField({
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
      description: 'Text for the call-to-action button (e.g., "Shop Now")',
    }),
    defineField({
      name: 'position',
      title: 'Position',
      type: 'string',
      options: {
        list: [
          { title: 'Homepage Hero', value: 'home' },
          { title: 'Category Pages', value: 'category' },
          { title: 'Product Pages', value: 'product' },
          { title: 'Cart Page', value: 'cart' },
          { title: 'Site-wide Top Banner', value: 'sitewide' },
        ],
        layout: 'radio',
      },
      initialValue: 'home',
      validation: (Rule) => Rule.required(),
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
        layout: 'radio',
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'overlay',
      title: 'Overlay',
      type: 'boolean',
      description: 'Add a dark overlay to improve text readability',
      initialValue: true,
    }),
    defineField({
      name: 'overlayOpacity',
      title: 'Overlay Opacity',
      type: 'number',
      description: 'Opacity of the overlay (0-100)',
      initialValue: 30,
      validation: (Rule) => Rule.min(0).max(100),
      hidden: ({ parent }) => !parent?.overlay,
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Hex color code for background (optional, used if no image)',
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/).warning('Should be a valid hex color code'),
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      type: 'string',
      description: 'Hex color code for text (optional)',
      validation: (Rule) =>
        Rule.regex(/^#[0-9A-Fa-f]{6}$/).warning('Should be a valid hex color code'),
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'When this banner should become visible',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
      description: 'When this banner should be hidden',
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
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Only active banners are displayed',
      initialValue: true,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower numbers appear first',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(1000),
    }),
  ],
  orderings: [
    {
      title: 'Sort Order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
    {
      title: 'Position',
      name: 'positionAsc',
      by: [{ field: 'position', direction: 'asc' }, { field: 'sortOrder', direction: 'asc' }],
    },
    {
      title: 'Recently Updated',
      name: 'updatedAtDesc',
      by: [{ field: '_updatedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'position',
      media: 'image',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      const positionLabels: Record<string, string> = {
        home: 'Homepage Hero',
        category: 'Category Pages',
        product: 'Product Pages',
        cart: 'Cart Page',
        sitewide: 'Site-wide',
      };
      return {
        title,
        subtitle: positionLabels[subtitle] || subtitle || 'No position',
        media,
      };
    },
  },
});
