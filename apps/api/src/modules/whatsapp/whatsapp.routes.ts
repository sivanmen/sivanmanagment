import { Router } from 'express';
import { whatsAppController } from './whatsapp.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// ── Webhook (no auth -- called by Evolution API) ──
router.post('/webhook', (req, res, next) => whatsAppController.webhook(req, res, next));

// All other routes require authentication
router.use(authMiddleware);

// Stats
router.get('/stats', (req, res, next) => whatsAppController.getStats(req, res, next));

// Contacts
router.get('/contacts', (req, res, next) => whatsAppController.getContacts(req, res, next));
router.get('/contacts/:id', (req, res, next) => whatsAppController.getContactById(req, res, next));
router.post('/contacts', (req, res, next) => whatsAppController.createContact(req, res, next));
router.put('/contacts/:id', (req, res, next) => whatsAppController.updateContact(req, res, next));

// Messages
router.get('/messages', (req, res, next) => whatsAppController.getHistory(req, res, next));
router.get('/messages/thread/:contactId', (req, res, next) => whatsAppController.getThread(req, res, next));
router.post('/messages/send', (req, res, next) => whatsAppController.sendMessage(req, res, next));
router.post('/messages/send-template', (req, res, next) => whatsAppController.sendTemplateMessage(req, res, next));
router.put('/messages/:id/status', (req, res, next) => whatsAppController.updateMessageStatus(req, res, next));

// Templates
router.get('/templates', (req, res, next) => whatsAppController.getTemplates(req, res, next));
router.get('/templates/:id', (req, res, next) => whatsAppController.getTemplateById(req, res, next));
router.post('/templates', requireAdmin, (req, res, next) => whatsAppController.createTemplate(req, res, next));
router.put('/templates/:id', requireAdmin, (req, res, next) => whatsAppController.updateTemplate(req, res, next));

export default router;
