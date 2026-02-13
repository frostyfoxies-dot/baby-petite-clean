/**
 * Sanity Schema Exports
 *
 * This file exports all Sanity schemas for use in Sanity Studio.
 * Import this file in your sanity.config.ts to register all schemas.
 */

import product from './product';
import category from './category';
import collection from './collection';
import banner from './banner';
import pageContent, { imageBlock, productGrid, heroBlock, textBlock } from './pageContent';
import siteSettings from './siteSettings';
import navigation, { navItem, navSubItem } from './navigation';

/**
 * All Sanity schemas
 */
export const schemas = [
  // Document types
  product,
  category,
  collection,
  banner,
  pageContent,
  siteSettings,
  navigation,
  // Object types (nested within documents)
  navItem,
  navSubItem,
  imageBlock,
  productGrid,
  heroBlock,
  textBlock,
];

/**
 * Schema types for TypeScript
 */
export type { ProductDocument } from './product';
export type { CategoryDocument } from './category';
export type { CollectionDocument } from './collection';
export type { BannerDocument } from './banner';
export type { PageContentDocument } from './pageContent';
export type { SiteSettingsDocument } from './siteSettings';
export type { NavigationDocument } from './navigation';
