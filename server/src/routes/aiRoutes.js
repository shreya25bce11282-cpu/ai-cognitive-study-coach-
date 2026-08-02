const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/aiController');

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      })
    )
    .optional(),
});

router.get('/insights', ctrl.getInsights);
router.get('/study-plan', ctrl.studyPlan);
router.post('/chat', validate(chatSchema, 'body'), ctrl.chat);

module.exports = router;