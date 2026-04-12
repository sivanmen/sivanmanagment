import cron from 'node-cron';
import { expenseApprovalService } from '../modules/expenses/expense-approval.service';

const LOG_PREFIX = '[JOB:Expense-Expiry]';

async function runExpiryCheck(): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(`${LOG_PREFIX} Checking for expired approval requests...`);
    const expiredCount = await expenseApprovalService.expireOldRequests();
    const durationMs = Date.now() - startTime;

    if (expiredCount > 0) {
      console.log(
        `${LOG_PREFIX} Expired ${expiredCount} approval request(s) in ${durationMs}ms`,
      );
    } else {
      console.log(`${LOG_PREFIX} No expired requests found (${durationMs}ms)`);
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`${LOG_PREFIX} Expiry check failed after ${durationMs}ms:`, error);
  }
}

/**
 * Start the expense expiry cron job.
 * Runs every hour to mark expired approval requests.
 */
export function startExpenseExpiryJob(): void {
  cron.schedule('0 * * * *', () => {
    runExpiryCheck();
  });

  console.log(`${LOG_PREFIX} Scheduled — every hour`);
}
