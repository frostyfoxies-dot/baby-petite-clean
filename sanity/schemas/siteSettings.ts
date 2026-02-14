/**
 * Site Settings Schema
 *
 * Defines global site settings and configuration in Sanity CMS.
 * This is a singleton document type for site-wide settings.
 */

import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    {
      name: 'general',
      title: 'General',
      default: true,
    },
    {
      name: 'branding',
      title: 'Branding',
    },
    {
      name: 'social',
      title: 'Social Links',
    },
    {
      name: 'contact',
      title: 'Contact Info',
    },
    {
      name: 'seo',
      title: 'SEO',
    },
  ],
  fields: [
    // General Group
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      group: 'general',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      group: 'general',
      rows: 2,
      description: 'Default description used for SEO',
    }),
    
    // Branding Group
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      options: {
        metadata: ['lqip'],
      },
      description: 'Main site logo',
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      group: 'branding',
      description: 'Site favicon (recommended: 32x32 or 64x64 pixels)',
    }),
    defineField({
      name: 'primaryColor',
      title: 'Primary Color',
      type: 'string',
      group: 'branding',
      description: 'Primary brand color (hex code)',
    }),
    defineField({
      name: 'secondaryColor',
      title: 'Secondary Color',
      type: 'string',
      group: 'branding',
      description: 'Secondary brand color (hex code)',
    }),
    
    // Social Links Group
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      group: 'social',
      fields: [
        defineField({
          name: 'facebook',
          title: 'Facebook',
          type: 'url',
        }),
        defineField({
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
        }),
        defineField({
          name: 'twitter',
          title: 'Twitter/X',
          type: 'url',
        }),
        defineField({
          name: 'pinterest',
          title: 'Pinterest',
          type: 'url',
        }),
        defineField({
          name: 'youtube',
          title: 'YouTube',
          type: 'url',
        }),
        defineField({
          name: 'tiktok',
          title: 'TikTok',
          type: 'url',
        }),
      ],
    }),
    
    // Contact Info Group
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({
          name: 'email',
          title: 'Email',
          type: 'email',
        }),
        defineField({
          name: 'phone',
          title: 'Phone',
          type: 'string',
        }),
        defineField({
          name: 'address',
          title: 'Address',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'businessHours',
          title: 'Business Hours',
          type: 'text',
          rows: 2,
        }),
      ],
    }),
    
    // SEO Group
    defineField({
      name: 'seo',
      title: 'Default SEO Settings',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'titleTemplate',
          title: 'Title Template',
          type: 'string',
          description: 'Template for page titles. Use %s for page title (e.g., "%s | Kids Petite")',
        }),
        defineField({
          name: 'defaultOgImage',
          title: 'Default Open Graph Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
        defineField({
          name: 'googleSiteVerification',
          title: 'Google Site Verification',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'logo',
    },
  },
});

/**
 * TypeScript type for Site Settings document
 */
export interface SiteSettingsDocument {
  _id: string;
  _type: 'siteSettings';
  title: string;
  description?: string;
  logo?: {
    asset: {
      _id: string;
      url: string;
      metadata?: {
        dimensions?: { width: number; height: number };
      };
    };
  };
  favicon?: {
    asset: {
      _id: string;
      url: string;
    };
  };
  primaryColor?: string;
  secondaryColor?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    pinterest?: string;
    youtube?: string;
    tiktok?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
    businessHours?: string;
  };
  seo?: {
    titleTemplate?: string;
    defaultOgImage?: { asset: { _id: string; url: string } };
    googleSiteVerification?: string;
  };
}
