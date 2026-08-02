const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/sessionController');

const router = Router();

const startSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(100).trim(),
  mode: z.enum(['classic', 'pomodoro']).optional(),
});

const endSchema = z.object({
  session_id: z.number().int().positive(),
  focus_rating: z.number().int().min(1).max(10),
  fatigue_rating: z.number().int().min(1).max(10),
  notes: z.string().max(4000).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(10).optional().nullable(),
  pomodoro_count: z.number().int().min(0).max(100).optional().nullable(),
});

router.get('/', ctrl.listSessions);
router.post('/start', validate(startSchema, 'body'), ctrl.startSession);
router.post('/end', validate(endSchema, 'body'), ctrl.endSession);

module.exports = router;