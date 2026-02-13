import { MetadataRoute } from 'next';

/**
 * Robots.txt configuration for Kids Petite
 * Controls which pages search engines can crawl
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://kidspetite.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/registry/create',
          '/registry/search',
        ],
      },
      {
        userAgent: '*',
        disallow: '/search',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
