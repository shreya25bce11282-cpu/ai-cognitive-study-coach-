const { Router } = require('express');
const { z } = require('zod');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/goalsController');

const router = Router();

const createSchema = z.object({
  subject: z.string().min(1).max(100).trim(),
  weekly_hours_target: z.number().positive().max(168),
});

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// NOTE: /progress must be declared before the generic listGoals GET remains fine since it's a different path
router.get('/', ctrl.listGoals);
router.get('/progress', ctrl.getProgress);
router.post('/', validate(createSchema, 'body'), ctrl.createGoal);
router.delete('/:id', validate(idSchema, 'params'), ctrl.deleteGoal);

module.exports = router;