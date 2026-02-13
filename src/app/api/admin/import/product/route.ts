/**
 * Admin API: Import Product
 * POST /api/admin/import/product
 * Imports a product from AliExpress to Kids Petite
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getImportService,
  importProduct,
  type ImportProductInput,
  type ImportResult,
} from '@/services/import';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimiter, IMPORT_RATE_LIMIT } from '@/lib/rate-limiter';

// ============================================
// VALIDATION SCHEMA
// ============================================

const importRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  categoryId: z.string().min(1, 'Category ID is required'),
  overrides: z
    .object({
      name: z.string().optional(),
      shortDescription: z.string().optional(),
      tags: z.array(z.string()).optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
    })
    .optional(),
  processImages: z.boolean().default(true),
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
    const rateLimitResult = rateLimiter.limit(user.id, IMPORT_RATE_LIMIT);
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
    const validated = importRequestSchema.safeParse(body);

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

    const { url, categoryId, overrides, processImages } = validated.data;

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

    // Check if product already exists (by AliExpress URL or product ID)
    // Extract product ID from URL for checking
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/(\d+)\.html/);
    const aliExpressProductId = pathMatch ? pathMatch[1] : null;

    if (aliExpressProductId) {
      const existingProduct = await prisma.productSource.findFirst({
        where: { aliExpressProductId },
        select: { id: true, productSlug: true },
      });

      if (existingProduct) {
        return NextResponse.json(
          {
            success: false,
            error: 'Product already imported',
            data: {
              productSourceId: existingProduct.id,
              productSlug: existingProduct.productSlug,
            },
          },
          { status: 409 }
        );
      }
    }

    // Build import input
    const importInput: ImportProductInput = {
      url,
      categoryId,
      overrides,
      processImages,
    };

    // Execute import
    const result: ImportResult = await importProduct(importInput);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Import failed',
          details: result.errorDetails,
        },
        { status: 422 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        productId: result.sanityProductId,
        productSlug: result.productSlug,
        productSourceId: result.productSourceId,
      },
    });
  } catch (error) {
    console.error('Import product error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during import',
      },
      { status: 500 }
    );
  }
}
