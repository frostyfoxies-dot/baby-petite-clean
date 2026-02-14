/**
 * Import Job Utility Functions
 * Database-backed job storage functions for async import operations
 */

import { prisma } from '@/lib/prisma';
import { type ImportJobStatus } from '@/services/import';

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
      result: update.result as object | undefined,
      error: update.error,
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
 * Get job status from the database
 */
export async function getJob(jobId: string): Promise<ImportJobStatus | null> {
  const job = await prisma.importJob.findUnique({
    where: { jobId },
  });

  if (!job) {
    return null;
  }

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
 * Cleanup old completed/failed jobs
 */
export async function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs);
  
  const result = await prisma.importJob.deleteMany({
    where: {
      status: { in: ['completed', 'failed', 'cancelled'] },
      updatedAt: { lt: cutoff },
    },
  });

  return result.count;
}
