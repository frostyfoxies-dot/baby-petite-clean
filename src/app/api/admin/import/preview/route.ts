/**
 * Admin API: Preview Import
 * POST /api/admin/import/preview
 * Previews product data from an AliExpress URL without committing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getImportService, type ImportPreview } from '@/services/import';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimiter, PREVIEW_RATE_LIMIT } from '@/lib/rate-limiter';

// ============================================
// VALIDATION SCHEMA
// ============================================

const previewRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  categoryId: z.string().min(1, 'Category ID is required'),
});

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin role
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = rateLimiter.limit(user.id, PREVIEW_RATE_LIMIT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.resetAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.resetAfter),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          }
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = previewRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          fieldErrors: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { url, categoryId } = validated.data;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get import service and preview
    const importService = getImportService();

    let preview: ImportPreview;
    try {
      preview = await importService.previewImport(url, categoryId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch product data: ${errorMessage}`,
        },
        { status: 422 }
      );
    } finally {
      await importService.close();
    }

    // Return preview data
    return NextResponse.json({
      success: true,
      data: {
        // Original AliExpress data
        original: {
          productId: preview.aliExpressData.productId,
          title: preview.aliExpressData.title,
          price: preview.aliExpressData.price,
          originalPrice: preview.aliExpressData.originalPrice,
          currency: preview.aliExpressData.currency,
          images: preview.aliExpressData.images.slice(0, 5), // Limit to 5 for preview
          variantsCount: preview.aliExpressData.variants.length,
          supplierName: preview.aliExpressData.supplierName,
          supplierRating: preview.aliExpressData.supplierRating,
          productUrl: preview.aliExpressData.productUrl,
        },
        // Transformed data
        transformed: {
          name: preview.transformedProduct.name,
          slug: preview.transformedProduct.slug,
          shortDescription: preview.transformedProduct.shortDescription,
          tags: preview.transformedProduct.tags,
          variants: preview.transformedProduct.variants.map(v => ({
            sku: v.sku,
            name: v.name,
            size: v.size,
            color: v.color,
            price: v.price,
            stock: v.stock,
          })),
        },
        // Category and pricing
        category: {
          id: category.id,
          name: category.name,
          pricing: preview.categoryPricing,
        },
        // Stock status
        stockStatus: preview.stockStatus,
        // Price breakdown
        pricing: preview.priceBreakdown,
        // Warnings
        warnings: preview.warnings,
      },
    });
  } catch (error) {
    console.error('Preview import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while previewing the product',
      },
      { status: 500 }
    );
  }
}
