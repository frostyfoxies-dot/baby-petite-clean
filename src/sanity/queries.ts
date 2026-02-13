import { client } from './client';
import groq from 'groq';

// ============================================
// Type Definitions for Query Results
// ============================================

export interface ProductImage {
  _key: string;
  image: {
    _ref: string;
    asset: {
      _ref: string;
      url: string;
      metadata: {
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
  };
  alt: string;
  isPrimary: boolean;
}

export interface ProductVariant {
  _key: string;
  name: string;
  sku: string;
  size?: string;
  color?: string;
  colorCode?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
}

export interface Product {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  name: string;
  slug: { current: string };
  sku: string;
  description: any[]; // Portable Text
  category: {
    _id: string;
    name: string;
    slug: { current: string };
  };
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface Category {
  _id: string;
  name: string;
  slug: { current: string };
  description?: string;
  parent?: {
    _id: string;
    name: string;
    slug: { current: string };
  };
  image?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  sortOrder: number;
  isActive: boolean;
}

export interface Collection {
  _id: string;
  name: string;
  slug: { current: string };
  description?: any[];
  products: Product[];
  image?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: {
    asset: {
      _ref: string;
      url: string;
    };
    alt: string;
  };
  mobileImage?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  linkUrl?: string;
  linkText?: string;
  position: string;
  alignment: string;
  overlay: boolean;
  overlayOpacity?: number;
  backgroundColor?: string;
  textColor?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Page {
  _id: string;
  title: string;
  slug: { current: string };
  content: any[];
  excerpt?: string;
  featuredImage?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  template: string;
  seoTitle?: string;
  seoDescription?: string;
  noIndex: boolean;
  noFollow: boolean;
  isActive: boolean;
}

export interface SiteSettings {
  _id: string;
  siteName: string;
  siteTagline?: string;
  siteDescription?: string;
  logo?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  logoWhite?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  favicon?: {
    asset: {
      _ref: string;
      url: string;
    };
  };
  ogImage?: {
    asset: {
      _ref: string;
      url: string;
    };
    alt?: string;
  };
  contactEmail?: string;
  supportEmail?: string;
  phone?: string;
  whatsapp?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    pinterest?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  footerContent?: {
    aboutText?: string;
    copyrightText?: string;
    showPaymentMethods?: boolean;
    paymentMethods?: string[];
  };
  newsletter?: {
    enabled: boolean;
    title?: string;
    description?: string;
    buttonText?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    googleSiteVerification?: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    googleTagManagerId?: string;
  };
  storeSettings?: {
    currency: string;
    currencySymbol: string;
    taxRate?: number;
    freeShippingThreshold?: number;
    showPricesWithTax: boolean;
  };
  announcementBar?: {
    enabled: boolean;
    message?: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

// ============================================
// Product Queries
// ============================================

/**
 * Get all products with optional filtering and pagination
 */
export const getProductsQuery = groq`
  *[_type == "product" && isActive == true] | order(_updatedAt desc) {
    _id,
    _createdAt,
    _updatedAt,
    name,
    slug,
    sku,
    description,
    category->{
      _id,
      name,
      slug
    },
    price,
    compareAtPrice,
    costPrice,
    isActive,
    isFeatured,
    tags,
    seoTitle,
    seoDescription,
    variants,
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }
  }
`;

/**
 * Get products with pagination
 */
export const getProductsPaginatedQuery = groq`
  *[_type == "product" && isActive == true] | order(_updatedAt desc) [$start...$end] {
    _id,
    _createdAt,
    _updatedAt,
    name,
    slug,
    sku,
    description,
    category->{
      _id,
      name,
      slug
    },
    price,
    compareAtPrice,
    isActive,
    isFeatured,
    tags,
    variants,
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }
  }
`;

/**
 * Get a single product by slug
 */
export const getProductBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug && isActive == true][0] {
    _id,
    _createdAt,
    _updatedAt,
    name,
    slug,
    sku,
    description,
    category->{
      _id,
      name,
      slug,
      description,
      image {
        asset->{
          _ref,
          url
        },
        alt
      }
    },
    price,
    compareAtPrice,
    costPrice,
    isActive,
    isFeatured,
    tags,
    seoTitle,
    seoDescription,
    variants,
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }
  }
`;

/**
 * Get featured products
 */
export const getFeaturedProductsQuery = groq`
  *[_type == "product" && isActive == true && isFeatured == true] | order(_updatedAt desc) {
    _id,
    name,
    slug,
    sku,
    price,
    compareAtPrice,
    category->{
      _id,
      name,
      slug
    },
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }[0...1]
  }
`;

/**
 * Get products by category
 */
export const getProductsByCategoryQuery = groq`
  *[_type == "product" && isActive == true && category->slug.current == $categorySlug] | order(_updatedAt desc) {
    _id,
    name,
    slug,
    sku,
    price,
    compareAtPrice,
    category->{
      _id,
      name,
      slug
    },
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }[0...1]
  }
`;

/**
 * Get related products (same category, excluding current product)
 */
export const getRelatedProductsQuery = groq`
  *[_type == "product" && isActive == true && category._ref == $categoryId && _id != $productId] | order(_updatedAt desc) [0...$limit] {
    _id,
    name,
    slug,
    price,
    compareAtPrice,
    category->{
      _id,
      name,
      slug
    },
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }[0...1]
  }
`;

/**
 * Search products by name, description, or tags
 */
export const searchProductsQuery = groq`
  *[_type == "product" && isActive == true && (
    name match $searchTerm ||
    description[][@.children[].text match $searchTerm] ||
    $searchTerm in tags
  )] | score(name match $searchTerm) | order(_score desc) {
    _id,
    name,
    slug,
    price,
    compareAtPrice,
    category->{
      _id,
      name,
      slug
    },
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }[0...1]
  }
`;

/**
 * Get products by tag
 */
export const getProductsByTagQuery = groq`
  *[_type == "product" && isActive == true && $tag in tags] | order(_updatedAt desc) {
    _id,
    name,
    slug,
    price,
    compareAtPrice,
    category->{
      _id,
      name,
      slug
    },
    images[]{
      _key,
      image{
        _ref,
        asset->{
          _ref,
          url,
          metadata { dimensions { width, height } }
        }
      },
      alt,
      isPrimary
    }[0...1]
  }
`;

// ============================================
// Category Queries
// ============================================

/**
 * Get all categories
 */
export const getCategoriesQuery = groq`
  *[_type == "category" && isActive == true] | order(sortOrder asc, name asc) {
    _id,
    name,
    slug,
    description,
    parent->{
      _id,
      name,
      slug
    },
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    sortOrder,
    isActive
  }
`;

/**
 * Get top-level categories (no parent)
 */
export const getTopLevelCategoriesQuery = groq`
  *[_type == "category" && isActive == true && !defined(parent)] | order(sortOrder asc, name asc) {
    _id,
    name,
    slug,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    sortOrder
  }
`;

/**
 * Get category by slug with subcategories
 */
export const getCategoryBySlugQuery = groq`
  *[_type == "category" && slug.current == $slug && isActive == true][0] {
    _id,
    name,
    slug,
    description,
    parent->{
      _id,
      name,
      slug
    },
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    sortOrder,
    seoTitle,
    seoDescription,
    "subcategories": *[_type == "category" && parent._ref == ^._id && isActive == true] | order(sortOrder asc) {
      _id,
      name,
      slug,
      description,
      image {
        asset->{
          _ref,
          url
        },
        alt
      }
    }
  }
`;

/**
 * Get category hierarchy (breadcrumb path)
 */
export const getCategoryHierarchyQuery = groq`
  *[_type == "category" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    parent->{
      _id,
      name,
      slug,
      parent->{
        _id,
        name,
        slug
      }
    }
  }
`;

// ============================================
// Collection Queries
// ============================================

/**
 * Get all active collections
 */
export const getCollectionsQuery = groq`
  *[_type == "collection" && isActive == true] | order(sortOrder asc) {
    _id,
    name,
    slug,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    isActive,
    isFeatured,
    startDate,
    endDate,
    sortOrder
  }
`;

/**
 * Get featured collections
 */
export const getFeaturedCollectionsQuery = groq`
  *[_type == "collection" && isActive == true && isFeatured == true] | order(sortOrder asc) {
    _id,
    name,
    slug,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    startDate,
    endDate
  }
`;

/**
 * Get collection by slug with products
 */
export const getCollectionBySlugQuery = groq`
  *[_type == "collection" && slug.current == $slug && isActive == true][0] {
    _id,
    name,
    slug,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    isActive,
    startDate,
    endDate,
    seoTitle,
    seoDescription,
    "products": products[]->{
      _id,
      name,
      slug,
      price,
      compareAtPrice,
      category->{
        _id,
        name,
        slug
      },
      images[]{
        _key,
        image{
          _ref,
          asset->{
            _ref,
            url,
            metadata { dimensions { width, height } }
          }
        },
        alt,
        isPrimary
      }[0...1]
    }
  }
`;

// ============================================
// Banner Queries
// ============================================

/**
 * Get all active banners
 */
export const getBannersQuery = groq`
  *[_type == "banner" && isActive == true] | order(sortOrder asc) {
    _id,
    title,
    subtitle,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    mobileImage {
      asset->{
        _ref,
        url
      },
      alt
    },
    linkUrl,
    linkText,
    position,
    alignment,
    overlay,
    overlayOpacity,
    backgroundColor,
    textColor,
    startDate,
    endDate,
    sortOrder
  }
`;

/**
 * Get banners by position
 */
export const getBannersByPositionQuery = groq`
  *[_type == "banner" && isActive == true && position == $position] | order(sortOrder asc) {
    _id,
    title,
    subtitle,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    mobileImage {
      asset->{
        _ref,
        url
      },
      alt
    },
    linkUrl,
    linkText,
    alignment,
    overlay,
    overlayOpacity,
    backgroundColor,
    textColor,
    startDate,
    endDate
  }
`;

/**
 * Get homepage banners (with date filtering)
 */
export const getHomepageBannersQuery = groq`
  *[_type == "banner" && isActive == true && position == "home" && 
    (!defined(startDate) || startDate <= now()) &&
    (!defined(endDate) || endDate >= now())
  ] | order(sortOrder asc) {
    _id,
    title,
    subtitle,
    description,
    image {
      asset->{
        _ref,
        url
      },
      alt
    },
    mobileImage {
      asset->{
        _ref,
        url
      },
      alt
    },
    linkUrl,
    linkText,
    alignment,
    overlay,
    overlayOpacity,
    backgroundColor,
    textColor
  }
`;

// ============================================
// Page Queries
// ============================================

/**
 * Get all pages
 */
export const getPagesQuery = groq`
  *[_type == "page" && isActive == true] | order(title asc) {
    _id,
    title,
    slug,
    excerpt,
    template,
    showInNavigation,
    navigationLabel,
    seoTitle,
    seoDescription
  }
`;

/**
 * Get page by slug
 */
export const getPageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug && isActive == true][0] {
    _id,
    title,
    slug,
    content,
    excerpt,
    featuredImage {
      asset->{
        _ref,
        url
      },
      alt
    },
    template,
    seoTitle,
    seoDescription,
    noIndex,
    noFollow
  }
`;

/**
 * Get pages for navigation
 */
export const getNavigationPagesQuery = groq`
  *[_type == "page" && isActive == true && showInNavigation == true] | order(title asc) {
    _id,
    title,
    slug,
    navigationLabel
  }
`;

// ============================================
// Navigation Queries
// ============================================

/**
 * Get navigation menu by location
 */
export const getNavigationByLocationQuery = groq`
  *[_type == "navigation" && isActive == true && location == $location][0] {
    _id,
    name,
    location,
    items[]{
      label,
      linkType,
      internalLink->{
        _id,
        title,
        slug
      },
      externalUrl,
      categoryLink->{
        _id,
        name,
        slug
      },
      collectionLink->{
        _id,
        name,
        slug
      },
      productLink->{
        _id,
        name,
        slug
      },
      openInNewTab,
      highlight,
      children[]{
        label,
        linkType,
        internalLink->{
          _id,
          title,
          slug
        },
        externalUrl,
        categoryLink->{
          _id,
          name,
          slug
        },
        collectionLink->{
          _id,
          name,
          slug
        },
        productLink->{
          _id,
          name,
          slug
        },
        openInNewTab,
        description,
        icon {
          asset->{
            _ref,
            url
          },
          alt
        }
      }
    }
  }
`;

// ============================================
// Site Settings Queries
// ============================================

/**
 * Get site settings (singleton)
 */
export const getSiteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    _id,
    siteName,
    siteTagline,
    siteDescription,
    logo {
      asset->{
        _ref,
        url
      },
      alt
    },
    logoWhite {
      asset->{
        _ref,
        url
      },
      alt
    },
    favicon {
      asset->{
        _ref,
        url
      }
    },
    ogImage {
      asset->{
        _ref,
        url
      },
      alt
    },
    contactEmail,
    supportEmail,
    phone,
    whatsapp,
    address,
    socialLinks,
    footerContent,
    newsletter,
    seo,
    analytics,
    storeSettings,
    announcementBar
  }
`;

// ============================================
// Query Functions
// ============================================

/**
 * Fetch products with pagination
 */
export async function getProducts(start: number = 0, limit: number = 20): Promise<Product[]> {
  return client.fetch(getProductsPaginatedQuery, { start, end: start + limit });
}

/**
 * Fetch a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return client.fetch(getProductBySlugQuery, { slug });
}

/**
 * Fetch featured products
 */
export async function getFeaturedProducts(): Promise<Product[]> {
  return client.fetch(getFeaturedProductsQuery);
}

/**
 * Fetch products by category
 */
export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  return client.fetch(getProductsByCategoryQuery, { categorySlug });
}

/**
 * Fetch related products
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
): Promise<Product[]> {
  return client.fetch(getRelatedProductsQuery, { productId, categoryId, limit });
}

/**
 * Search products
 */
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  return client.fetch(searchProductsQuery, { searchTerm: `*${searchTerm}*` });
}

/**
 * Fetch all categories
 */
export async function getCategories(): Promise<Category[]> {
  return client.fetch(getCategoriesQuery);
}

/**
 * Fetch category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return client.fetch(getCategoryBySlugQuery, { slug });
}

/**
 * Fetch all collections
 */
export async function getCollections(): Promise<Collection[]> {
  return client.fetch(getCollectionsQuery);
}

/**
 * Fetch collection by slug
 */
export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return client.fetch(getCollectionBySlugQuery, { slug });
}

/**
 * Fetch banners by position
 */
export async function getBannersByPosition(position: string): Promise<Banner[]> {
  return client.fetch(getBannersByPositionQuery, { position });
}

/**
 * Fetch homepage banners
 */
export async function getHomepageBanners(): Promise<Banner[]> {
  return client.fetch(getHomepageBannersQuery);
}

/**
 * Fetch page by slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  return client.fetch(getPageBySlugQuery, { slug });
}

/**
 * Fetch navigation by location
 */
export async function getNavigationByLocation(location: string): Promise<any> {
  return client.fetch(getNavigationByLocationQuery, { location });
}

/**
 * Fetch site settings
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(getSiteSettingsQuery);
}

/**
 * Get total product count
 */
export const getProductCountQuery = groq`
  count(*[_type == "product" && isActive == true])
`;

export async function getProductCount(): Promise<number> {
  return client.fetch(getProductCountQuery);
}

/**
 * Get products count by category
 */
export const getProductCountByCategoryQuery = groq`
  count(*[_type == "product" && isActive == true && category->slug.current == $categorySlug])
`;

export async function getProductCountByCategory(categorySlug: string): Promise<number> {
  return client.fetch(getProductCountByCategoryQuery, { categorySlug });
}
