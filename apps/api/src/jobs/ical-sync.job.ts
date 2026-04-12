import cron from 'node-cron';
import { icalSyncService } from '../modules/calendar/ical-sync.service';

const LOG_PREFIX = '[JOB:iCal-Sync]';
let isSyncing = false;

async function runSync(): Promise<void> {
  if (isSyncing) {
    console.log(`${LOG_PREFIX} Sync already in progress, skipping`);
    return;
  }

  isSyncing = true;
  const startTime = Date.now();

  try {
    console.log(`${LOG_PREFIX} Starting iCal feed sync...`);
    const summary = await icalSyncService.syncAllFeeds();
    const durationMs = Date.now() - startTime;

    console.log(
      `${LOG_PREFIX} Sync completed in ${durationMs}ms — ` +
        `total: ${summary.total}, synced: ${summary.synced}, failed: ${summary.failed}`,
    );

    // Log individual feed results if any had issues
    for (const r of summary.results) {
      if (r.result?.errors?.length > 0 || r.result?.conflicts?.length > 0) {
        console.warn(
          `${LOG_PREFIX} Feed "${r.channelName}" (${r.feedId}): ` +
            `errors=${r.result.errors?.length ?? 0}, conflicts=${r.result.conflicts?.length ?? 0}`,
        );
      }
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`${LOG_PREFIX} Sync failed after ${durationMs}ms:`, error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Start the iCal sync cron job.
 * - Runs every 15 minutes.
 * - Performs an initial sync 30 seconds after startup.
 * - Guards against concurrent runs.
 */
export function startIcalSyncJob(): void {
  // Schedule recurring sync every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    runSync();
  });

  console.log(`${LOG_PREFIX} Scheduled — every 15 minutes`);

  // Run initial sync 30 seconds after startup
  setTimeout(() => {
    console.log(`${LOG_PREFIX} Running initial sync...`);
    runSync();
  }, 30_000);
}
