/**
 * Sanity GROQ Queries
 *
 * Centralized GROQ queries for fetching content from Sanity CMS.
 * All queries are typed and optimized for performance.
 *
 * GROQ (Graph-Relational Object Queries) is Sanity's query language.
 * Learn more: https://www.sanity.io/docs/groq
 */

// ===========================================
// Product Queries
// ===========================================

/**
 * Base product projection - common fields for all product queries
 */
const PRODUCT_FRAGMENT = `
  _id,
  _type,
  name,
  slug,
  description,
  "excerpt": array::join(string::split((pt::text(description))[0], "")[0..150], "") + "...",
  price,
  compareAtPrice,
  sku,
  stock,
  lowStockThreshold,
  "images": images[]{
    _key,
    "asset": asset->{
      _id,
      url,
      metadata {
        dimensions,
        lqip,
        palette
      }
    },
    alt,
    hotspot
  },
  "featuredImage": featuredImage.asset->{
    _id,
    url,
    metadata {
      dimensions,
      lqip,
      palette
    }
  },
  "categories": categories[]->{
    _id,
    name,
    slug
  },
  "collections": collections[]->{
    _id,
    name,
    slug
  },
  tags,
  isNew,
  isFeatured,
  isBestseller,
  seo,
  createdAt,
  updatedAt
`;

/**
 * Get all products with optional filtering and pagination
 */
export const PRODUCTS_QUERY = `
  *[_type == "product"] | order(createdAt desc) {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get products with pagination
 * @param start - Start index (0-based)
 * @param limit - Number of products to return
 */
export const PRODUCTS_PAGINATED_QUERY = `
  *[_type == "product"] | order(createdAt desc) [$start...$limit] {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get a single product by slug
 */
export const PRODUCT_BY_SLUG_QUERY = `
  *[_type == "product" && slug.current == $slug][0] {
    ${PRODUCT_FRAGMENT},
    "relatedProducts": *[_type == "product" && 
      slug.current != $slug && 
      count((categories[]->slug.current)[@ in $$categories]) > 0
    ] | order(createdAt desc) [0...4] {
      _id,
      name,
      slug,
      price,
      compareAtPrice,
      "featuredImage": featuredImage.asset->{
        _id,
        url,
        metadata {
          dimensions,
          lqip
        }
      },
      isNew,
      isFeatured,
      isBestseller
    }
  }
`;

/**
 * Get product by ID
 */
export const PRODUCT_BY_ID_QUERY = `
  *[_type == "product" && _id == $id][0] {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get featured products
 */
export const FEATURED_PRODUCTS_QUERY = `
  *[_type == "product" && isFeatured == true] | order(createdAt desc) {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get new arrivals
 */
export const NEW_ARRIVALS_QUERY = `
  *[_type == "product" && isNew == true] | order(createdAt desc) [0...8] {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get bestsellers
 */
export const BESTSELLERS_QUERY = `
  *[_type == "product" && isBestseller == true] | order(createdAt desc) [0...8] {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Search products by name or description
 */
export const SEARCH_PRODUCTS_QUERY = `
  *[_type == "product" && (
    name match $searchTerm ||
    description match $searchTerm ||
    tags[] match $searchTerm
  )] | order(score desc) {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get products by category slug
 */
export const PRODUCTS_BY_CATEGORY_QUERY = `
  *[_type == "product" && $categorySlug in categories[]->slug.current] | order(createdAt desc) {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get products by collection slug
 */
export const PRODUCTS_BY_COLLECTION_QUERY = `
  *[_type == "product" && $collectionSlug in collections[]->slug.current] | order(createdAt desc) {
    ${PRODUCT_FRAGMENT}
  }
`;

/**
 * Get products by tag
 */
export const PRODUCTS_BY_TAG_QUERY = `
  *[_type == "product" && $tag in tags] | order(createdAt desc) {
    ${PRODUCT_FRAGMENT}
  }
`;

// ===========================================
// Category Queries
// ===========================================

/**
 * Base category projection
 */
const CATEGORY_FRAGMENT = `
  _id,
  _type,
  name,
  slug,
  description,
  "image": image.asset->{
    _id,
    url,
    metadata {
      dimensions,
      lqip,
      palette
    }
  },
  "parent": parent->{
    _id,
    name,
    slug
  },
  "children": *[_type == "category" && references(^._id)]{
    _id,
    name,
    slug
  },
  seo,
  createdAt,
  updatedAt
`;

/**
 * Get all categories
 */
export const CATEGORIES_QUERY = `
  *[_type == "category"] | order(name asc) {
    ${CATEGORY_FRAGMENT}
  }
`;

/**
 * Get top-level categories (no parent)
 */
export const TOP_LEVEL_CATEGORIES_QUERY = `
  *[_type == "category" && !defined(parent)] | order(name asc) {
    ${CATEGORY_FRAGMENT}
  }
`;

/**
 * Get category by slug
 */
export const CATEGORY_BY_SLUG_QUERY = `
  *[_type == "category" && slug.current == $slug][0] {
    ${CATEGORY_FRAGMENT}
  }
`;

/**
 * Get category with product count
 */
export const CATEGORIES_WITH_COUNT_QUERY = `
  *[_type == "category"] | order(name asc) {
    ${CATEGORY_FRAGMENT},
    "productCount": count(*[_type == "product" && references(^._id)])
  }
`;

// ===========================================
// Collection Queries
// ===========================================

/**
 * Base collection projection
 */
const COLLECTION_FRAGMENT = `
  _id,
  _type,
  name,
  slug,
  description,
  "image": image.asset->{
    _id,
    url,
    metadata {
      dimensions,
      lqip,
      palette
    }
  },
  isActive,
  startDate,
  endDate,
  seo,
  createdAt,
  updatedAt
`;

/**
 * Get all active collections
 */
export const COLLECTIONS_QUERY = `
  *[_type == "collection" && isActive == true] | order(createdAt desc) {
    ${COLLECTION_FRAGMENT}
  }
`;

/**
 * Get collection by slug
 */
export const COLLECTION_BY_SLUG_QUERY = `
  *[_type == "collection" && slug.current == $slug][0] {
    ${COLLECTION_FRAGMENT}
  }
`;

/**
 * Get featured collections
 */
export const FEATURED_COLLECTIONS_QUERY = `
  *[_type == "collection" && isActive == true] | order(createdAt desc) [0...4] {
    ${COLLECTION_FRAGMENT}
  }
`;

// ===========================================
// Banner/Hero Queries
// ===========================================

/**
 * Base banner projection
 */
const BANNER_FRAGMENT = `
  _id,
  _type,
  title,
  subtitle,
  description,
  "image": image.asset->{
    _id,
    url,
    metadata {
      dimensions,
      lqip,
      palette
    }
  },
  "mobileImage": mobileImage.asset->{
    _id,
    url,
    metadata {
      dimensions,
      lqip
    }
  },
  link,
  buttonText,
  buttonStyle,
  alignment,
  overlay,
  isActive,
  startDate,
  endDate,
  priority
`;

/**
 * Get all active banners
 */
export const BANNERS_QUERY = `
  *[_type == "banner" && isActive == true] | order(priority desc, createdAt desc) {
    ${BANNER_FRAGMENT}
  }
`;

/**
 * Get homepage hero banners
 */
export const HERO_BANNERS_QUERY = `
  *[_type == "banner" && isActive == true && (
    !defined(startDate) || dateTime(startDate) <= dateTime(now())
  ) && (
    !defined(endDate) || dateTime(endDate) >= dateTime(now())
  )] | order(priority desc) [0...5] {
    ${BANNER_FRAGMENT}
  }
`;

// ===========================================
// Page Content Queries
// ===========================================

/**
 * Base page content projection
 */
const PAGE_CONTENT_FRAGMENT = `
  _id,
  _type,
  title,
  slug,
  content[] {
    ...,
    _type == "imageBlock" => {
      "image": image.asset->{
        _id,
        url,
        metadata {
          dimensions,
          lqip,
          palette
        }
      }
    },
    _type == "productGrid" => {
      "products": products[]->{
        _id,
        name,
        slug,
        price,
        compareAtPrice,
        "featuredImage": featuredImage.asset->{
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        },
        isNew,
        isFeatured,
        isBestseller
      }
    }
  },
  seo,
  createdAt,
  updatedAt
`;

/**
 * Get page content by slug
 */
export const PAGE_CONTENT_QUERY = `
  *[_type == "pageContent" && slug.current == $slug][0] {
    ${PAGE_CONTENT_FRAGMENT}
  }
`;

/**
 * Get homepage content
 */
export const HOMEPAGE_CONTENT_QUERY = `
  *[_type == "pageContent" && slug.current == "homepage"][0] {
    ${PAGE_CONTENT_FRAGMENT}
  }
`;

// ===========================================
// Site Settings Queries
// ===========================================

/**
 * Get site settings
 */
export const SITE_SETTINGS_QUERY = `
  *[_type == "siteSettings"][0] {
    title,
    description,
    "logo": logo.asset->{
      _id,
      url,
      metadata {
        dimensions
      }
    },
    "favicon": favicon.asset->{
      _id,
      url
    },
    socialLinks,
    contactInfo,
    seo
  }
`;

/**
 * Get navigation menu
 */
export const NAVIGATION_QUERY = `
  *[_type == "navigation" && name == $name][0] {
    items[] {
      _key,
      label,
      link,
      "children": children[] {
        _key,
        label,
        link
      }
    }
  }
`;

// ===========================================
// Combined Queries for Homepage
// ===========================================

/**
 * Get all homepage data in a single query
 */
export const HOMEPAGE_DATA_QUERY = `
  {
    "hero": *[_type == "banner" && isActive == true] | order(priority desc) [0...5] {
      ${BANNER_FRAGMENT}
    },
    "featuredProducts": *[_type == "product" && isFeatured == true] | order(createdAt desc) [0...8] {
      ${PRODUCT_FRAGMENT}
    },
    "newArrivals": *[_type == "product" && isNew == true] | order(createdAt desc) [0...8] {
      ${PRODUCT_FRAGMENT}
    },
    "bestsellers": *[_type == "product" && isBestseller == true] | order(createdAt desc) [0...8] {
      ${PRODUCT_FRAGMENT}
    },
    "categories": *[_type == "category" && !defined(parent)] | order(name asc) {
      _id,
      name,
      slug,
      "image": image.asset->{
        _id,
        url,
        metadata {
          dimensions,
          lqip
        }
      }
    },
    "collections": *[_type == "collection" && isActive == true] | order(createdAt desc) [0...3] {
      ${COLLECTION_FRAGMENT}
    }
  }
`;

// ===========================================
// Query Parameter Types
// ===========================================

export interface ProductQueryParams {
  slug: string;
}

export interface PaginatedQueryParams {
  start: number;
  limit: number;
}

export interface SearchQueryParams {
  searchTerm: string;
}

export interface CategoryQueryParams {
  categorySlug: string;
}

export interface CollectionQueryParams {
  collectionSlug: string;
}

export interface TagQueryParams {
  tag: string;
}

export interface NavigationQueryParams {
  name: string;
}

export interface PageQueryParams {
  slug: string;
}
