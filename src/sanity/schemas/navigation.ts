import { defineType, defineField, defineArrayMember } from 'sanity';
import { MenuIcon } from '@sanity/icons';

/**
 * Navigation Menu Schema
 * For creating custom navigation menus (main menu, footer menu, etc.)
 */
export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation Menu',
  type: 'document',
  icon: MenuIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Menu Name',
      type: 'string',
      description: 'Internal name for this menu (e.g., "Main Navigation", "Footer Links")',
      validation: (Rule) => Rule.required().error('Menu name is required'),
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
      type: 'text',
      rows: 2,
      description: 'Optional description of where this menu is used',
    }),
    defineField({
      name: 'location',
      title: 'Menu Location',
      type: 'string',
      options: {
        list: [
          { title: 'Header - Main Navigation', value: 'header' },
          { title: 'Footer - Primary Links', value: 'footer-primary' },
          { title: 'Footer - Secondary Links', value: 'footer-secondary' },
          { title: 'Sidebar', value: 'sidebar' },
          { title: 'Mobile Menu', value: 'mobile' },
        ],
        layout: 'radio',
      },
      description: 'Where this menu appears on the site',
    }),
    defineField({
      name: 'items',
      title: 'Menu Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'menuItem',
          title: 'Menu Item',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'Text displayed for this menu item',
              validation: (Rule) => Rule.required().error('Label is required'),
            }),
            defineField({
              name: 'linkType',
              title: 'Link Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Internal Page', value: 'internal' },
                  { title: 'External URL', value: 'external' },
                  { title: 'Category', value: 'category' },
                  { title: 'Collection', value: 'collection' },
                  { title: 'Product', value: 'product' },
                ],
                layout: 'radio',
              },
              initialValue: 'internal',
            }),
            defineField({
              name: 'internalLink',
              title: 'Internal Page',
              type: 'reference',
              to: [{ type: 'page' }],
              hidden: ({ parent }) => parent?.linkType !== 'internal',
            }),
            defineField({
              name: 'externalUrl',
              title: 'External URL',
              type: 'url',
              hidden: ({ parent }) => parent?.linkType !== 'external',
              validation: (Rule) =>
                Rule.uri({
                  scheme: ['http', 'https'],
                }),
            }),
            defineField({
              name: 'categoryLink',
              title: 'Category',
              type: 'reference',
              to: [{ type: 'category' }],
              hidden: ({ parent }) => parent?.linkType !== 'category',
            }),
            defineField({
              name: 'collectionLink',
              title: 'Collection',
              type: 'reference',
              to: [{ type: 'collection' }],
              hidden: ({ parent }) => parent?.linkType !== 'collection',
            }),
            defineField({
              name: 'productLink',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
              hidden: ({ parent }) => parent?.linkType !== 'product',
            }),
            defineField({
              name: 'openInNewTab',
              title: 'Open in New Tab',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'highlight',
              title: 'Highlight',
              type: 'boolean',
              description: 'Apply special styling to this item',
              initialValue: false,
            }),
            defineField({
              name: 'children',
              title: 'Submenu Items',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'subMenuItem',
                  title: 'Submenu Item',
                  fields: [
                    {
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'linkType',
                      title: 'Link Type',
                      type: 'string',
                      options: {
                        list: [
                          { title: 'Internal Page', value: 'internal' },
                          { title: 'External URL', value: 'external' },
                          { title: 'Category', value: 'category' },
                          { title: 'Collection', value: 'collection' },
                          { title: 'Product', value: 'product' },
                        ],
                        layout: 'radio',
                      },
                      initialValue: 'internal',
                    },
                    {
                      name: 'internalLink',
                      title: 'Internal Page',
                      type: 'reference',
                      to: [{ type: 'page' }],
                      hidden: ({ parent }) => parent?.linkType !== 'internal',
                    },
                    {
                      name: 'externalUrl',
                      title: 'External URL',
                      type: 'url',
                      hidden: ({ parent }) => parent?.linkType !== 'external',
                    },
                    {
                      name: 'categoryLink',
                      title: 'Category',
                      type: 'reference',
                      to: [{ type: 'category' }],
                      hidden: ({ parent }) => parent?.linkType !== 'category',
                    },
                    {
                      name: 'collectionLink',
                      title: 'Collection',
                      type: 'reference',
                      to: [{ type: 'collection' }],
                      hidden: ({ parent }) => parent?.linkType !== 'collection',
                    },
                    {
                      name: 'productLink',
                      title: 'Product',
                      type: 'reference',
                      to: [{ type: 'product' }],
                      hidden: ({ parent }) => parent?.linkType !== 'product',
                    },
                    {
                      name: 'openInNewTab',
                      title: 'Open in New Tab',
                      type: 'boolean',
                      initialValue: false,
                    },
                    {
                      name: 'description',
                      title: 'Description',
                      type: 'string',
                      description: 'Optional description shown below the label',
                    },
                    {
                      name: 'icon',
                      title: 'Icon Image',
                      type: 'image',
                      options: { hotspot: true },
                      fields: [
                        {
                          name: 'alt',
                          type: 'string',
                          title: 'Alternative Text',
                        },
                      ],
                    },
                  ],
                  preview: {
                    select: {
                      title: 'label',
                      subtitle: 'description',
                      media: 'icon',
                    },
                  },
                }),
              ],
              description: 'Add submenu items for dropdown navigation',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'linkType',
            },
            prepare(selection) {
              const { title, subtitle } = selection;
              const linkTypeLabels: Record<string, string> = {
                internal: 'Internal Page',
                external: 'External URL',
                category: 'Category',
                collection: 'Collection',
                product: 'Product',
              };
              return {
                title,
                subtitle: linkTypeLabels[subtitle] || subtitle,
              };
            },
          },
        }),
      ],
      description: 'Add items to this navigation menu',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Only active menus are available for use',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'location',
    },
    prepare(selection) {
      const { title, subtitle } = selection;
      const locationLabels: Record<string, string> = {
        header: 'Header - Main Navigation',
        'footer-primary': 'Footer - Primary Links',
        'footer-secondary': 'Footer - Secondary Links',
        sidebar: 'Sidebar',
        mobile: 'Mobile Menu',
      };
      return {
        title,
        subtitle: locationLabels[subtitle] || subtitle || 'No location set',
      };
    },
  },
});
