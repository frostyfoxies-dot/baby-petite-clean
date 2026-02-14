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
import { getJob } from '@/lib/import-job';

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
