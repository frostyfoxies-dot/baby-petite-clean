/**
 * Admin API: Import Job Status
 * GET /api/admin/import/status/[jobId]
 * Checks the status of an async import job
 * 
 * Uses database-backed job storage for persistence across server restarts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { type ImportJobStatus } from '@/services/import';

// ============================================
// DATABASE-BACKED JOB STORE FUNCTIONS
// ============================================

/**
 * Create a new job entry in the database
 */
export async function createJob(jobId: string, userId?: string): Promise<ImportJobStatus> {
  const job = await prisma.importJob.create({
    data: {
      jobId,
      status: 'pending',
      progress: 0,
      userId,
    },
  });

  return {
    jobId: job.jobId,
    status: job.status as ImportJobStatus['status'],
    progress: job.progress,
    currentStep: job.currentStep || undefined,
    result: job.result as ImportJobStatus['result'],
    error: job.error || undefined,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

/**
 * Update job status in the database
 */
export async function updateJob(
  jobId: string,
  update: Partial<ImportJobStatus>
): Promise<ImportJobStatus | null> {
  const job = await prisma.importJob.update({
    where: { jobId },
    data: {
      status: update.status,
      progress: update.progress,
      currentStep: update.currentStep,
      result: update.result,
      error: update.error,
    },
  });

  if (!job) return null;

  return {
    jobId: job.jobId,
    status: job.status as ImportJobStatus['status'],
    progress: job.progress,
    currentStep: job.currentStep || undefined,
    result: job.result as ImportJobStatus['result'],
    error: job.error || undefined,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

/**
 * Get job status from the database
 */
export async function getJob(jobId: string): Promise<ImportJobStatus | null> {
  const job = await prisma.importJob.findUnique({
    where: { jobId },
  });

  if (!job) return null;

  return {
    jobId: job.jobId,
    status: job.status as ImportJobStatus['status'],
    progress: job.progress,
    currentStep: job.currentStep || undefined,
    result: job.result as ImportJobStatus['result'],
    error: job.error || undefined,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

/**
 * Remove old completed jobs (cleanup)
 */
export async function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const result = await prisma.importJob.deleteMany({
    where: {
      status: { in: ['completed', 'failed'] },
      updatedAt: { lt: cutoff },
    },
  });
  return result.count;
}

// ============================================
// API HANDLER
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    // Get job ID from params
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job status from database
    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Return job status
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while fetching job status',
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE HANDLER (for cleanup)
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Remove job from database
    try {
      await prisma.importJob.delete({
        where: { jobId },
      });
      return NextResponse.json({
        success: true,
        data: { deleted: true },
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: { deleted: false },
      });
    }
  } catch (error) {
    console.error('Delete job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while deleting job',
      },
      { status: 500 }
    );
  }
}
