/**
 * Sanity Studio Configuration
 *
 * This configuration file sets up Sanity Studio for content management.
 * Run `npx sanity dev` to start the Studio locally.
 */

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemas } from './schemas';

/**
 * Sanity Studio configuration
 */
export default defineConfig({
  name: 'kids-petite',
  title: 'Kids Petite CMS',
  
  // Project ID from environment
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '',
  
  // Dataset name
  dataset: process.env.SANITY_DATASET || 'production',
  
  // Plugins
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Products
            S.listItem()
              .title('Products')
              .icon(() => '🛍️')
              .child(
                S.documentList()
                  .title('Products')
                  .filter('_type == "product"')
                  .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
              ),
            
            // Categories
            S.listItem()
              .title('Categories')
              .icon(() => '📁')
              .child(
                S.documentList()
                  .title('Categories')
                  .filter('_type == "category"')
                  .defaultOrdering([{ field: 'name', direction: 'asc' }])
              ),
            
            // Collections
            S.listItem()
              .title('Collections')
              .icon(() => '✨')
              .child(
                S.documentList()
                  .title('Collections')
                  .filter('_type == "collection"')
                  .defaultOrdering([{ field: 'createdAt', direction: 'desc' }])
              ),
            
            // Banners
            S.listItem()
              .title('Banners')
              .icon(() => '🖼️')
              .child(
                S.documentList()
                  .title('Banners')
                  .filter('_type == "banner"')
                  .defaultOrdering([{ field: 'priority', direction: 'desc' }])
              ),
            
            // Divider
            S.divider(),
            
            // Pages
            S.listItem()
              .title('Pages')
              .icon(() => '📄')
              .child(
                S.documentList()
                  .title('Pages')
                  .filter('_type == "pageContent"')
              ),
            
            // Navigation
            S.listItem()
              .title('Navigation')
              .icon(() => '🧭')
              .child(
                S.documentList()
                  .title('Navigation Menus')
                  .filter('_type == "navigation"')
              ),
            
            // Divider
            S.divider(),
            
            // Site Settings (singleton)
            S.listItem()
              .title('Site Settings')
              .icon(() => '⚙️')
              .child(
                S.editor()
                  .id('siteSettings')
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
          ]),
    }),
    
    // Vision tool for GROQ queries (development only)
    visionTool({
      defaultApiVersion: '2024-01-01',
    }),
  ],
  
  // Schema types
  schema: {
    types: schemas,
  },
  
  // Document actions
  document: {
    // Hide certain actions for singletons
    actions: (input, context) => {
      const isSingleton = context.schemaType === 'siteSettings';
      
      if (isSingleton) {
        // Remove delete and duplicate actions for singletons
        return input.filter(({ action }) => !['delete', 'duplicate'].includes(action || ''));
      }
      
      return input;
    },
  },
});
