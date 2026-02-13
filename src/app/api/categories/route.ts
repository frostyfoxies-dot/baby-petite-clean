import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryWithHierarchy {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  parent: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    productCount: number;
  }>;
  productCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoriesListResponse {
  categories: CategoryWithHierarchy[];
  tree: CategoryTreeNode[];
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
  children: CategoryTreeNode[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function buildCategoryTree(
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
  }>,
  productCounts: Map<string, number>,
  parentId: string | null = null
): Promise<CategoryTreeNode[]> {
  const children = categories.filter((cat) => cat.parentId === parentId);
  
  return Promise.all(
    children.map(async (cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
      productCount: productCounts.get(cat.id) || 0,
      children: await buildCategoryTree(categories, productCounts, cat.id),
    }))
  );
}

// ============================================================================
// GET /api/categories - List all categories with hierarchy
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get all categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, imageUrl: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Get product counts for all categories
    const productCounts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true },
      _count: { id: true },
    });

    const countMap = new Map(
      productCounts.map((item) => [item.categoryId, item._count.id])
    );

    // Transform categories
    const transformedCategories: CategoryWithHierarchy[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      parentId: cat.parentId,
      parent: cat.parent,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        imageUrl: child.imageUrl,
        productCount: countMap.get(child.id) || 0,
      })),
      productCount: countMap.get(cat.id) || 0,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    // Build tree structure
    const tree = await buildCategoryTree(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        parentId: c.parentId,
      })),
      countMap
    );

    const response: CategoriesListResponse = {
      categories: transformedCategories,
      tree,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
