import { NextRequest, NextResponse } from 'next/server';
import { searchProducts, AlgoliaProduct } from '@/lib/algolia';
import { z } from 'zod';
import { AppError, BadRequestError } from '@/lib/errors';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating']).default('relevance'),
});

export type SearchQueryParams = z.infer<typeof searchQuerySchema>;

export interface SearchResultItem {
  objectID: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  categoryId: string;
  categorySlug: string;
  brand: string | null;
  tags: string[];
  colors: string[];
  sizes: string[];
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
  _highlightResult?: {
    name?: { value: string; matchLevel: string };
    description?: { value: string; matchLevel: string };
  };
}

export interface SearchResponse {
  results: SearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  query: string;
  processingTimeMS: number;
  facets: {
    categories: Array<{ name: string; count: number }>;
    brands: Array<{ name: string; count: number }>;
    colors: Array<{ name: string; count: number }>;
    sizes: Array<{ name: string; count: number }>;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildFilters(params: z.infer<typeof searchQuerySchema>): string {
  const filters: string[] = [];

  if (params.category) {
    filters.push(`categorySlug:"${params.category}"`);
  }

  if (params.brand) {
    filters.push(`brand:"${params.brand}"`);
  }

  if (params.minPrice !== undefined) {
    filters.push(`price >= ${params.minPrice}`);
  }

  if (params.maxPrice !== undefined) {
    filters.push(`price <= ${params.maxPrice}`);
  }

  if (params.size) {
    filters.push(`sizes:"${params.size}"`);
  }

  if (params.color) {
    filters.push(`colors:"${params.color}"`);
  }

  if (params.inStock !== undefined) {
    filters.push(`inStock:${params.inStock}`);
  }

  return filters.join(' AND ');
}

function mapSortToAlgolia(sort: string): 'price_asc' | 'price_desc' | 'newest' | 'rating' | undefined {
  switch (sort) {
    case 'price_asc':
      return 'price_asc';
    case 'price_desc':
      return 'price_desc';
    case 'newest':
      return 'newest';
    case 'rating':
      return 'rating';
    case 'relevance':
    default:
      return undefined;
  }
}

// ============================================================================
// GET /api/products/search - Search products using Algolia
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = searchQuerySchema.safeParse({
      q: searchParams.get('q') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      size: searchParams.get('size') || undefined,
      color: searchParams.get('color') || undefined,
      brand: searchParams.get('brand') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      sort: searchParams.get('sort') || undefined,
    });

    if (!queryParams.success) {
      throw new BadRequestError('Invalid search parameters', queryParams.error.flatten());
    }

    const params = queryParams.data;

    // Build filters
    const filters = buildFilters(params);

    // Perform search
    const searchResult = await searchProducts(params.q, {
      page: params.page,
      hitsPerPage: params.limit,
      filters: filters || undefined,
      facets: ['category', 'brand', 'colors', 'sizes'],
      sort: mapSortToAlgolia(params.sort),
    });

    // Transform results
    const results: SearchResultItem[] = searchResult.hits.map((hit) => ({
      objectID: hit.objectID,
      name: hit.name,
      slug: hit.slug,
      description: hit.description,
      price: hit.price,
      compareAtPrice: hit.compareAtPrice,
      category: hit.category,
      categoryId: hit.categoryId,
      categorySlug: hit.categorySlug,
      brand: hit.brand,
      tags: hit.tags,
      colors: hit.colors,
      sizes: hit.sizes,
      images: hit.images,
      inStock: hit.inStock,
      stockQuantity: hit.stockQuantity,
      rating: hit.rating,
      reviewCount: hit.reviewCount,
      createdAt: hit.createdAt,
      updatedAt: hit.updatedAt,
      _highlightResult: hit._highlightResult as SearchResultItem['_highlightResult'],
    }));

    // Extract facets from search result
    const facets = {
      categories: [] as Array<{ name: string; count: number }>,
      brands: [] as Array<{ name: string; count: number }>,
      colors: [] as Array<{ name: string; count: number }>,
      sizes: [] as Array<{ name: string; count: number }>,
    };

    // Note: Facets would come from Algolia's facet response
    // This is a simplified version - actual implementation would parse facets from searchResult

    const response: SearchResponse = {
      results,
      pagination: {
        page: searchResult.page,
        limit: searchResult.hitsPerPage,
        totalItems: searchResult.nbHits,
        totalPages: searchResult.nbPages,
        hasNextPage: searchResult.page < searchResult.nbPages - 1,
        hasPreviousPage: searchResult.page > 0,
      },
      query: searchResult.query,
      processingTimeMS: searchResult.processingTimeMS,
      facets,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
