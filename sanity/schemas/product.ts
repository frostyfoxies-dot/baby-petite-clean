/**
 * Product Schema
 *
 * Defines the structure for product documents in Sanity CMS.
 * Products are the core content type for the e-commerce platform.
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'product',
  title: 'Product',
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
      name: 'pricing',
      title: 'Pricing & Inventory',
    },
    {
      name: 'organization',
      title: 'Organization',
    },
    {
      name: 'seo',
      title: 'SEO',
    },
    {
      name: 'sourcing',
      title: 'Sourcing',
    },
  ],
  fields: [
    // Content Group
    defineField({
      name: 'name',
      title: 'Product Name',
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
        source: 'name',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      group: 'content',
      of: [{ type: 'block' }],
      validation: (Rule) => Rule.required(),
    }),
    
    // Media Group
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'media',
      options: {
        hotspot: true,
        metadata: ['lqip', 'palette'],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      group: 'media',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
            metadata: ['lqip', 'palette'],
          },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
              description: 'Describe the image for accessibility',
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).max(10),
    }),
    
    // Pricing & Inventory Group
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'pricing',
      description: 'Price in cents (e.g., 1999 = $19.99)',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare at Price',
      type: 'number',
      group: 'pricing',
      description: 'Original price for showing discounts (in cents)',
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      group: 'pricing',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'stock',
      title: 'Stock Quantity',
      type: 'number',
      group: 'pricing',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'lowStockThreshold',
      title: 'Low Stock Threshold',
      type: 'number',
      group: 'pricing',
      description: 'Alert when stock falls below this number',
      initialValue: 5,
    }),
    
    // Organization Group
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'organization',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'collections',
      title: 'Collections',
      type: 'array',
      group: 'organization',
      of: [{ type: 'reference', to: [{ type: 'collection' }] }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'organization',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'isNew',
      title: 'New Arrival',
      type: 'boolean',
      group: 'organization',
      initialValue: false,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured Product',
      type: 'boolean',
      group: 'organization',
      initialValue: false,
    }),
    defineField({
      name: 'isBestseller',
      title: 'Bestseller',
      type: 'boolean',
      group: 'organization',
      initialValue: false,
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
    
    // Compliance Group
    defineField({
      name: 'compliance',
      title: 'Compliance & Safety',
      type: 'object',
      group: 'compliance',
      fields: [
        defineField({
          name: 'minAge',
          title: 'Minimum Age',
          type: 'number',
          description: 'Minimum recommended age in months (e.g., 0 for newborns)',
          validation: (Rule) => Rule.min(0).max(72),
        }),
        defineField({
          name: 'maxAge',
          title: 'Maximum Age',
          type: 'number',
          description: 'Maximum recommended age in months (e.g., 36 for 3 years)',
          validation: (Rule) => Rule.min(0).max(180),
        }),
        defineField({
          name: 'chokingHazard',
          title: 'Choking Hazard Warning',
          type: 'boolean',
          description: 'Does this product contain small parts?',
        }),
        defineField({
          name: 'chokingHazardDetails',
          title: 'Choking Hazard Details',
          type: 'text',
          description: 'Detailed warning text (e.g., "Small parts. Not for children under 3 years.")',
        }),
        defineField({
          name: 'certifications',
          title: 'Safety Certifications',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            layout: 'tags',
          },
          description: 'e.g., CPSIA, ASTM F963, CE, EN71',
        }),
        defineField({
          name: 'countryOfOrigin',
          title: 'Country of Origin',
          type: 'string',
          description: 'Where was this product manufactured?',
        }),
        defineField({
          name: 'careInstructions',
          title: 'Care Instructions',
          type: 'array',
          of: [{ type: 'block' }],
          description: 'Washing and care guidelines',
        }),
      ],
    }),
    
    // Sourcing Group
    defineField({
      name: 'sourceData',
      title: 'Source Data',
      type: 'object',
      group: 'sourcing',
      fields: [
        defineField({
          name: 'aliExpressProductId',
          title: 'AliExpress Product ID',
          type: 'string',
          description: 'Unique AliExpress product identifier for order fulfillment',
        }),
        defineField({
          name: 'aliExpressUrl',
          title: 'AliExpress URL',
          type: 'url',
          description: 'Original product URL on AliExpress',
        }),
        defineField({
          name: 'supplierId',
          title: 'Supplier ID',
          type: 'string',
          description: 'Reference to supplier in PostgreSQL database',
        }),
        defineField({
          name: 'originalPrice',
          title: 'Original Cost',
          type: 'number',
          description: 'Cost price in cents from AliExpress',
        }),
        defineField({
          name: 'originalCurrency',
          title: 'Original Currency',
          type: 'string',
          initialValue: 'USD',
        }),
        defineField({
          name: 'lastSynced',
          title: 'Last Synced',
          type: 'datetime',
        }),
        defineField({
          name: 'sourceStatus',
          title: 'Source Status',
          type: 'string',
          options: {
            list: [
              { title: 'Active', value: 'active' },
              { title: 'Unavailable', value: 'unavailable' },
              { title: 'Discontinued', value: 'discontinued' },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: 'variantMapping',
      title: 'Variant Mapping',
      type: 'array',
      group: 'sourcing',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'localVariantSku',
              type: 'string',
              title: 'Local SKU',
            }),
            defineField({
              name: 'aliExpressSku',
              type: 'string',
              title: 'AliExpress SKU ID',
            }),
            defineField({
              name: 'aliExpressVariantName',
              type: 'string',
              title: 'AliExpress Variant Name',
            }),
          ],
        },
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
      title: 'Newest First',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'sku',
      media: 'featuredImage',
    },
  },
});

/**
 * TypeScript type for Product document
 */
export interface ProductDocument {
  _id: string;
  _type: 'product';
  name: string;
  slug: { current: string };
  description: Array<{
    _type: 'block';
    children: Array<{ text: string }>;
  }>;
  featuredImage: {
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
  images?: Array<{
    _key: string;
    asset: {
      _id: string;
      url: string;
      metadata?: {
        dimensions?: { width: number; height: number };
        lqip?: string;
        palette?: Record<string, unknown>;
      };
    };
    alt?: string;
    hotspot?: { x: number; y: number };
  }>;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  lowStockThreshold?: number;
  categories?: Array<{ _id: string; name: string; slug: { current: string } }>;
  collections?: Array<{ _id: string; name: string; slug: { current: string } }>;
  tags?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  compliance?: {
    minAge?: number;
    maxAge?: number;
    chokingHazard?: boolean;
    chokingHazardDetails?: string;
    certifications?: string[];
    countryOfOrigin?: string;
    careInstructions?: Array<{
      _type: 'block';
      children: Array<{ text: string }>;
    }>;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: { asset: { _id: string; url: string } };
  };
  sourceData?: {
    aliExpressProductId?: string;
    aliExpressUrl?: string;
    supplierId?: string;
    originalPrice?: number;
    originalCurrency?: string;
    lastSynced?: string;
    sourceStatus?: 'active' | 'unavailable' | 'discontinued';
  };
  variantMapping?: Array<{
    _key: string;
    localVariantSku: string;
    aliExpressSku: string;
    aliExpressVariantName: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
