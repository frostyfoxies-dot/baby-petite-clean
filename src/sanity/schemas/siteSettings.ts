import { defineType, defineField, defineArrayMember } from 'sanity';
import { CogIcon } from '@sanity/icons';

/**
 * Site Settings Schema
 * Singleton document for global site configuration
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  // Make this a singleton - only one document allowed
  __experimental_actions: ['update', 'publish'],
  fields: [
    // Basic Site Information
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      description: 'The name of your store',
      validation: (Rule) => Rule.required().error('Site name is required'),
      initialValue: 'Kids Petite',
    }),
    defineField({
      name: 'siteTagline',
      title: 'Site Tagline',
      type: 'string',
      description: 'A short tagline or slogan for your store',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Description',
      type: 'text',
      rows: 3,
      description: 'A brief description of your store for SEO and social sharing',
    }),

    // Logo & Branding
    defineField({
      name: 'logo',
      title: 'Logo',
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
    }),
    defineField({
      name: 'logoWhite',
      title: 'Logo (White/Inverted)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'White version of logo for dark backgrounds',
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      description: 'Recommended size: 32x32 or 64x64 pixels',
      options: {
        accept: 'image/svg+xml,image/png',
      },
    }),
    defineField({
      name: 'ogImage',
      title: 'Default Social Sharing Image',
      type: 'image',
      description: 'Default image for social media sharing (Open Graph)',
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
    }),

    // Contact Information
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'email',
      description: 'Main contact email address',
    }),
    defineField({
      name: 'supportEmail',
      title: 'Support Email',
      type: 'email',
      description: 'Customer support email address',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Main phone number',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp Number',
      type: 'string',
      description: 'WhatsApp contact number (include country code)',
    }),
    defineField({
      name: 'address',
      title: 'Business Address',
      type: 'object',
      fields: [
        { name: 'street', title: 'Street Address', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'state', title: 'State/Province', type: 'string' },
        { name: 'postalCode', title: 'Postal Code', type: 'string' },
        { name: 'country', title: 'Country', type: 'string' },
      ],
    }),

    // Social Media Links
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      options: {
        columns: 2,
      },
      fields: [
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
        {
          name: 'twitter',
          title: 'Twitter/X',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
        {
          name: 'pinterest',
          title: 'Pinterest',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
        {
          name: 'youtube',
          title: 'YouTube',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
        {
          name: 'tiktok',
          title: 'TikTok',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }),
        },
      ],
    }),

    // Footer Content
    defineField({
      name: 'footerContent',
      title: 'Footer Content',
      type: 'object',
      fields: [
        {
          name: 'aboutText',
          title: 'About Text',
          type: 'text',
          rows: 3,
          description: 'Short description shown in the footer',
        },
        {
          name: 'copyrightText',
          title: 'Copyright Text',
          type: 'string',
          description: 'Custom copyright text (defaults to © Year Site Name)',
        },
        {
          name: 'showPaymentMethods',
          title: 'Show Payment Methods',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'paymentMethods',
          title: 'Payment Methods',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Visa', value: 'visa' },
              { title: 'Mastercard', value: 'mastercard' },
              { title: 'American Express', value: 'amex' },
              { title: 'PayPal', value: 'paypal' },
              { title: 'Apple Pay', value: 'applepay' },
              { title: 'Google Pay', value: 'googlepay' },
              { title: 'Shop Pay', value: 'shoppay' },
              { title: 'Bank Transfer', value: 'bank' },
            ],
            layout: 'grid',
          },
          hidden: ({ parent }) => !parent?.showPaymentMethods,
        },
      ],
    }),

    // Newsletter
    defineField({
      name: 'newsletter',
      title: 'Newsletter Settings',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Newsletter',
          type: 'boolean',
          initialValue: true,
        },
        {
          name: 'title',
          title: 'Newsletter Title',
          type: 'string',
          initialValue: 'Subscribe to our newsletter',
        },
        {
          name: 'description',
          title: 'Newsletter Description',
          type: 'text',
          rows: 2,
          initialValue: 'Get the latest updates on new products and upcoming sales.',
        },
        {
          name: 'buttonText',
          title: 'Button Text',
          type: 'string',
          initialValue: 'Subscribe',
        },
      ],
    }),

    // SEO Settings
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Default Meta Title',
          type: 'string',
          description: 'Default title for pages without custom SEO titles',
        },
        {
          name: 'metaDescription',
          title: 'Default Meta Description',
          type: 'text',
          rows: 2,
          description: 'Default description for pages without custom descriptions',
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            layout: 'tags',
          },
        },
        {
          name: 'googleSiteVerification',
          title: 'Google Site Verification',
          type: 'string',
          description: 'Google Search Console verification code',
        },
      ],
    }),

    // Analytics & Tracking
    defineField({
      name: 'analytics',
      title: 'Analytics & Tracking',
      type: 'object',
      fields: [
        {
          name: 'googleAnalyticsId',
          title: 'Google Analytics ID',
          type: 'string',
          description: 'e.g., G-XXXXXXXXXX or UA-XXXXXXXX-X',
        },
        {
          name: 'facebookPixelId',
          title: 'Facebook Pixel ID',
          type: 'string',
        },
        {
          name: 'googleTagManagerId',
          title: 'Google Tag Manager ID',
          type: 'string',
          description: 'e.g., GTM-XXXXXXX',
        },
      ],
    }),

    // Store Settings
    defineField({
      name: 'storeSettings',
      title: 'Store Settings',
      type: 'object',
      fields: [
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          options: {
            list: [
              { title: 'USD ($)', value: 'USD' },
              { title: 'EUR (€)', value: 'EUR' },
              { title: 'GBP (£)', value: 'GBP' },
              { title: 'MYR (RM)', value: 'MYR' },
              { title: 'SGD (S$)', value: 'SGD' },
              { title: 'AUD (A$)', value: 'AUD' },
              { title: 'CAD (C$)', value: 'CAD' },
            ],
            layout: 'radio',
          },
          initialValue: 'USD',
        },
        {
          name: 'currencySymbol',
          title: 'Currency Symbol',
          type: 'string',
          initialValue: '$',
        },
        {
          name: 'taxRate',
          title: 'Tax Rate (%)',
          type: 'number',
          description: 'Default tax rate for products',
          validation: (Rule) => Rule.min(0).max(100),
        },
        {
          name: 'freeShippingThreshold',
          title: 'Free Shipping Threshold',
          type: 'number',
          description: 'Order amount for free shipping (leave empty for no threshold)',
        },
        {
          name: 'showPricesWithTax',
          title: 'Show Prices with Tax',
          type: 'boolean',
          description: 'Display prices including tax',
          initialValue: false,
        },
      ],
    }),

    // Announcement Bar
    defineField({
      name: 'announcementBar',
      title: 'Announcement Bar',
      type: 'object',
      fields: [
        {
          name: 'enabled',
          title: 'Enable Announcement Bar',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'message',
          title: 'Announcement Message',
          type: 'string',
          hidden: ({ parent }) => !parent?.enabled,
        },
        {
          name: 'link',
          title: 'Link',
          type: 'url',
          hidden: ({ parent }) => !parent?.enabled,
        },
        {
          name: 'backgroundColor',
          title: 'Background Color',
          type: 'string',
          description: 'Hex color code',
          initialValue: '#1a1a1a',
          hidden: ({ parent }) => !parent?.enabled,
        },
        {
          name: 'textColor',
          title: 'Text Color',
          type: 'string',
          description: 'Hex color code',
          initialValue: '#ffffff',
          hidden: ({ parent }) => !parent?.enabled,
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
        subtitle: 'Global site configuration',
      };
    },
  },
});
