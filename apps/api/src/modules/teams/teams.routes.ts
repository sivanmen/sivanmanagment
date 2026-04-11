import { Router } from 'express';
import { teamsController } from './teams.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// All team routes require authentication
router.use(authMiddleware);

// Get teams by user - must be before /:id to avoid route conflict
router.get('/user/:userId', (req, res, next) => teamsController.getTeamsByUser(req, res, next));

// Team CRUD
router.get('/', requireAdmin, (req, res, next) => teamsController.getAll(req, res, next));
router.get('/:id', requireAdmin, (req, res, next) => teamsController.getById(req, res, next));
router.post('/', requireAdmin, (req, res, next) => teamsController.create(req, res, next));
router.put('/:id', requireAdmin, (req, res, next) => teamsController.update(req, res, next));
router.delete('/:id', requireAdmin, (req, res, next) => teamsController.delete(req, res, next));

// Member management
router.post('/:id/members', requireAdmin, (req, res, next) => teamsController.addMember(req, res, next));
router.delete('/:id/members/:userId', requireAdmin, (req, res, next) => teamsController.removeMember(req, res, next));
router.put('/:id/members/:userId', requireAdmin, (req, res, next) => teamsController.updateMemberRole(req, res, next));

// Property assignment
router.put('/:id/properties', requireAdmin, (req, res, next) => teamsController.assignProperties(req, res, next));

// Permission check
router.get('/:id/permissions', requireAdmin, (req, res, next) => teamsController.checkPermission(req, res, next));

export default router;
