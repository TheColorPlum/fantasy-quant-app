/**
 * SyncJob state machine and worker loop for PR05
 * States: scheduled → running → done | error
 */

import { db } from '@/lib/database';
import { performBulkIngest } from '@/lib/ingest/bulk';

export interface CreateSyncJobArgs {
  leagueId: string;
  season: number;
  cookies?: {
    espnS2: string;
    SWID: string;
  };
  createdBy: string;
}

export interface RunSyncJobArgs {
  leagueId: number;
  season: number;
  cookies?: {
    espnS2: string;
    SWID: string;
  };
}

/**
 * Creates a new sync job in scheduled state
 */
export async function createSyncJob(args: CreateSyncJobArgs) {
  const syncJob = await db.syncJob.create({
    data: {
      leagueId: args.leagueId,
      jobType: 'BULK_INGEST',
      status: 'scheduled',
      scheduledFor: new Date()
    }
  });

  return syncJob;
}

/**
 * Runs a sync job, transitioning through states
 */
export async function runSyncJob(jobId: string, args: RunSyncJobArgs) {
  try {
    // Transition to running state
    await db.syncJob.update({
      where: { id: jobId },
      data: {
        status: 'running',
        startedAt: new Date()
      }
    });

    // Perform the bulk ingestion with advisory lock
    // Advisory lock example per PR05 spec
    await db.$executeRawUnsafe(
      'SELECT pg_advisory_xact_lock($1, $2)',
      args.leagueId,
      args.season
    );

    const result = await performBulkIngest({
      leagueId: args.leagueId,
      seasonId: args.season,
      cookies: args.cookies
    });

    // Transition to done or error state
    await db.syncJob.update({
      where: { id: jobId },
      data: {
        status: result.success ? 'done' : 'error',
        finishedAt: new Date(),
        error: result.error || null
      }
    });

    return result;

  } catch (error) {
    // Transition to error state
    await db.syncJob.update({
      where: { id: jobId },
      data: {
        status: 'error',
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets the next scheduled job for processing
 */
export async function getNextScheduledJob() {
  // Use FOR UPDATE SKIP LOCKED per PR05 spec
  const job = await db.$queryRaw`
    SELECT * FROM "SyncJob" 
    WHERE status = 'scheduled' 
    AND ("scheduledFor" IS NULL OR "scheduledFor" <= NOW())
    ORDER BY "scheduledFor" ASC NULLS FIRST
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  return Array.isArray(job) && job.length > 0 ? job[0] : null;
}

/**
 * Simple worker loop that processes scheduled jobs
 */
export async function processJobs() {
  console.log('Starting job processing loop...');
  
  while (true) {
    try {
      const job = await getNextScheduledJob();
      
      if (!job) {
        // No jobs to process, sleep for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      console.log(`Processing job ${job.id} for league ${job.leagueId}`);
      
      // Process the job based on its type
      if (job.jobType === 'BULK_INGEST') {
        await runSyncJob(job.id, {
          leagueId: parseInt(job.leagueId),
          season: 2025, // Default to current season
          cookies: undefined // Would need to be stored/retrieved properly
        });
      }
      
    } catch (error) {
      console.error('Job processing error:', error);
      // Continue processing other jobs even if one fails
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}