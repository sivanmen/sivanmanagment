import { Router } from 'express';
import { whatsappWebhookController } from './whatsapp-webhook.controller';

const router = Router();

// GET  / — Verification ping (Evolution API may hit this to confirm the URL)
router.get('/', (req, res) => whatsappWebhookController.verify(req, res));

// POST / — Incoming WhatsApp messages from Evolution API
router.post('/', (req, res) => whatsappWebhookController.handleIncoming(req, res));

export default router;
