const { Router } = require('express');
const ctrl = require('../controllers/gamificationController');

const router = Router();

router.get('/stats', ctrl.getStats);
router.get('/achievements', ctrl.getAchievements);
router.get('/streak', ctrl.getStreak);

module.exports = router;