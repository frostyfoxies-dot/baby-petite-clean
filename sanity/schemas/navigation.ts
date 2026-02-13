/**
 * Navigation Schema
 *
 * Defines navigation menus for the site in Sanity CMS.
 * Supports multi-level navigation with nested items.
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Menu Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Internal name to identify this menu (e.g., "main", "footer")',
    }),
    defineField({
      name: 'items',
      title: 'Menu Items',
      type: 'array',
      of: [{ type: 'navItem' }],
      validation: (Rule) => Rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
});

/**
 * Navigation Item - Individual menu item
 */
export const navItem = defineType({
  name: 'navItem',
  title: 'Navigation Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'string',
      description: 'URL or path (e.g., "/products" or "https://...")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'children',
      title: 'Submenu Items',
      type: 'array',
      of: [{ type: 'navSubItem' }],
      description: 'Optional dropdown submenu items',
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'link',
    },
  },
});

/**
 * Navigation Sub Item - Child menu item
 */
export const navSubItem = defineType({
  name: 'navSubItem',
  title: 'Navigation Sub Item',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'link',
    },
  },
});

/**
 * TypeScript type for Navigation document
 */
export interface NavigationDocument {
  _id: string;
  _type: 'navigation';
  name: string;
  items: Array<{
    _key: string;
    label: string;
    link: string;
    children?: Array<{
      _key: string;
      label: string;
      link: string;
    }>;
  }>;
}
