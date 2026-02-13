import { defineType, defineField, defineArrayMember } from 'sanity';
import { PackageIcon } from '@sanity/icons';

/**
 * Product Schema
 * Full e-commerce product with variants, pricing, and inventory
 */
export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  fields: [
    // Basic Information
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Product name is required'),
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
      name: 'sku',
      title: 'SKU (Stock Keeping Unit)',
      type: 'string',
      description: 'Unique identifier for inventory management',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[A-Z0-9-]+$/, { name: 'alphanumeric with dashes' })
          .error('SKU must be uppercase alphanumeric with dashes allowed'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'blockContent',
      description: 'Full product description with rich text support',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required().error('Category is required'),
    }),

    // Pricing
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Current selling price',
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .precision(2)
          .error('Price is required and must be a positive number'),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare at Price',
      type: 'number',
      description: 'Original price for showing discounts (MSRP)',
      validation: (Rule) =>
        Rule.min(0)
          .precision(2)
          .custom((value, context) => {
            const price = (context.document as { price?: number })?.price;
            if (value && price && value <= price) {
              return 'Compare at price should be higher than the selling price';
            }
            return true;
          }),
    }),
    defineField({
      name: 'costPrice',
      title: 'Cost Price',
      type: 'number',
      description: 'Cost of goods sold (for margin calculations)',
      validation: (Rule) => Rule.min(0).precision(2),
    }),

    // Status & Visibility
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Only active products are visible on the storefront',
      initialValue: true,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured',
      type: 'boolean',
      description: 'Featured products appear in special sections',
      initialValue: false,
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tags for filtering and search (e.g., "new", "sale", "organic")',
      options: {
        layout: 'tags',
      },
    }),

    // SEO
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Custom title for SEO. Falls back to product name if empty.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      description: 'Meta description for search engines (recommended: 150-160 characters)',
      validation: (Rule) => Rule.max(160).warning('SEO descriptions should be under 160 characters'),
    }),

    // Variants
    defineField({
      name: 'variants',
      title: 'Product Variants',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'variant',
          title: 'Variant',
          fields: [
            { name: 'name', title: 'Variant Name', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'sku', title: 'Variant SKU', type: 'string', validation: (Rule) => Rule.required() },
            { name: 'size', title: 'Size', type: 'string', description: 'e.g., S, M, L, 2T, 4T' },
            {
              name: 'color',
              title: 'Color',
              type: 'string',
              description: 'Color name (e.g., "Navy Blue")',
            },
            {
              name: 'colorCode',
              title: 'Color Code',
              type: 'string',
              description: 'Hex color code for swatch display (e.g., "#1a237e")',
              validation: (Rule) =>
                Rule.regex(/^#[0-9A-Fa-f]{6}$/).warning('Should be a valid hex color code'),
            },
            {
              name: 'price',
              title: 'Price Override',
              type: 'number',
              description: 'Leave empty to use base price',
              validation: (Rule) => Rule.min(0).precision(2),
            },
            {
              name: 'compareAtPrice',
              title: 'Compare at Price Override',
              type: 'number',
              validation: (Rule) => Rule.min(0).precision(2),
            },
            {
              name: 'stock',
              title: 'Stock Quantity',
              type: 'number',
              description: 'Available inventory for this variant',
              validation: (Rule) => Rule.min(0).integer(),
            },
          ],
          preview: {
            select: {
              title: 'name',
              subtitle: 'sku',
              media: 'colorCode',
            },
            prepare(selection) {
              const { title, subtitle } = selection;
              return {
                title: title || 'Unnamed Variant',
                subtitle: subtitle || 'No SKU',
              };
            },
          },
        }),
      ],
      description: 'Product variations like size and color combinations',
    }),

    // Images
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'productImage',
          title: 'Image',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              description: 'Describe the image for accessibility',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'isPrimary',
              title: 'Primary Image',
              type: 'boolean',
              description: 'This will be the main product image',
              initialValue: false,
            },
          ],
          preview: {
            select: {
              media: 'image',
              title: 'alt',
              subtitle: 'isPrimary',
            },
            prepare(selection) {
              const { media, title, subtitle } = selection;
              return {
                media,
                title: title || 'No alt text',
                subtitle: subtitle ? 'Primary Image' : 'Secondary Image',
              };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).error('At least one product image is required'),
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
      title: 'Price Low to High',
      name: 'priceAsc',
      by: [{ field: 'price', direction: 'asc' }],
    },
    {
      title: 'Price High to Low',
      name: 'priceDesc',
      by: [{ field: 'price', direction: 'desc' }],
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
      subtitle: 'category.name',
      media: 'images.0.image',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title,
        subtitle: subtitle || 'No category',
        media,
      };
    },
  },
});
