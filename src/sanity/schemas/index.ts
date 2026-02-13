import { blockContent } from './blockContent';
import { category } from './category';
import { product } from './product';
import { collection } from './collection';
import { banner } from './banner';
import { page } from './page';
import { navigation } from './navigation';
import { siteSettings } from './siteSettings';

/**
 * All Sanity schema types exported from a central index
 * These are imported by sanity.config.ts
 */
export const schemaTypes = [
  // Rich text content
  blockContent,

  // Content documents
  category,
  product,
  collection,
  banner,
  page,

  // Site configuration
  navigation,
  siteSettings,
];

// Re-export individual schemas for use in other modules
export {
  blockContent,
  category,
  product,
  collection,
  banner,
  page,
  navigation,
  siteSettings,
};
