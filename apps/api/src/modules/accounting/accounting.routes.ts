import { Router } from 'express';
import { accountingController } from './accounting.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

// Chart of Accounts
router.get('/accounts', (req, res, next) => accountingController.getAccounts(req, res, next));
router.get('/accounts/:id', (req, res, next) => accountingController.getAccountById(req, res, next));
router.post('/accounts', requireAdmin, (req, res, next) => accountingController.createAccount(req, res, next));
router.put('/accounts/:id', requireAdmin, (req, res, next) => accountingController.updateAccount(req, res, next));

// Journal Entries
router.get('/journal', (req, res, next) => accountingController.getJournalEntries(req, res, next));
router.get('/journal/:id', (req, res, next) => accountingController.getJournalEntryById(req, res, next));
router.post('/journal', requireAdmin, (req, res, next) => accountingController.createJournalEntry(req, res, next));
router.post('/journal/:id/post', requireAdmin, (req, res, next) => accountingController.postJournalEntry(req, res, next));
router.post('/journal/:id/void', requireAdmin, (req, res, next) => accountingController.voidJournalEntry(req, res, next));

// Reports
router.get('/trial-balance', (req, res, next) => accountingController.getTrialBalance(req, res, next));
router.get('/profit-and-loss', (req, res, next) => accountingController.getProfitAndLoss(req, res, next));
router.get('/balance-sheet', (req, res, next) => accountingController.getBalanceSheet(req, res, next));
router.get('/tax-report', (req, res, next) => accountingController.getTaxReport(req, res, next));

export default router;
