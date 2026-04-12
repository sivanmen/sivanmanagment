import { startIcalSyncJob } from './ical-sync.job';
import { startExpenseExpiryJob } from './expense-expiry.job';

/**
 * Start all scheduled background jobs.
 * Should be called once after the server begins listening.
 */
export function startAllJobs(): void {
  console.log('[JOBS] Initializing background jobs...');

  startIcalSyncJob();
  startExpenseExpiryJob();

  console.log('[JOBS] All background jobs registered');
}
