'use server';

/**
 * Import Server Actions
 * Server actions for product import from AliExpress
 */

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import {
  getImportService,
  previewImport as previewImportService,
  importProduct as importProductService,
  type ImportProductInput,
  type ImportPreview,
  type ImportResult,
  type ImportJobStatus,
} from '@/services/import';
import {
  createJob,
  updateJob,
  getJob,
} from '@/app/api/admin/import/status/[jobId]/route';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Result type for server actions
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const previewImportSchema = z.object({
  url: z.string().url('Invalid AliExpress URL'),
  categoryId: z.string().min(1, 'Category is required'),
});

const importProductSchema = z.object({
  url: z.string().url('Invalid AliExpress URL'),
  categoryId: z.string().min(1, 'Category is required'),
  overrides: z
    .object({
      name: z.string().min(1).max(200).optional(),
      shortDescription: z.string().max(300).optional(),
      tags: z.array(z.string().max(50)).max(10).optional(),
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
    })
    .optional(),
  processImages: z.boolean().default(true),
});

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Preview product from AliExpress URL
 *
 * Fetches product data from AliExpress and returns a preview
 * without committing any changes.
 *
 * @param url - AliExpress product URL
 * @param categoryId - Target category ID
 * @returns Preview data or error
 *
 * @example
 * ```ts
 * const result = await previewImportProduct(
 *   'https://www.aliexpress.com/item/123456.html',
 *   'category-123'
 * );
 * if (result.success) {
 *   console.log(result.data.transformed.name);
 * }
 * ```
 */
export async function previewImportProduct(
  url: string,
  categoryId: string
): Promise<ActionResult<ImportPreview>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check admin role
    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    // Validate input
    const validated = previewImportSchema.safeParse({ url, categoryId });
    if (!validated.success) {
      return {
        success: false,
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    // Get preview
    const preview = await previewImportService(url, categoryId);

    return {
      success: true,
      data: preview,
    };
  } catch (error) {
    console.error('Preview import error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview product',
    };
  }
}

/**
 * Import product with selected category
 *
 * Imports a product from AliExpress to Kids Petite.
 *
 * @param url - AliExpress product URL
 * @param categoryId - Target category ID
 * @param overrides - Optional overrides for transformed data
 * @returns Import result with product IDs
 *
 * @example
 * ```ts
 * const result = await importProduct(
 *   'https://www.aliexpress.com/item/123456.html',
 *   'category-123',
 *   { name: 'Custom Product Name' }
 * );
 * if (result.success) {
 *   console.log('Imported product:', result.data.productId);
 * }
 * ```
 */
export async function importProduct(
  url: string,
  categoryId: string,
  overrides?: ImportProductInput['overrides']
): Promise<ActionResult<{ productId: string; sanityId: string; productSlug: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check admin role
    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    // Validate input
    const validated = importProductSchema.safeParse({ url, categoryId, overrides });
    if (!validated.success) {
      return {
        success: false,
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    // Check for duplicate import
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/(\d+)\.html/);
    const aliExpressProductId = pathMatch ? pathMatch[1] : null;

    if (aliExpressProductId) {
      const existingProduct = await prisma.productSource.findFirst({
        where: { aliExpressProductId },
        select: { id: true, sanityProductId: true, productSlug: true },
      });

      if (existingProduct) {
        return {
          success: false,
          error: 'Product already imported',
          data: {
            productId: existingProduct.sanityProductId,
            sanityId: existingProduct.sanityProductId,
            productSlug: existingProduct.productSlug,
          },
        };
      }
    }

    // Execute import
    const input: ImportProductInput = {
      url,
      categoryId,
      overrides,
      processImages: true,
    };

    const result: ImportResult = await importProductService(input);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Import failed',
      };
    }

    // Revalidate relevant paths
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidateTag('products');

    return {
      success: true,
      data: {
        productId: result.sanityProductId || '',
        sanityId: result.sanityProductId || '',
        productSlug: result.productSlug || '',
      },
    };
  } catch (error) {
    console.error('Import product error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import product',
    };
  }
}

/**
 * Get import job status
 *
 * Checks the status of an async import job.
 *
 * @param jobId - Job ID to check
 * @returns Job status information
 *
 * @example
 * ```ts
 * const result = await getImportStatus('job-123');
 * if (result.success && result.data.status === 'completed') {
 *   console.log('Import completed!');
 * }
 * ```
 */
export async function getImportStatus(jobId: string): Promise<ActionResult<ImportJobStatus>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check admin role
    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    // Get job status from database
    const job = await getJob(jobId);

    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    return {
      success: true,
      data: job,
    };
  } catch (error) {
    console.error('Get import status error:', error);
    return {
      success: false,
      error: 'Failed to get job status',
    };
  }
}

/**
 * Start async import job
 *
 * Starts an asynchronous import job and returns the job ID.
 * Use getImportStatus to check progress.
 *
 * @param url - AliExpress product URL
 * @param categoryId - Target category ID
 * @param overrides - Optional overrides
 * @returns Job ID for tracking
 *
 * @example
 * ```ts
 * const result = await startAsyncImport(
 *   'https://www.aliexpress.com/item/123456.html',
 *   'category-123'
 * );
 * if (result.success) {
 *   // Poll for status
 *   const status = await getImportStatus(result.data.jobId);
 * }
 * ```
 */
export async function startAsyncImport(
  url: string,
  categoryId: string,
  overrides?: ImportProductInput['overrides']
): Promise<ActionResult<{ jobId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check admin role
    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    // Validate input
    const validated = importProductSchema.safeParse({ url, categoryId, overrides });
    if (!validated.success) {
      return {
        success: false,
        fieldErrors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Create job in database
    const jobId = crypto.randomUUID();
    await createJob(jobId, user.id);

    // Start async import (don't await)
    (async () => {
      try {
        await updateJob(jobId, { status: 'processing', progress: 10, currentStep: 'Starting import' });

        const input: ImportProductInput = {
          url,
          categoryId,
          overrides,
          processImages: true,
        };

        await updateJob(jobId, { progress: 20, currentStep: 'Fetching product data' });
        const result = await importProductService(input);

        if (result.success) {
          await updateJob(jobId, {
            status: 'completed',
            progress: 100,
            currentStep: 'Import completed',
            result,
          });
        } else {
          await updateJob(jobId, {
            status: 'failed',
            progress: 100,
            error: result.error || 'Import failed',
          });
        }
      } catch (error) {
        await updateJob(jobId, {
          status: 'failed',
          progress: 100,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return {
      success: true,
      data: { jobId },
    };
  } catch (error) {
    console.error('Start async import error:', error);
    return {
      success: false,
      error: 'Failed to start import',
    };
  }
}

/**
 * Cancel import job
 *
 * Attempts to cancel a pending or processing import job.
 *
 * @param jobId - Job ID to cancel
 * @returns Success or error
 */
export async function cancelImportJob(jobId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Check admin role
    if (user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Admin access required',
      };
    }

    const job = await getJob(jobId);
    if (!job) {
      return {
        success: false,
        error: 'Job not found',
      };
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return {
        success: false,
        error: 'Cannot cancel a finished job',
      };
    }

    // Mark as failed (actual cancellation would require job queue integration)
    await updateJob(jobId, {
      status: 'failed',
      error: 'Cancelled by user',
    });

    return { success: true };
  } catch (error) {
    console.error('Cancel import job error:', error);
    return {
      success: false,
      error: 'Failed to cancel job',
    };
  }
}
